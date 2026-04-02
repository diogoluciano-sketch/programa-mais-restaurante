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
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-2xl border-border/50 animate-in fade-in zoom-in duration-500">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit">
                <Soup className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Programa + Restaurante</CardTitle>
                <CardDescription>
                  Autentique-se com sua conta corporativa para acessar o cardápio e confirmar presença.
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8 pt-2">
            <Button 
                onClick={loginWithGoogle} 
                className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90 text-primary-foreground group"
            >
              <LogIn className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Entrar com Google
            </Button>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
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
