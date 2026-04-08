import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Laugh, Smile, Meh, Frown, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import HeroSection from "@/components/HeroSection";

const questions = [
  { id: "variedade", label: "1 - Variedade do cardápio" },
  { id: "sabor", label: "2 - Sabor dos alimentos" },
  { id: "apresentacao", label: "3 - Apresentação das preparações" },
  { id: "temperatura", label: "4 - Temperatura dos alimentos" },
  { id: "higiene", label: "5 - Higiene (instalações e utensílios)" },
  { id: "atendimento", label: "6 - Atendimento no restaurante" },
];

const options = [
  { value: 4, label: "Ótimo", icon: <Laugh className="w-5 h-5 text-emerald-500" /> },
  { value: 3, label: "Bom", icon: <Smile className="w-5 h-5 text-blue-500" /> },
  { value: 2, label: "Regular", icon: <Meh className="w-5 h-5 text-amber-500" /> },
  { value: 1, label: "Ruim", icon: <Frown className="w-5 h-5 text-rose-500" /> },
];

const Survey = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallScore, setOverallScore] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubmission = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const q = query(
          collection(db, "satisfaction"),
          where("userId", "==", user.uid),
          where("date", "==", today),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setHasSubmittedToday(true);
        }
      } catch (err) {
        console.error("Error checking submission:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubmission();
  }, [user?.uid]);

  const handleRatingChange = (questionId: string, value: number) => {
    setRatings(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (hasSubmittedToday) {
      toast.error("Você já enviou sua pesquisa hoje. Obrigado!");
      return;
    }

    if (Object.keys(ratings).length < questions.length) {
      toast.error("Por favor, responda todas as perguntas da pesquisa.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "satisfaction"), {
        userId: user?.uid,
        userEmail: user?.email,
        userName: user?.displayName,
        ratings,
        overallScore: parseInt(overallScore) || 0,
        comment: comment.trim(),
        date: format(new Date(), "yyyy-MM-dd"),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      toast.success("Obrigado pelo seu feedback!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar pesquisa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      <HeroSection />

      <main className="max-w-3xl mx-auto px-4 -mt-8 relative z-20">
        {isLoading ? (
          <Card className="animate-pulse">
            <CardContent className="py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ) : submitted || hasSubmittedToday ? (
          <Card className="shadow-2xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in duration-500">
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Avaliação Completa!</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Obrigado por nos ajudar a melhorar o serviço! Sua opinião é fundamental.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-border/50 overflow-hidden bg-background/80 backdrop-blur-md">
            <CardHeader className="bg-muted/30 py-8 border-b border-border/50">
              <h1 className="text-2xl font-black text-center text-foreground tracking-tighter uppercase mb-2">
                PESQUISA DE OPINIÃO
              </h1>
              <p className="text-sm text-center text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                Marque seu nível de satisfação em relação ao serviço de alimentação.
              </p>
            </CardHeader>

            <CardContent className="pt-8 space-y-10 pb-12">
              <div className="space-y-8">
                <div className="hidden sm:grid grid-cols-[1fr,repeat(4,100px)] gap-4 px-2 mb-4">
                  <div />
                  {options.map(opt => (
                    <div key={opt.label} className="flex flex-col items-center gap-1.5 opacity-80">
                      {opt.icon}
                      <span className="text-[10px] uppercase font-bold tracking-wider">{opt.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-6 sm:space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="grid grid-cols-1 sm:grid-cols-[1fr,repeat(4,100px)] gap-4 items-center p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/30">
                      <span className="text-sm font-semibold text-foreground pr-4">
                        {q.label}
                      </span>

                      <div className="flex justify-between sm:contents gap-2">
                        {options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleRatingChange(q.id, opt.value)}
                            className={`
                                flex flex-col sm:flex-row items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-300 flex-1 sm:flex-none
                                ${ratings[q.id] === opt.value
                                ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-105'
                                : 'bg-muted/50 border-input hover:border-primary/40'
                              }
                              `}
                          >
                            <div className="sm:hidden mb-1 scale-90">{opt.icon}</div>
                            <div className={`sm:hidden text-[9px] uppercase font-bold ${ratings[q.id] === opt.value ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{opt.label}</div>
                            <div className={`hidden sm:block w-4 h-4 rounded-full border-2 border-current flex items-center justify-center`}>
                              {ratings[q.id] === opt.value && <div className="w-2 h-2 rounded-full bg-current" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="text-sm font-bold text-foreground">
                    Avalie os serviços do restaurante pontuando de 0 a 5:
                  </span>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setOverallScore(val.toString())}
                        className={`
                                  w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all
                                  ${overallScore === val.toString()
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-primary/10'
                          }
                                `}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/50">
                <label className="text-sm font-bold text-foreground block">
                  Deixe registrado seus comentários e sugestões:
                </label>
                <Textarea
                  placeholder="Sua sugestão é muito apreciada..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[120px] bg-muted/20 border-border/50 focus:border-primary transition-all resize-none p-4 text-sm"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full h-14 text-base font-bold uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] group"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Enviar Avaliação
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Survey;
