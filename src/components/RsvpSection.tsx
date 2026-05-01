import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, UserCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RsvpSectionProps {
  onConfirm?: (name: string) => void;
  onCancel?: () => void;
  isAlreadyConfirmed?: boolean;
  initialName?: string;
  isLocked?: boolean;
}

const RsvpSection = ({ onConfirm, onCancel, isAlreadyConfirmed, initialName, isLocked }: RsvpSectionProps) => {
  const { user } = useAuth();
  const defaultName = initialName || user?.displayName || user?.email?.split('@')[0] || "";
  const [name, setName] = useState(defaultName);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isAlreadyConfirmed !== undefined) {
      setConfirmed(isAlreadyConfirmed);
    }
  }, [isAlreadyConfirmed]);

  useEffect(() => {
    if (user && !name) {
      setName(defaultName);
    }
  }, [user]);

  const handleConfirm = () => {
    if (!name.trim()) {
      toast.error("Por favor, insira seu nome.");
      return;
    }
    if (isLocked) {
      toast.error("O período de confirmação é das 07:00 às 10:00.");
      return;
    }
    setConfirmed(true);
    onConfirm?.(name.trim());
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
              if (isLocked) {
                toast.error("Não é possível alterar confirmações após as 10:00.");
                return;
              }
              setConfirmed(false);
              onCancel?.();
            }}
          >
            {isLocked ? "Confirmação encerrada" : "Cancelar confirmação"}
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
          {isLocked 
            ? "O período de confirmação para hoje se encerrou (limite 10:00)." 
            : "Confira seu nome e confirme o seu almoço de hoje"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLocked && handleConfirm()}
            disabled={isLocked}
            className="flex-1"
          />
          <Button onClick={handleConfirm} disabled={isLocked} size="lg" className="gap-2">
            {isLocked ? <Lock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {isLocked ? "Encerrado" : "Confirmar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RsvpSection;
