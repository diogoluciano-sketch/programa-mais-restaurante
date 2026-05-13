import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/constants";
import {
  Download, Mail, Upload, Users, CheckCircle2, AlertTriangle,
  HelpCircle, Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RSVP {
  id: string;
  userName: string;
  userEmail: string;
  date: string;
  createdAt?: { toDate?: () => Date; seconds?: number };
}

interface CatracaEntry {
  nome: string;
  email: string;
}

interface MatchResult {
  presentes: Array<RSVP & { catracaMatch: CatracaEntry }>;
  ausentes: RSVP[];
  semConfirmacao: CatracaEntry[];
}

interface GmailConfig {
  remetente: string;
  assunto: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GMAIL_CONFIG_KEY = "relatorio_gmail_config";

function getGmailConfig(): GmailConfig {
  try {
    const stored = localStorage.getItem(GMAIL_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return { remetente: "", assunto: "" };
}

function saveGmailConfig(config: GmailConfig) {
  localStorage.setItem(GMAIL_CONFIG_KEY, JSON.stringify(config));
}

// Remove diacritics and normalize for fuzzy name matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

function parseXlsxCatraca(rows: any[][]): CatracaEntry[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h: any) => String(h ?? "").toLowerCase().trim());

  let emailIdx = header.findIndex(h => h.includes("email") || h.includes("e-mail") || h.includes("mail"));
  let nomeIdx = header.findIndex(h =>
    h.includes("nome") || h.includes("name") || h.includes("colaborador") ||
    h.includes("funcionario") || h.includes("funcionário")
  );

  // Auto-detect by scanning first data row for @ symbol
  if (emailIdx === -1 && nomeIdx === -1) {
    const sample = rows[1] ?? [];
    emailIdx = sample.findIndex((cell: any) => String(cell ?? "").includes("@"));
    nomeIdx = emailIdx === 0 ? 1 : 0;
  }

  return rows.slice(1)
    .filter(row => row.length > 0)
    .map(row => ({
      email: emailIdx !== -1 ? String(row[emailIdx] ?? "").toLowerCase().trim() : "",
      nome: nomeIdx !== -1 ? String(row[nomeIdx] ?? "").trim() : "",
    }))
    .filter(e => e.email || e.nome);
}

function findHtmlBody(parts: any[]): string | null {
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) return part.body.data as string;
    if (part.parts) {
      const found = findHtmlBody(part.parts);
      if (found) return found;
    }
  }
  return null;
}

function parseCatracaFromHtml(html: string): CatracaEntry[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length < 2) continue;

    const headerCells = Array.from(rows[0].querySelectorAll("th, td"));
    const headers = headerCells.map(c => normalizeName(c.textContent ?? ""));

    const nomeIdx = headers.findIndex(h =>
      h.includes("nome") || h.includes("name") || h.includes("colaborador")
    );
    if (nomeIdx === -1) continue;

    const emailIdx = headers.findIndex(h => h.includes("email") || h.includes("mail"));
    // Filter rows where "Almoçou" = "Sim" when that column exists
    const almoçouIdx = headers.findIndex(h => h.includes("almocou"));

    const entries: CatracaEntry[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll("td"));
      if (cells.length === 0) continue;
      if (almoçouIdx !== -1) {
        const val = cells[almoçouIdx]?.textContent?.trim().toLowerCase() ?? "";
        if (val !== "sim" && val !== "yes") continue;
      }
      const nome = cells[nomeIdx]?.textContent?.trim() ?? "";
      const email = emailIdx !== -1 ? (cells[emailIdx]?.textContent?.trim().toLowerCase() ?? "") : "";
      if (nome) entries.push({ nome, email });
    }
    if (entries.length > 0) return entries;
  }
  return [];
}

function matchData(rsvps: RSVP[], catraca: CatracaEntry[]): MatchResult {
  const used = new Set<number>();

  const presentes: MatchResult["presentes"] = [];
  const ausentes: RSVP[] = [];

  for (const rsvp of rsvps) {
    // 1st: email match (most reliable)
    let idx = catraca.findIndex((c, i) =>
      !used.has(i) && c.email && rsvp.userEmail &&
      c.email === rsvp.userEmail.toLowerCase()
    );

    // 2nd: normalized name match as fallback
    if (idx === -1) {
      const rsvpNorm = normalizeName(rsvp.userName);
      idx = catraca.findIndex((c, i) =>
        !used.has(i) && c.nome && normalizeName(c.nome) === rsvpNorm
      );
    }

    if (idx !== -1) {
      used.add(idx);
      presentes.push({ ...rsvp, catracaMatch: catraca[idx] });
    } else {
      ausentes.push(rsvp);
    }
  }

  return {
    presentes,
    ausentes,
    semConfirmacao: catraca.filter((_, i) => !used.has(i)),
  };
}

function rsvpHora(r: RSVP): string {
  try {
    const d = r.createdAt?.toDate?.() ?? (r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null);
    return d ? format(d, "HH:mm") : "";
  } catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────

const Relatorio = () => {
  const { user, loading } = useAuth();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);

  const [catraca, setCatraca] = useState<CatracaEntry[]>([]);
  const [catracaMeta, setCatracaMeta] = useState<{ by: string; at: Date | null } | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  const [gmailConfig, setGmailConfig] = useState<GmailConfig>(getGmailConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState<GmailConfig>(getGmailConfig);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const result: MatchResult | null = catraca.length > 0 ? matchData(rsvps, catraca) : null;

  // Load RSVPs + catraca for selected date
  useEffect(() => {
    if (!selectedDate || !isUserAdmin(user?.email)) return;
    let cancelled = false;

    setIsLoadingRsvps(true);
    setCatraca([]);
    setCatracaMeta(null);

    getDocs(query(collection(db, "rsvps"), where("date", "==", selectedDate)))
      .then(snap => {
        if (!cancelled) setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() } as RSVP)));
      })
      .catch(() => toast.error("Erro ao carregar confirmações"))
      .finally(() => { if (!cancelled) setIsLoadingRsvps(false); });

    getDoc(doc(db, "catraca", selectedDate))
      .then(snap => {
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          setCatraca(data.entries ?? []);
          setCatracaMeta({
            by: data.updatedBy ?? "",
            at: data.updatedAt?.toDate?.() ?? null,
          });
        }
      })
      .catch(() => { /* silent — catraca ainda não importada */ });

    return () => { cancelled = true; };
  }, [selectedDate, user?.email]);

  if (loading) return null;
  if (!isUserAdmin(user?.email)) {
    window.location.href = "/";
    return null;
  }

  // ── Persist catraca to Firestore ─────────────────────────────────────────────

  const saveCatraca = async (entries: CatracaEntry[]) => {
    setCatraca(entries);
    const meta = { by: user?.email ?? "", at: new Date() };
    setCatracaMeta(meta);
    await setDoc(doc(db, "catraca", selectedDate), {
      entries,
      updatedBy: meta.by,
      updatedAt: serverTimestamp(),
    });
  };

  // ── Gmail fetch ──────────────────────────────────────────────────────────────

  const handleFetchGmail = async () => {
    if (!gmailConfig.remetente && !gmailConfig.assunto) {
      setConfigOpen(true);
      toast.info("Configure o remetente ou assunto do e-mail primeiro.");
      return;
    }

    setIsLoadingGmail(true);
    try {
      let token = gmailToken;

      if (!token) {
        const provider = new GoogleAuthProvider();
        provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
        const res = await signInWithPopup(auth, provider);
        const cred = GoogleAuthProvider.credentialFromResult(res);
        token = cred?.accessToken ?? null;
        if (token) setGmailToken(token);
      }

      if (!token) throw new Error("Não foi possível obter autorização do Gmail.");

      // Auto-replace DD/MM/YYYY date in subject with the selected date
      const [y, m, d] = selectedDate.split("-");
      const dateForSubject = `${d}/${m}/${y}`;
      const assuntoParaBusca = gmailConfig.assunto.replace(/\d{2}\/\d{2}\/\d{4}/, dateForSubject);

      let q = "";
      if (gmailConfig.remetente) q += `from:${gmailConfig.remetente} `;
      if (assuntoParaBusca)      q += `subject:${assuntoParaBusca} `;

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(q.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listRes.ok) {
        if (listRes.status === 401) { setGmailToken(null); throw new Error("Sessão expirada. Tente novamente."); }
        const errBody = await listRes.json().catch(() => ({}));
        const errMsg = errBody?.error?.message ?? errBody?.error ?? `status ${listRes.status}`;
        if (listRes.status === 403) {
          throw new Error(`Acesso negado (403): ${errMsg}. Verifique se a Gmail API está habilitada no Google Cloud Console e se o escopo gmail.readonly está autorizado.`);
        }
        throw new Error(`Erro Gmail API: ${listRes.status} — ${errMsg}`);
      }

      const listData = await listRes.json();
      const messages: { id: string }[] = listData.messages ?? [];

      if (messages.length === 0) {
        toast.warning("Nenhum e-mail encontrado com os filtros configurados.");
        return;
      }

      // Fetch the most recent matching message
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messages[0].id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msg = await msgRes.json();

      // Find HTML body in message parts
      let htmlData = findHtmlBody(msg.payload?.parts ?? []);
      if (!htmlData && msg.payload?.mimeType === "text/html") {
        htmlData = msg.payload.body?.data ?? null;
      }

      if (!htmlData) {
        toast.error("Não foi possível encontrar o conteúdo HTML do e-mail.");
        return;
      }

      // Decode base64url → UTF-8 string
      const base64 = htmlData.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
      const htmlString = new TextDecoder("utf-8").decode(bytes);
      const entries = parseCatracaFromHtml(htmlString);

      if (entries.length === 0) {
        toast.error("Não foi possível detectar a tabela de presença no e-mail.");
      } else {
        await saveCatraca(entries);
        toast.success(`${entries.length} registros carregados e salvos`);
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        toast.error(err.message || "Erro ao buscar e-mail");
        console.error(err);
      }
    } finally {
      setIsLoadingGmail(false);
    }
  };

  // ── Manual upload ────────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const json: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
        const entries = parseXlsxCatraca(json);
        if (entries.length === 0) {
          toast.error("Não foi possível detectar as colunas nome/e-mail no arquivo.");
        } else {
          await saveCatraca(entries);
          toast.success(`${entries.length} registros carregados de "${file.name}"`);
        }
      } catch { toast.error("Erro ao ler o arquivo."); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (!result) return;
    const rows: any[][] = [
      ["STATUS", "NOME", "E-MAIL", "HORA CONFIRMAÇÃO"],
      ...result.presentes.map(p => ["Presente", p.userName, p.userEmail, rsvpHora(p)]),
      ...result.ausentes.map(a => ["Confirmou, não foi", a.userName, a.userEmail, rsvpHora(a)]),
      ...result.semConfirmacao.map(s => ["Foi sem confirmar", s.nome, s.email, ""]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-presenca-${selectedDate}.xlsx`);
    toast.success("Relatório exportado!");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatório de Presença</h1>
          <p className="text-muted-foreground mt-1">Compare confirmações do app com os registros da catraca.</p>
        </div>
        {result && (
          <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <Label htmlFor="date-pick" className="font-semibold whitespace-nowrap text-sm">Data do relatório:</Label>
        <Input
          id="date-pick"
          type="date"
          value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setCatraca([]); }}
          className="w-44 h-9"
        />
      </div>

      {/* Data sources */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* RSVPs */}
        <Card className="border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Confirmações no App</CardTitle>
              </div>
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-xl text-sm font-black">
                {isLoadingRsvps ? "…" : rsvps.length}
              </span>
            </div>
            <CardDescription className="mt-1">Colaboradores que confirmaram presença</CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {isLoadingRsvps ? (
              <p className="p-8 text-center text-muted-foreground animate-pulse text-sm">Carregando…</p>
            ) : rsvps.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm italic">Nenhuma confirmação nesta data.</p>
            ) : (
              <div className="divide-y divide-border/30">
                {rsvps.map((r, i) => (
                  <div key={r.id} className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.userEmail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catraca */}
        <Card className="border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base">Registros da Catraca</CardTitle>
              </div>
              <span className={`px-3 py-1 rounded-xl text-sm font-black ${catraca.length > 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {catraca.length || "–"}
              </span>
            </div>
            <CardDescription className="mt-1">
              {catracaMeta
                ? `Importado por ${catracaMeta.by}${catracaMeta.at ? ` às ${format(catracaMeta.at, "HH:mm")}` : ""}`
                : "Importar do Gmail ou enviar arquivo .xlsx"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Button onClick={handleFetchGmail} disabled={isLoadingGmail} className="flex-1 gap-2 text-sm h-9">
                {isLoadingGmail ? (
                  <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />Buscando…</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" />Buscar do Gmail</>
                )}
              </Button>

              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 text-sm h-9">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

              {/* Gmail filter config */}
              <Dialog open={configOpen} onOpenChange={open => { setConfigOpen(open); if (open) setConfigForm(gmailConfig); }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" title="Configurar filtro de e-mail">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Filtro do Gmail</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Remetente (from)</Label>
                      <Input
                        placeholder="ex: sistema@empresa.com"
                        value={configForm.remetente}
                        onChange={e => setConfigForm(f => ({ ...f, remetente: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Assunto contém</Label>
                      <Input
                        placeholder="ex: catraca restaurante"
                        value={configForm.assunto}
                        onChange={e => setConfigForm(f => ({ ...f, assunto: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Busca o e-mail mais recente que corresponda ao filtro. Se o assunto contiver uma data (DD/MM/AAAA), ela será substituída automaticamente pela data selecionada no relatório. A configuração fica salva no navegador.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setGmailConfig(configForm);
                        saveGmailConfig(configForm);
                        setGmailToken(null);
                        setConfigOpen(false);
                        toast.success("Configuração salva.");
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {catraca.length > 0 && (
              <div className="max-h-44 overflow-y-auto divide-y divide-border/30 border rounded-lg bg-muted/5">
                {catraca.map((c, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.nome || "–"}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email || "–"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison report — only shown after catraca data is loaded */}
      {result && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 text-center p-5">
              <p className="text-3xl font-black text-green-700 dark:text-green-400">{result.presentes.length}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-green-600/80 dark:text-green-500/80 mt-1">Presentes</p>
            </Card>
            <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-center p-5">
              <p className="text-3xl font-black text-red-700 dark:text-red-400">{result.ausentes.length}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-red-600/80 dark:text-red-500/80 mt-1">Confirmou, não foi</p>
            </Card>
            <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 text-center p-5">
              <p className="text-3xl font-black text-orange-700 dark:text-orange-400">{result.semConfirmacao.length}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-600/80 dark:text-orange-500/80 mt-1">Foi sem confirmar</p>
            </Card>
          </div>

          {/* Presentes */}
          {result.presentes.length > 0 && (
            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-green-500/5 border-b border-green-500/10 py-3 px-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <CardTitle className="text-sm text-green-700 dark:text-green-400">
                    Confirmaram e foram ao restaurante ({result.presentes.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-72 overflow-y-auto">
                <div className="divide-y divide-border/30">
                  {result.presentes.map((p, i) => (
                    <div key={p.id} className="px-5 py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold truncate">{p.userName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{p.userEmail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ausentes */}
          {result.ausentes.length > 0 && (
            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-red-500/5 border-b border-red-500/10 py-3 px-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <CardTitle className="text-sm text-red-700 dark:text-red-400">
                    Confirmaram mas não foram ({result.ausentes.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-72 overflow-y-auto">
                <div className="divide-y divide-border/30">
                  {result.ausentes.map((a, i) => (
                    <div key={a.id} className="px-5 py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold truncate">{a.userName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{a.userEmail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sem confirmação */}
          {result.semConfirmacao.length > 0 && (
            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardHeader className="bg-orange-500/5 border-b border-orange-500/10 py-3 px-5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
                    Foram sem confirmar no app ({result.semConfirmacao.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-72 overflow-y-auto">
                <div className="divide-y divide-border/30">
                  {result.semConfirmacao.map((s, i) => (
                    <div key={i} className="px-5 py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold truncate">{s.nome || "–"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{s.email || "–"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Relatorio;
