import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Salad, CakeSlice, Soup, GlassWater, AlertCircle } from "lucide-react";
import { useWeekMenu } from "@/hooks/useWeekMenu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MenuItem } from "@/hooks/useMenu";

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

const DayMenuContent = ({ menu, date }: { menu: MenuItem[] | null; date: Date }) => {
  if (!menu) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="bg-muted p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Cardápio não disponível</p>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              O cardápio deste dia ainda não foi cadastrado pelo administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <CardTitle className="text-xl font-semibold text-foreground capitalize">
          {format(date, "EEEE", { locale: ptBR })}
        </CardTitle>
        <CardDescription>
          {format(date, "d 'de' MMMM", { locale: ptBR })}
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
                <li
                  key={idx}
                  className="text-muted-foreground text-sm leading-relaxed border-l-2 border-border/20 pl-4 transition-colors hover:border-primary/40"
                >
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

const Semana = () => {
  const { weekMenus, loading } = useWeekMenu();

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 pt-8 pb-16 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <Skeleton className="h-7 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2 ml-7" />
                <Skeleton className="h-4 w-1/4 ml-7" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-8 pb-16 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cardápios da Semana</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Confira o que está planejado para os próximos 7 dias.
        </p>
      </div>

      <Tabs defaultValue={weekMenus[0]?.dateId}>
        <TabsList className="w-full flex overflow-x-auto h-auto flex-wrap gap-1 justify-start bg-muted/50 p-1 rounded-lg">
          {weekMenus.map(({ date, dateId }, index) => (
            <TabsTrigger
              key={dateId}
              value={dateId}
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs leading-tight data-[state=active]:shadow-sm"
            >
              <span className="font-semibold uppercase">
                {index === 0 ? "Hoje" : format(date, "EEE", { locale: ptBR })}
              </span>
              <span className="text-[10px] opacity-70">{format(date, "dd/MM")}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {weekMenus.map(({ date, dateId, menu }) => (
          <TabsContent key={dateId} value={dateId} className="mt-4">
            <DayMenuContent menu={menu} date={date} />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
};

export default Semana;
