import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, Timestamp, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, MessageSquare, Star, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

const Admin = () => {
  const { user, loading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const q = query(collection(db, "satisfaction"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const surveysData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSurveys(surveysData);
      } catch (error) {
        console.error("Error fetching surveys:", error);
        toast.error("Erro ao carregar as pesquisas de satisfação.");
      } finally {
        setIsLoadingSurveys(false);
      }
    };

    if (user?.email === "diogo.luciano@programaleiloes.com") {
      fetchSurveys();
    }
  }, [user?.email]);

  if (loading) return null;

  // Only Diogo can access this page
  if (user?.email !== "diogo.luciano@programaleiloes.com") {
    window.location.href = "/";
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Filter rows with valid dates in Col A
        const menuItems = json.slice(4).filter(row => {
          const d = row[0];
          if (!d) return false;
          if (d instanceof Date && !isNaN(d.getTime())) return true;
          if (typeof d === 'string' && !isNaN(Date.parse(d))) return true;
          if (typeof d === 'number' && d > 40000) return true;
          return false;
        });

        const batch = writeBatch(db);
        const menuRef = collection(db, "menu");

        for (const row of menuItems) {
          let date: Date;
          if (row[0] instanceof Date) {
            date = row[0];
            date.setHours(12, 0, 0, 0);
          } else if (typeof row[0] === 'number') {
            date = new Date((row[0] - 25569) * 86400 * 1000);
            date.setHours(12, 0, 0, 0);
          } else {
            date = new Date(row[0]);
            date.setHours(12, 0, 0, 0);
          }

          const dateId = format(date, "yyyy-MM-dd");
          
          const docData = {
            date: Timestamp.fromDate(date),
            menu: [
              {
                category: "Entrada",
                items: [row[10], row[11], row[12]].filter(i => i && i !== ""),
              },
              {
                category: "Prato Principal",
                items: [row[5], row[6]].filter(i => i && i !== ""),
              },
              {
                category: "Acompanhamentos",
                items: [row[3], row[4], row[8], row[9]].filter(i => i && i !== ""),
              },
              {
                category: "Sobremesa",
                items: [row[13]].filter(i => i && i !== ""),
              },
              {
                category: "Bebida",
                items: [row[14]].filter(i => i && i !== ""),
              }
            ]
          };

          const docRef = doc(menuRef, dateId);
          batch.set(docRef, docData);
        }

        await batch.commit();
        toast.success(`${menuItems.length} dias de cardápio atualizados com sucesso!`);
        setFile(null);
      } catch (error: any) {
        console.error("Upload error details:", error);
        const msg = error.message ? `: ${error.message}` : "";
        toast.error(`Erro ao processar a planilha${msg}`);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie o cardápio mensal através do upload de planilhas Excel.</p>
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div>
                   <CardTitle>Upload de Cardápio</CardTitle>
                   <CardDescription>Selecione o arquivo .xlsx de referência</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}
            `}>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${file ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {file ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-base font-medium">
                    {file ? file.name : "Clique ou arraste a planilha aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Formato suportado: .xlsx (Excel)</p>
                </div>
              </div>
            </div>

            {file && (
              <Button 
                onClick={processFile} 
                disabled={isUploading}
                className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg active:scale-[0.99] group"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    Confirmar Importação
                    <CheckCircle2 className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </Button>
            )}

            {!file && (
               <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    A estrutura da planilha deve conter as colunas de Data, Refeição Base, Prato Principal, Guarnições, Saladas, Sobremesa e Bebida conforme o padrão analisado.
                  </p>
               </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 border-b border-border/50">
            <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                <div>
                   <CardTitle>Pesquisas de Satisfação</CardTitle>
                   <CardDescription>Respostas e opiniões dos colaboradores</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSurveys ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">
                Carregando pesquisas...
              </div>
            ) : surveys.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">
                Nenhuma pesquisa cadastrada até o momento.
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
                {surveys.map((s) => (
                  <div key={s.id} className="p-6 space-y-4 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                           <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm">{s.userName || "Usuário Anônimo"}</span>
                        <span className="text-xs text-muted-foreground">({s.userEmail})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          {s.date ? format(new Date(s.date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/20">
                       <div className="flex flex-col gap-1">
                         <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Geral (0-5)</span>
                         <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-lg font-black">{s.overallScore}</span>
                         </div>
                       </div>
                       {Object.entries(s.ratings || {}).slice(0, 3).map(([key, val]: [string, any]) => (
                         <div key={key} className="flex flex-col gap-1 border-l border-border/30 pl-4">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground truncate" title={key}>{key}</span>
                            <span className="text-base font-bold">{val}</span>
                         </div>
                       ))}
                    </div>

                    {s.comment && (
                      <div className="relative pl-4 border-l-4 border-primary/20 italic text-sm text-foreground/80 py-1">
                        "{s.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center pt-4">
            <Button variant="link" onClick={() => window.location.href = "/"} className="text-muted-foreground hover:text-primary">
                Voltar para o Cardápio do Dia
            </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
