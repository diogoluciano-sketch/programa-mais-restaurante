import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, ShieldCheck, Soup } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer = ({ children }: AuthContainerProps) => {
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--hero-gradient)] px-4">
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <img 
            src="https://lh3.googleusercontent.com/d/1y4DVWygWgn4i0QJs4puYzaSDxkhrSGCB" 
            alt="Programa Leilões" 
            className="h-20 md:h-24 mx-auto object-contain" 
          />
        </div>
        <Card className="w-full max-w-md shadow-2xl border-none animate-in fade-in zoom-in duration-700 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pt-10">
            <div className="space-y-2">
                <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Programa + Restaurante</CardTitle>
                <CardDescription className="text-slate-500 font-medium px-4">
                  Autentique-se com sua conta corporativa para acessar o cardápio e confirmar presença.
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-12 pt-6">
            <Button 
                onClick={loginWithGoogle} 
                className="w-full h-14 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#A51C1C] hover:bg-[#8B1818] text-white rounded-xl shadow-lg shadow-red-900/20 group"
            >
              <LogIn className="mr-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              Entrar com Google
            </Button>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                <ShieldCheck className="w-4 h-4" />
                <span>Acesso @programaleiloes.com</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthContainer;
