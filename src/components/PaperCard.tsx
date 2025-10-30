import { FileText, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PaperCardProps {
  id: string;
  title: string;
  questionCount: number;
  createdAt: string;
  onView: () => void;
  onDelete: () => void;
}

export const PaperCard = ({ id, title, questionCount, createdAt, onView, onDelete }: PaperCardProps) => {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow animate-scale-in border-border/50 bg-gradient-glass backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 transition-opacity" />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-secondary" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{questionCount} questions</p>
          <p>Created {format(new Date(createdAt), "PPP")}</p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onView}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};