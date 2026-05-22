import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/constants";
import { usePrestadores, Prestador } from "@/hooks/usePrestadores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Save,
  Printer,
  Sparkles,
  Coffee,
  UtensilsCrossed,
  ChefHat,
  Flame,
  Crown,
  Plus,
  X,
  MapPin,
  Clock,
  Wifi,
  User,
  Megaphone,
  Gavel,
  Briefcase,
  Users,
  Monitor,
  Music2,
  TrendingUp,
  Code,
  Wrench,
  Apple,
  Utensils,
  Cookie,
  Sandwich,
  Wine,
  Moon,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = "15gNdHQkjIbnd0TaHiREGrkEvHKnWFyb5lwsZzc8cEew";
const CONFIG_KEY = "diario_leilao_v2_config";

// Fixed column indices (0-based) per spec: H=7, I=8, J-S=9-18, T=19, U=20, V=21, W=22
const COL_HORARIO = 7;
const COL_COORDENADOR = 8;
const COL_MESA_OP_START = 9;  // J
const COL_MESA_OP_END = 18;   // S
const COL_PROMOTOR = 19;
const COL_LEILOEIRO = 20;
const COL_ASSESSORIAS = 21;
const COL_LOCAL = 22;

const FIXED_TEAM = [
  { role: "CPD", qty: 1, icon: Users },
  { role: "DJ", qty: 1, icon: Music2 },
  { role: "MKT", qty: 1, icon: TrendingUp },
  { role: "TI", qty: 1, icon: Code },
  { role: "REMATE", qty: 2, icon: Wifi, iconClass: "rotate-90" },
];

const SERVICOS_ROLES = [
  { key: "limpeza", label: "LIMPEZA", icon: Sparkles },
  { key: "copeiro", label: "COPEIRO(A)", icon: Coffee },
  { key: "garcom", label: "GARÇOM(NETE)", icon: UtensilsCrossed },
  { key: "cozinheiro", label: "COZINHEIRO(A)", icon: ChefHat },
  { key: "churrasqueiro", label: "CHURRASQUEIRO(A)", icon: Flame },
  { key: "liderCopa", label: "LÍDER COPA, COZINHA E LIMPEZA", icon: Crown },
];

const REFEICOES = [
  "Café da manhã",
  "Lanche da manhã",
  "Almoço",
  "Sobremesa",
  "Café da tarde",
  "Lanche da tarde",
  "Aperitivos",
  "Jantar",
  "Ceia",
];

const REFEICOES_ICONS: Record<string, React.ElementType> = {
  "Café da manhã":   Coffee,
  "Lanche da manhã": Apple,
  "Almoço":          Utensils,
  "Sobremesa":       Cookie,
  "Café da tarde":   Coffee,
  "Lanche da tarde": Sandwich,
  "Aperitivos":      Wine,
  "Jantar":          UtensilsCrossed,
  "Ceia":            Moon,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Config {
  tabName: string;
  dateColumn: string;
  nameColumn: string;
}

interface AuctionRow {
  rowNumber: number;
  local: string;
  horario: string;
  coordenador: string;
  promotor: string;
  leiloeiro: string;
  assessorias: string;
  mesaOperadora: string[];
  date: string;
  name: string;
}

interface ServidorTurno {
  prestadorId: string;
  prestadorNome: string;
  inicio: string;
  fim: string;
}

interface RefeicaoData {
  ativo: boolean;
  horario: string;
  cardapio: string;
}

interface LeilaoPlanning {
  pessoasServidas: number | null;
  servicos: Record<string, ServidorTurno[]>;
  refeicoes: Record<string, RefeicaoData>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getConfig(): Config {
  try {
    const s = localStorage.getItem(CONFIG_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return { tabName: parsed.tabName ?? "Diário", dateColumn: parsed.dateColumn ?? "DATA", nameColumn: parsed.nameColumn ?? "LEILÃO" };
    }
  } catch { /* empty */ }
  return {
    tabName: "Diário",
    dateColumn: "DATA",
    nameColumn: "LEILÃO",
  };
}

function saveConfig(c: Config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
}

function parseDate(str: string): Date | null {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

function planningKey(tabName: string, rowNumber: number) {
  return `${SPREADSHEET_ID}_${tabName}_R${rowNumber}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function splitNames(str: string): string[] {
  return str.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
}

// ─── Studio theme ────────────────────────────────────────────────────────────

function getStudioTheme(local: string) {
  const n = local.match(/est[uú]di[oa]\s*0*(\d)/i)?.[1];
  switch (n) {
    case "1": return { headerBg: "bg-red-700",    headerSub: "text-red-100",    sectionText: "text-red-700",    darkHeader: false, hex: "#b91c1c" };
    case "2": return { headerBg: "bg-blue-700",   headerSub: "text-blue-100",   sectionText: "text-blue-700",   darkHeader: false, hex: "#1d4ed8" };
    case "3": return { headerBg: "bg-yellow-500", headerSub: "text-yellow-900", sectionText: "text-yellow-600", darkHeader: true,  hex: "#ca8a04" };
    case "4": return { headerBg: "bg-purple-700", headerSub: "text-purple-100", sectionText: "text-purple-700", darkHeader: false, hex: "#7e22ce" };
    default:  return { headerBg: "bg-sky-400",    headerSub: "text-sky-50",     sectionText: "text-sky-600",    darkHeader: false, hex: "#0ea5e9" };
  }
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  dimmed?: boolean;
  icon?: React.ElementType;
}> = ({ label, value, dimmed, icon: Icon }) => (
  <div className="flex flex-col gap-0.5">
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
    <div className={`text-sm ${dimmed ? "text-muted-foreground italic" : ""}`}>
      {value}
    </div>
  </div>
);

// ─── AuctionCard ─────────────────────────────────────────────────────────────

const AuctionCard: React.FC<{
  auction: AuctionRow;
  tabName: string;
  prestadores: Prestador[];
}> = ({ auction, tabName, prestadores }) => {
  const theme = getStudioTheme(auction.local);
  const docKey = planningKey(tabName, auction.rowNumber);
  const [planning, setPlanning] = useState<LeilaoPlanning>({
    pessoasServidas: null,
    servicos: {},
    refeicoes: {},
  });
  const emptyServicoForm = () => ({ prestadorId: "none", inicio: "", fim: "" });
  const [servicoForms, setServicoForms] = useState<Record<string, { prestadorId: string; inicio: string; fim: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "leilao_planning", docKey)).then((snap) => {
      if (snap.exists()) setPlanning(snap.data() as LeilaoPlanning);
    });
  }, [docKey]);

  const handlePrint = () => {
    const esc = (s: string) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const totalPrevisto =
      splitNames(auction.coordenador).length +
      splitNames(auction.promotor).length +
      splitNames(auction.leiloeiro).length +
      splitNames(auction.assessorias).length +
      auction.mesaOperadora.length +
      FIXED_TEAM.reduce((acc, f) => acc + f.qty, 0) +
      Object.keys(planning.servicos).length;

    const realizado = planning.pessoasServidas;
    const diferenca = realizado != null ? realizado - totalPrevisto : null;

    const dateFormatted = (() => {
      const d = parseDate(auction.date);
      return d ? format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : auction.date;
    })();

    const badgeList = (str: string) =>
      splitNames(str).length > 0
        ? splitNames(str).map((n) => `<span class="badge">${esc(n)}</span>`).join(" ")
        : "<span class='empty'>—</span>";

    const mesaBadges = auction.mesaOperadora.length > 0
      ? auction.mesaOperadora.map((n) => `<span class="badge">${esc(n)}</span>`).join(" ")
      : "<span class='empty'>—</span>";

    const servicosRows = SERVICOS_ROLES.map((role) => {
      const servidores = planning.servicos[role.key] ?? [];
      const val = servidores.length > 0
        ? servidores.map((s) => `${esc(s.prestadorNome)}${s.inicio || s.fim ? ` (${s.inicio || "—"} → ${s.fim || "—"})` : ""}`).join(", ")
        : "<span class='empty'>—</span>";
      return `<tr>
        <td class="role-label">${esc(role.label)}</td>
        <td class="role-value">${val}</td>
      </tr>`;
    }).join("");

    const activeRefeicoes = REFEICOES.filter((r) => planning.refeicoes[r]?.ativo);
    const cardapioHtml = activeRefeicoes.length > 0
      ? activeRefeicoes.map((r) => {
          const rf = planning.refeicoes[r];
          return `<div class="refeicao">
            <div class="refeicao-header">
              <span class="refeicao-nome">${esc(r)}</span>
              ${rf.horario ? `<span class="refeicao-hora">${esc(rf.horario)}</span>` : ""}
            </div>
            ${rf.cardapio ? `<div class="refeicao-desc">${esc(rf.cardapio)}</div>` : ""}
          </div>`;
        }).join("")
      : "<p class='empty'>Nenhuma refeição definida.</p>";

    const difClass = diferenca == null ? "" : diferenca > 0 ? "diff-pos" : diferenca < 0 ? "diff-neg" : "diff-zero";
    const difLabel = diferenca == null ? "—" : diferenca > 0 ? `+${diferenca}` : String(diferenca);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${esc(auction.name || "Leilão")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 24px 32px; }
  .page-header { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid ${theme.hex}; margin-bottom: 18px; }
  .logo { width: 56px; height: 56px; object-fit: contain; }
  .org { display: flex; flex-direction: column; }
  .org-name { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; }
  .org-sub { font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold; letter-spacing: 0.08em; margin-top: 2px; }
  .auction-title { font-size: 17px; font-weight: bold; color: ${theme.hex}; margin-bottom: 2px; }
  .auction-meta { font-size: 11px; color: #555; margin-bottom: 18px; text-transform: capitalize; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: ${theme.hex}; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
  .info-item .lbl { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 2px; }
  .badge { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px; padding: 1px 6px; font-size: 10px; margin: 1px; }
  .badge-orange { background: #fed7aa; border-color: #fdba74; color: #9a3412; }
  .empty { color: #9ca3af; font-style: italic; }
  .optional { font-size: 9px; color: #9ca3af; }
  table.servicos { width: 100%; border-collapse: collapse; }
  table.servicos td { padding: 4px 0; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  .role-label { width: 55%; font-weight: 500; color: #374151; }
  .role-value { color: #111; }
  .refeicao { margin-bottom: 8px; padding: 6px 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; }
  .refeicao-header { display: flex; justify-content: space-between; align-items: center; }
  .refeicao-nome { font-weight: bold; font-size: 11px; }
  .refeicao-hora { font-size: 10px; color: #555; background: #e5e7eb; padding: 1px 6px; border-radius: 3px; }
  .refeicao-desc { font-size: 10px; color: #374151; margin-top: 4px; white-space: pre-wrap; }
  .stats { display: flex; gap: 32px; margin-top: 20px; padding-top: 12px; border-top: 2px solid #e5e7eb; }
  .stat { text-align: center; }
  .stat .lbl { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px; }
  .stat .val { font-size: 22px; font-weight: bold; }
  .diff-pos { color: #ea580c; }
  .diff-neg { color: #b91c1c; }
  .diff-zero { color: #16a34a; }
  @media print { body { padding: 12px 20px; } }
</style>
</head>
<body>
  <div class="page-header">
    <img class="logo" src="https://lh3.googleusercontent.com/d/1y4DVWygWgn4i0QJs4puYzaSDxkhrSGCB" alt="Logo" />
    <div class="org">
      <span class="org-name">Programa Mais Restaurante</span>
      <span class="org-sub">Serviço de Alimentação</span>
    </div>
  </div>

  <div class="auction-title">${esc(auction.name || "—")}</div>
  <div class="auction-meta">${esc(dateFormatted)}${auction.local ? ` &nbsp;·&nbsp; ${esc(auction.local)}` : ""}${auction.horario ? ` &nbsp;·&nbsp; ${esc(auction.horario)}` : ""}</div>

  <div class="section">
    <div class="section-title">Equipe</div>
    <div class="info-grid">
      <div class="info-item"><div class="lbl">Local</div><div>${esc(auction.local) || "<span class='empty'>—</span>"}</div></div>
      <div class="info-item"><div class="lbl">Horário</div><div>${esc(auction.horario) || "<span class='empty'>—</span>"}</div></div>
      <div class="info-item"><div class="lbl">Coordenador</div><div>${badgeList(auction.coordenador)}</div></div>
      <div class="info-item"><div class="lbl">Promotor</div><div>${badgeList(auction.promotor)}</div></div>
      <div class="info-item"><div class="lbl">Leiloeiro</div><div>${badgeList(auction.leiloeiro)}</div></div>
      <div class="info-item"><div class="lbl">Assessorias</div><div>${badgeList(auction.assessorias)}</div></div>
      <div class="info-item" style="grid-column:1/-1"><div class="lbl">Mesa Operadora</div><div>${mesaBadges}</div></div>
      <div class="info-item" style="grid-column:1/-1">
        <div class="lbl">Fixo por Leilão</div>
        <div>${FIXED_TEAM.map((f) => `<span class="badge badge-orange">${esc(f.role)}: ${f.qty}</span>`).join(" ")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Serviços</div>
    <table class="servicos"><tbody>${servicosRows}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Cardápio</div>
    ${cardapioHtml}
  </div>

  <div class="stats">
    <div class="stat"><div class="lbl">Total de pessoas previstas</div><div class="val">${totalPrevisto} pessoas</div></div>
    <div class="stat"><div class="lbl">Estiveram presentes</div><div class="val">${realizado != null ? realizado + " pessoas" : "—"}</div></div>
    <div class="stat"><div class="lbl">Diferença</div><div class="val ${difClass}">${difLabel}</div></div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=820,height=700");
    if (!win) { toast.error("Popup bloqueado. Permita popups para esta página."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "leilao_planning", docKey), planning);
      toast.success("Planejamento salvo.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addServidorTurno = (key: string, prestadorId: string, inicio: string, fim: string) => {
    const p = prestadores.find((x) => x.id === prestadorId);
    if (!p) return;
    setPlanning((prev) => ({
      ...prev,
      servicos: {
        ...prev.servicos,
        [key]: [...(prev.servicos[key] ?? []), { prestadorId, prestadorNome: p.nome, inicio, fim }],
      },
    }));
  };

  const removeServidorTurno = (key: string, index: number) => {
    setPlanning((prev) => ({
      ...prev,
      servicos: {
        ...prev.servicos,
        [key]: (prev.servicos[key] ?? []).filter((_, i) => i !== index),
      },
    }));
  };

  const getServicoForm = (key: string) => servicoForms[key] ?? emptyServicoForm();
  const patchServicoForm = (key: string, patch: Partial<{ prestadorId: string; inicio: string; fim: string }>) => {
    setServicoForms((prev) => ({ ...prev, [key]: { ...(prev[key] ?? emptyServicoForm()), ...patch } }));
  };


  const setRefeicao = (name: string, patch: Partial<RefeicaoData>) => {
    setPlanning((prev) => ({
      ...prev,
      refeicoes: {
        ...prev.refeicoes,
        [name]: {
          ativo: false,
          horario: "",
          cardapio: "",
          ...prev.refeicoes[name],
          ...patch,
        },
      },
    }));
  };

  return (
    <div className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
      {/* Card header */}
      <div className={`${theme.headerBg} ${theme.darkHeader ? "text-yellow-950" : "text-white"} px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
        <div>
          <p className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-widest ${theme.headerSub}`}>
            <MapPin className="w-3 h-3" />
            {auction.local || "Local não informado"}
          </p>
          <p className="font-bold text-sm tracking-wide">
            {auction.name || "—"}
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => { await saveAll(); handlePrint(); }}
            disabled={saving}
            className={`gap-1.5 border-black/20 bg-black/10 hover:bg-black/20 ${theme.darkHeader ? "text-yellow-950 hover:text-yellow-950" : "text-white hover:text-white"}`}
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={saveAll}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Pessoas previstas / servidas / diferença */}
      {(() => {
        const totalPrevisto =
          splitNames(auction.coordenador).length +
          splitNames(auction.promotor).length +
          splitNames(auction.leiloeiro).length +
          splitNames(auction.assessorias).length +
          auction.mesaOperadora.length +
          FIXED_TEAM.reduce((acc, f) => acc + f.qty, 0) +
          Object.values(planning.servicos).reduce((acc, arr) => acc + arr.length, 0);

        const realizado = planning.pessoasServidas;
        const diferenca = realizado != null ? realizado - totalPrevisto : null;

        return (
          <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold whitespace-nowrap">
                Total de pessoas previstas: <strong>{totalPrevisto}</strong> pessoas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold whitespace-nowrap">
                Estiveram presentes:
              </label>
              <Input
                type="number"
                min={0}
                value={realizado ?? ""}
                onChange={(e) =>
                  setPlanning((prev) => ({
                    ...prev,
                    pessoasServidas:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                placeholder="—"
                className="w-20 h-7 text-sm font-bold"
              />
              <span className="text-sm font-semibold">pessoas</span>
            </div>
            {diferenca != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Diferença
                </span>
                <span
                  className={`text-sm font-semibold ${
                    diferenca > 0
                      ? "text-orange-600"
                      : diferenca < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {diferenca > 0 ? `+${diferenca}` : diferenca}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      <Accordion type="multiple" defaultValue={["equipe"]} className="px-4 pb-2">
        {/* EQUIPE */}
        <AccordionItem value="equipe">
          <AccordionTrigger className={`text-sm font-semibold uppercase tracking-wider ${theme.sectionText}`}>
            Equipe
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm pb-2">
              <InfoRow
                icon={Clock}
                label="HORÁRIO"
                value={auction.horario || "—"}
                dimmed={!auction.horario}
              />
              <InfoRow icon={Wifi} label="TRANSMISSÃO" value="—" dimmed />
              <InfoRow
                icon={Megaphone}
                label="PROMOTOR"
                value={
                  splitNames(auction.promotor).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {splitNames(auction.promotor).map((n) => (
                        <Badge key={n} variant="secondary" className="text-xs">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <InfoRow
                icon={Gavel}
                label="LEILOEIRO"
                value={
                  splitNames(auction.leiloeiro).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {splitNames(auction.leiloeiro).map((n) => (
                        <Badge key={n} variant="secondary" className="text-xs">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <InfoRow
                icon={Briefcase}
                label="ASSESSORIAS"
                value={
                  splitNames(auction.assessorias).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {splitNames(auction.assessorias).map((n) => (
                        <Badge key={n} variant="secondary" className="text-xs">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />

              {/* COORDENADOR */}
              <div className="sm:col-span-2">
                <Separator className="my-2" />
                <InfoRow
                  icon={User}
                  label="COORDENADOR"
                  value={
                    splitNames(auction.coordenador).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {splitNames(auction.coordenador).map((n) => (
                          <Badge key={n} variant="secondary" className="text-xs">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
              </div>

              {/* MESA OPERADORA */}
              <div className="sm:col-span-2">
                <InfoRow
                  icon={Monitor}
                  label="MESA OPERADORA"
                  value={
                    auction.mesaOperadora.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {auction.mesaOperadora.map((n) => (
                          <Badge key={n} variant="secondary" className="text-xs">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
              </div>

              {/* EQUIPE TÉCNICA */}
              <div className="sm:col-span-2">
                <Separator className="my-2" />
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Wrench className="w-3 h-3" />
                  EQUIPE TÉCNICA
                </p>
                <div className="flex flex-wrap gap-2">
                  {FIXED_TEAM.map((f) => (
                    <Badge
                      key={f.role}
                      className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
                    >
                      <f.icon className={`w-3 h-3 ${"iconClass" in f ? f.iconClass : ""}`} />
                      {f.role}: {f.qty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SERVIÇOS */}
        <AccordionItem value="servicos">
          <AccordionTrigger className={`text-sm font-semibold uppercase tracking-wider ${theme.sectionText}`}>
            Serviços
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pb-2">
              {SERVICOS_ROLES.map((role) => {
                const servidores = planning.servicos[role.key] ?? [];
                const form = getServicoForm(role.key);
                return (
                  <div key={role.key} className="rounded-lg border border-border p-3 space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      {role.icon && <role.icon className="w-3.5 h-3.5 text-muted-foreground" />}
                      {role.label}
                      <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                    </span>
                    {servidores.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1 text-xs">
                        <span className="font-medium flex-1">{s.prestadorNome}</span>
                        <span className="text-muted-foreground">{s.inicio || "—"} → {s.fim || "—"}</span>
                        <button type="button" onClick={() => removeServidorTurno(role.key, i)}>
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={form.prestadorId}
                        onValueChange={(v) => patchServicoForm(role.key, { prestadorId: v })}
                      >
                        <SelectTrigger className="h-7 text-xs w-44">
                          <SelectValue placeholder="Prestador..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Selecionar —</SelectItem>
                          {prestadores.map((p) => (
                            <SelectItem key={p.id!} value={p.id!}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="time"
                        value={form.inicio}
                        onChange={(e) => patchServicoForm(role.key, { inicio: e.target.value })}
                        className="h-7 text-xs border border-border rounded px-2 bg-background"
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <input
                        type="time"
                        value={form.fim}
                        onChange={(e) => patchServicoForm(role.key, { fim: e.target.value })}
                        className="h-7 text-xs border border-border rounded px-2 bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (form.prestadorId === "none") return;
                          addServidorTurno(role.key, form.prestadorId, form.inicio, form.fim);
                          patchServicoForm(role.key, emptyServicoForm());
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>
                  </div>
                );
              })}
              {prestadores.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">
                  Cadastre prestadores em{" "}
                  <a href="/prestadores" className="underline">
                    Prestadores de Serviço
                  </a>{" "}
                  para atribuir aqui.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CARDÁPIO */}
        <AccordionItem value="cardapio">
          <AccordionTrigger className={`text-sm font-semibold uppercase tracking-wider ${theme.sectionText}`}>
            Cardápio
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-2">
              {REFEICOES.map((refeicao) => {
                const r = planning.refeicoes[refeicao] ?? {
                  ativo: false,
                  horario: "",
                  cardapio: "",
                };
                return (
                  <div
                    key={refeicao}
                    className={`rounded-lg border p-3 space-y-2 transition-colors ${
                      r.ativo
                        ? "border-sky-200 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/20"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`${docKey}-${refeicao}`}
                        checked={r.ativo}
                        onCheckedChange={(checked) =>
                          setRefeicao(refeicao, { ativo: !!checked })
                        }
                      />
                      <label
                        htmlFor={`${docKey}-${refeicao}`}
                        className="flex items-center gap-1.5 text-sm font-medium cursor-pointer flex-1"
                      >
                        {(() => { const Icon = REFEICOES_ICONS[refeicao]; return Icon ? <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : null; })()}
                        {refeicao}
                      </label>
                      {r.ativo && (
                        <Input
                          type="time"
                          value={r.horario}
                          onChange={(e) =>
                            setRefeicao(refeicao, { horario: e.target.value })
                          }
                          className="w-28 h-7 text-xs"
                        />
                      )}
                    </div>
                    {r.ativo && (
                      <Textarea
                        value={r.cardapio}
                        onChange={(e) =>
                          setRefeicao(refeicao, { cardapio: e.target.value })
                        }
                        placeholder="Descreva o cardápio..."
                        className="text-xs min-h-[60px] resize-y"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const DiarioLeilao = () => {
  const { user, loading } = useAuth();
  const { prestadores } = usePrestadores();
  const [config, setConfig] = useState<Config>(getConfig);
  const [configForm, setConfigForm] = useState<Config>(getConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [sheetsToken, setSheetsToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDay, setSelectedDay] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  });
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (loading) return null;
  if (!isUserAdmin(user?.email)) {
    window.location.href = "/";
    return null;
  }

  const filterStart = viewMode === "week" ? weekStart : selectedDay;
  const filterEnd   = viewMode === "week" ? addDays(weekStart, 6) : selectedDay;

  const periodLabel =
    viewMode === "week"
      ? `${format(weekStart, "d")} a ${format(filterEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
      : format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleLoad = async () => {
    setIsLoading(true);
    try {
      let token = sheetsToken;
      if (!token) {
        const provider = new GoogleAuthProvider();
        provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");
        const res = await signInWithPopup(auth, provider);
        const cred = GoogleAuthProvider.credentialFromResult(res);
        token = cred?.accessToken ?? null;
        if (token) setSheetsToken(token);
      }
      if (!token) throw new Error("Não foi possível obter autorização.");

      const tab = config.tabName || "Diário";
      const range = encodeURIComponent(`${tab}!A:AZ`);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setSheetsToken(null);
          throw new Error("Sessão expirada. Tente novamente.");
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(
          `Erro Sheets API: ${body?.error?.message ?? res.status}`
        );
      }

      const data = await res.json();
      const values: string[][] = data.values ?? [];

      // Row 2 (index 1) = headers; data starts at row 3 (index 2)
      if (values.length < 3) {
        toast.warning("Planilha sem dados.");
        setAuctions([]);
        return;
      }

      const headers = values[1].map((h) => String(h ?? "").trim());

      const getColIdx = (name: string) =>
        headers.findIndex(
          (h) => h.toUpperCase() === name.toUpperCase()
        );

      const colDate = getColIdx(config.dateColumn);
      const colName = getColIdx(config.nameColumn);

      if (colDate < 0) {
        toast.error(
          `Coluna de data "${config.dateColumn}" não encontrada na planilha. Verifique o nome no botão ⚙️.`,
          { duration: 6000 }
        );
        setAuctions([]);
        return;
      }

      const get = (row: string[], idx: number) =>
        idx >= 0 ? String(row[idx] ?? "").trim() : "";

      const getMesaOp = (row: string[]): string[] => {
        const members: string[] = [];
        for (let i = COL_MESA_OP_START; i <= COL_MESA_OP_END; i++) {
          const val = String(row[i] ?? "").trim();
          if (val) members.push(val);
        }
        return members;
      };

      const rows: AuctionRow[] = [];

      values.slice(2).forEach((row, idx) => {
        // Skip completely empty rows
        if (row.every((cell) => !cell?.trim())) return;

        const dateStr = get(row, colDate);
        const d = parseDate(dateStr);

        // Skip rows without a parseable date
        if (!d) return;

        // Filter to selected period
        if (d < filterStart || d > filterEnd) return;

        rows.push({
          rowNumber: idx + 3,
          local: get(row, COL_LOCAL),
          horario: get(row, COL_HORARIO),
          coordenador: get(row, COL_COORDENADOR),
          promotor: get(row, COL_PROMOTOR),
          leiloeiro: get(row, COL_LEILOEIRO),
          assessorias: get(row, COL_ASSESSORIAS),
          mesaOperadora: getMesaOp(row),
          date: dateStr,
          name: get(row, colName),
        });
      });

      setAuctions(rows);
      if (rows.length === 0)
        toast.warning(viewMode === "week" ? "Nenhum leilão encontrado para esta semana." : "Nenhum leilão encontrado para este dia.");
      else toast.success(`${rows.length} leilão(ões) carregado(s).`);
    } catch (err: any) {
      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        toast.error(err.message || "Erro ao carregar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group by date string
  const groupedByDay: Record<string, AuctionRow[]> = {};
  auctions.forEach((a) => {
    const key = a.date || "Sem data";
    if (!groupedByDay[key]) groupedByDay[key] = [];
    groupedByDay[key].push(a);
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Diário de Leilão
            </h1>
            <p className="text-sm text-muted-foreground">
              Planejamento semanal de eventos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              className={`px-3 h-9 text-xs font-semibold transition-colors ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => { setViewMode("week"); setAuctions([]); }}
            >
              Semana
            </button>
            <button
              className={`px-3 h-9 text-xs font-semibold border-l border-border transition-colors ${
                viewMode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => { setViewMode("day"); setAuctions([]); }}
            >
              Dia
            </button>
          </div>

          {/* Period navigation */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (viewMode === "week") setWeekStart((w) => subWeeks(w, 1));
              else setSelectedDay((d) => addDays(d, -1));
              setAuctions([]);
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium whitespace-nowrap px-1 capitalize">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (viewMode === "week") setWeekStart((w) => addWeeks(w, 1));
              else setSelectedDay((d) => addDays(d, 1));
              setAuctions([]);
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleLoad}
            disabled={isLoading}
            className="gap-2 h-9"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Carregando…
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Carregar
              </>
            )}
          </Button>

          {/* Config dialog */}
          <Dialog
            open={configOpen}
            onOpenChange={(open) => {
              setConfigOpen(open);
              if (open) setConfigForm(config);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="Configurar colunas da planilha"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Configurar Planilha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Nome da Aba</Label>
                  <Input
                    value={configForm.tabName}
                    onChange={(e) =>
                      setConfigForm((f) => ({ ...f, tabName: e.target.value }))
                    }
                    placeholder="Diário"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Coluna de Data</Label>
                  <Input
                    value={configForm.dateColumn}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        dateColumn: e.target.value,
                      }))
                    }
                    placeholder="DATA"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome do cabeçalho da coluna com a data do leilão (DD/MM/AAAA)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Coluna do Nome do Leilão</Label>
                  <Input
                    value={configForm.nameColumn}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        nameColumn: e.target.value,
                      }))
                    }
                    placeholder="LEILÃO"
                  />
                </div>
                <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">
                    Colunas fixas (spec):
                  </p>
                  <p>H = HORÁRIO • I = COORDENADOR • T = PROMOTOR</p>
                  <p>U = LEILOEIRO • V = ASSESSORIAS • W = LEILÃO LOCAL</p>
                  <p>J–S = MESA OPERADORA (colunas 10 a 19)</p>
                  <p>Cabeçalho na linha 2 • Dados a partir da linha 3</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setConfig(configForm);
                    saveConfig(configForm);
                    setSheetsToken(null);
                    setAuctions([]);
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
      </div>

      {/* Studio color legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Estúdio 01", bg: "bg-red-700",    text: "text-white" },
          { label: "Estúdio 02", bg: "bg-blue-700",   text: "text-white" },
          { label: "Estúdio 03", bg: "bg-yellow-500", text: "text-yellow-950" },
          { label: "Estúdio 04", bg: "bg-purple-700", text: "text-white" },
          { label: "Sem estúdio", bg: "bg-sky-400",   text: "text-white" },
        ].map(({ label, bg, text }) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Auction list grouped by day */}
      {auctions.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedByDay).map(([day, dayAuctions]) => {
            const d = parseDate(day);
            const dayLabel = d
              ? format(d, "EEEE, dd 'de' MMMM", { locale: ptBR }).toUpperCase()
              : day;
            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
                    {dayLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {dayAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.rowNumber}
                    auction={auction}
                    tabName={config.tabName}
                    prestadores={prestadores}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {auctions.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-2">
          <p className="font-medium text-muted-foreground">
            Selecione uma semana e clique em Carregar
          </p>
          <p className="text-sm text-muted-foreground">
            Use o botão <Settings className="inline w-3.5 h-3.5 mx-0.5" /> para
            configurar o nome da aba e das colunas da planilha.
          </p>
        </div>
      )}
    </div>
  );
};

export default DiarioLeilao;
