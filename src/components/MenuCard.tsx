import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Salad, CakeSlice, Soup } from "lucide-react";

interface MenuItem {
  category: string;
  items: string[];
  icon: React.ReactNode;
}

const mockMenu: MenuItem[] = [
  {
    category: "Entrada",
    items: ["Salada verde com tomate cereja", "Sopa de legumes"],
    icon: <Salad className="w-5 h-5 text-primary" />,
  },
  {
    category: "Prato Principal",
    items: ["Filé de frango grelhado ao molho mostarda", "Risoto de cogumelos (vegetariano)"],
    icon: <Utensils className="w-5 h-5 text-primary" />,
  },
  {
    category: "Acompanhamentos",
    items: ["Arroz integral", "Feijão carioca", "Legumes salteados"],
    icon: <Soup className="w-5 h-5 text-primary" />,
  },
  {
    category: "Sobremesa",
    items: ["Pudim de leite", "Fruta da estação"],
    icon: <CakeSlice className="w-5 h-5 text-primary" />,
  },
];

const MenuCard = () => {
  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Cardápio do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockMenu.map((section) => (
          <div key={section.category} className="space-y-2">
            <div className="flex items-center gap-2">
              {section.icon}
              <h3 className="font-medium text-foreground text-sm uppercase tracking-wider">
                {section.category}
              </h3>
            </div>
            <ul className="space-y-1 pl-7">
              {section.items.map((item) => (
                <li key={item} className="text-muted-foreground text-sm">
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
