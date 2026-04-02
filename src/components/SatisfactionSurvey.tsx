import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send } from "lucide-react";
import { toast } from "sonner";

const SatisfactionSurvey = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação.");
      return;
    }
    setSubmitted(true);
    toast.success("Obrigado pela sua avaliação!");
  };

  if (submitted) {
    return (
      <Card className="shadow-lg border-primary/20 bg-primary/5">
        <CardContent className="py-10 text-center space-y-2">
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <h3 className="text-lg font-semibold text-foreground">Avaliação Enviada!</h3>
          <p className="text-muted-foreground text-sm">
            Obrigado pelo seu feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground text-center">
          Pesquisa de Satisfação
        </CardTitle>
        <p className="text-muted-foreground text-sm text-center">
          Como foi a refeição de ontem?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          {rating === 1 && "Muito ruim"}
          {rating === 2 && "Ruim"}
          {rating === 3 && "Regular"}
          {rating === 4 && "Bom"}
          {rating === 5 && "Excelente"}
        </div>
        <Textarea
          placeholder="Deixe um comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={3}
        />
        <Button onClick={handleSubmit} className="w-full gap-2">
          <Send className="w-4 h-4" />
          Enviar Avaliação
        </Button>
      </CardContent>
    </Card>
  );
};

export default SatisfactionSurvey;
