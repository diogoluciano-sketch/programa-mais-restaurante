const HeroSection = () => {
  const today = new Date();
  
  const day = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const date = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  return (
    <section className="relative w-full py-16 px-4 text-center overflow-hidden bg-primary/5">
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="mb-4">
          <img
            src="https://lh3.googleusercontent.com/d/1y4DVWygWgn4i0QJs4puYzaSDxkhrSGCB"
            alt="Logo"
            className="h-16 mx-auto object-contain drop-shadow-md"
          />
        </div>
        <div className="space-y-1">
           <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 px-3 py-1 bg-primary/10 rounded-full inline-block">
              {day}
           </p>
           <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
             CARDÁPIO DO DIA
           </h1>
           <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{date}</p>
        </div>
        <p className="text-muted-foreground/80 text-sm font-medium max-w-sm mx-auto leading-relaxed">
          Confirme sua presença abaixo para que possamos preparar sua refeição com todo carinho.
        </p>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  );
};

export default HeroSection;
