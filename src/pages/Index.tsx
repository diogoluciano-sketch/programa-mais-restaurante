import HeroSection from "@/components/HeroSection";
import MenuCard from "@/components/MenuCard";
import RsvpSection from "@/components/RsvpSection";
import ConfirmationCounter from "@/components/ConfirmationCounter";
import SatisfactionSurvey from "@/components/SatisfactionSurvey";
import { useRSVPs } from "@/hooks/useRSVPs";
import { toast } from "sonner";

const Index = () => {
  const { count, isAlreadyConfirmed, addConfirmation, removeConfirmation } = useRSVPs();

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
    <div className="min-h-screen bg-background">
      <HeroSection />
      <main className="relative z-10 max-w-3xl mx-auto px-4 -mt-12 pb-16 space-y-6">
        <ConfirmationCounter count={count} />
        <div className="space-y-8">
          <RsvpSection 
            onConfirm={handleConfirm} 
            onCancel={handleCancel} 
            isAlreadyConfirmed={isAlreadyConfirmed} 
          />
          
          <MenuCard />
        </div>
        <SatisfactionSurvey />
      </main>
    </div>
  );
};

export default Index;
