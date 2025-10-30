import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectCardProps {
  id: string;
  name: string;
  questionCount?: number;
  onClick: () => void;
  onDelete?: () => void;
}

export const SubjectCard = ({ id, name, questionCount = 0, onClick, onDelete }: SubjectCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow cursor-pointer animate-scale-in border-border/50 bg-gradient-glass backdrop-blur-sm"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          {name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {questionCount} questions available
        </p>
      </CardContent>

      {onDelete && (
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Subject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};