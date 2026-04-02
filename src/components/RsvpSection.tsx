import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface RsvpSectionProps {
  onConfirm?: () => void;
  onCancel?: () => void;
}

const RsvpSection = ({ onConfirm, onCancel }: RsvpSectionProps) => {
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!name.trim()) {
      toast.error("Por favor, insira seu nome.");
      return;
    }
    setConfirmed(true);
    onConfirm?.();
    toast.success(`Presença confirmada para ${name.trim()}!`);
  };

  if (confirmed) {
    return (
      <Card className="border-primary/30 bg-primary/5 shadow-lg">
        <CardContent className="py-10 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15">
            <UserCheck className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Presença Confirmada!
          </h3>
          <p className="text-muted-foreground text-sm">
            Obrigado, <span className="font-medium text-foreground">{name}</span>. Te esperamos no almoço!
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-muted-foreground"
            onClick={() => {
              setConfirmed(false);
              setName("");
              onCancel?.();
            }}
          >
            Cancelar confirmação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardContent className="py-8 space-y-4">
        <h3 className="text-lg font-semibold text-foreground text-center">
          Confirmar Presença
        </h3>
        <p className="text-muted-foreground text-sm text-center">
          Insira seu nome para confirmar o almoço de hoje
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            className="flex-1"
          />
          <Button onClick={handleConfirm} size="lg" className="gap-2">
            <Check className="w-4 h-4" />
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RsvpSection;
