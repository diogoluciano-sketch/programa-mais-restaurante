import HeroSection from "@/components/HeroSection";
import MenuCard from "@/components/MenuCard";
import RsvpSection from "@/components/RsvpSection";
import { useRSVPs } from "@/hooks/useRSVPs";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const Index = () => {
  const { isAlreadyConfirmed, addConfirmation, removeConfirmation } = useRSVPs();

  const handleConfirm = async (name: string) => {
    try {
      await addConfirmation(name);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar sua confirmação.");
    }
  };

  const handleCancel = async () => {
    try {
      await removeConfirmation();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cancelar confirmação.");
    }
  };

  return (
    <div>
      <HeroSection />
      <main className="relative z-10 max-w-3xl mx-auto px-4 -mt-12 pb-16 space-y-8">
        <div className="space-y-8">
          <RsvpSection
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isAlreadyConfirmed={isAlreadyConfirmed}
          />

          <MenuCard />
        </div>

        <Link to="/pesquisa" className="block transform transition-all hover:scale-[1.01] active:scale-[0.99]">
          <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shadow-lg overflow-hidden border-dashed">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Sua opinião importa!</h3>
                  <p className="text-sm text-muted-foreground">Avalie nosso serviço de hoje e nos ajude a melhorar.</p>
                </div>
              </div>
              <div className="text-primary font-bold text-sm hidden sm:block">
                Responder Pesquisa →
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
};

export default Index;
