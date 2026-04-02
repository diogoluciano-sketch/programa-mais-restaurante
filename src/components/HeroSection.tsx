import { UtensilsCrossed } from "lucide-react";

const HeroSection = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      className="w-full py-16 px-4 text-center"
      style={{ background: "var(--hero-gradient)" }}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
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
