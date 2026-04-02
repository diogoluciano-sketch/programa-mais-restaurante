import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Utensils, Salad, CakeSlice, Soup, GlassWater, AlertCircle } from "lucide-react";
import { useMenu } from "@/hooks/useMenu";
import { Skeleton } from "@/components/ui/skeleton";

const getIcon = (category: string) => {
  switch (category) {
    case "Entrada":
      return <Salad className="w-5 h-5 text-primary" />;
    case "Prato Principal":
      return <Utensils className="w-5 h-5 text-primary" />;
    case "Acompanhamentos":
      return <Soup className="w-5 h-5 text-primary" />;
    case "Sobremesa":
      return <CakeSlice className="w-5 h-5 text-primary" />;
    case "Bebida":
      return <GlassWater className="w-5 h-5 text-primary" />;
    default:
      return <Utensils className="w-5 h-5 text-primary" />;
  }
};

const MenuCard = () => {
  const { menu, loading, error } = useMenu();

  if (loading) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardHeader>
           <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2 ml-7" />
              <Skeleton className="h-4 w-1/4 ml-7" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !menu) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            Cardápio do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="bg-muted p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Cardápio não disponível</p>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              O cardápio de hoje ainda não foi cadastrado pelo administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <CardTitle className="text-xl font-semibold text-foreground">
          Cardápio do Dia
        </CardTitle>
        <CardDescription>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {menu.map((section) => (
          <div key={section.category} className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/5">
                {getIcon(section.category)}
              </div>
              <h3 className="font-bold text-foreground text-xs uppercase tracking-[0.15em]">
                {section.category}
              </h3>
            </div>
            <ul className="space-y-2 pl-[44px]">
              {section.items.map((item, idx) => (
                <li key={idx} className="text-muted-foreground text-sm leading-relaxed border-l-2 border-border/20 pl-4 transition-colors hover:border-primary/40">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MenuCard;
