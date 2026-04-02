import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ConfirmationCounterProps {
  count: number;
}

const ConfirmationCounter = ({ count }: ConfirmationCounterProps) => {
  return (
    <Card className="shadow-lg border-border/50 bg-card">
      <CardContent className="py-5 flex items-center justify-center gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{count}</p>
          <p className="text-xs text-muted-foreground">
            {count === 1 ? "pessoa confirmada" : "pessoas confirmadas"} hoje
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationCounter;
