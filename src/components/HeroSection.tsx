import { UtensilsCrossed, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const { user } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      className="relative w-full py-16 px-4 text-center overflow-hidden"
      style={{ background: "var(--hero-gradient)" }}
    >
      {user?.email === "diogo.luciano@programaleiloes.com" && (
        <Link to="/admin" className="absolute top-4 right-4 p-2 opacity-10 hover:opacity-100 transition-opacity text-primary-foreground">
          <Shield className="w-5 h-5" />
        </Link>
      )}
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-2">
          <img 
            src="https://programaleiloes.com/modules/site/images/programa-leiloes-fundo.jpg" 
            alt="Programa Leilões" 
            className="h-16 md:h-20 mx-auto object-contain rounded-lg shadow-sm" 
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground tracking-tight">
          Restaurante Corporativo
        </h1>
        <p className="text-muted-foreground text-lg capitalize">{formattedDate}</p>
        <p className="text-muted-foreground/70">
          Confirme sua presença para o almoço de hoje
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
