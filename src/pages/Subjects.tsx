import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { SubjectCard } from "@/components/SubjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload, ArrowLeft, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Subject {
  id: string;
  name: string;
  questionCount: number;
}

const Subjects = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [questionsText, setQuestionsText] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadProfile();
      loadSubjects();
    };

    checkAuth();
  }, [navigate]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", user.id)
        .single();
      
      if (data?.theme_preference === "dark") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  };

  const loadSubjects = async () => {
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (subjectsError) throw subjectsError;

      // Get question counts for each subject
      const subjectsWithCounts = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id);

          return {
            id: subject.id,
            name: subject.name,
            questionCount: count || 0,
          };
        })
      );

      setSubjects(subjectsWithCounts);
    } catch (error: any) {
      toast.error("Error loading subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          name: newSubjectName,
        });

      if (error) throw error;

      toast.success("Subject created successfully");
      setShowNewSubject(false);
      setNewSubjectName("");
      loadSubjects();
    } catch (error: any) {
      toast.error("Error creating subject");
    }
  };

  const handleUploadQuestions = async () => {
    if (!selectedSubject || !questionsText.trim()) {
      toast.error("Please select a subject and enter questions");
      return;
    }

    try {
      const lines = questionsText.trim().split("\n");
      const questions: any[] = [];
      let currentQuestion: any = {};
      let questionNumber = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check if line starts with a number followed by a period
        if (/^\d+\./.test(line)) {
          // Save previous question if exists
          if (currentQuestion.question_text) {
            questions.push({ ...currentQuestion });
          }
          // Start new question
          questionNumber++;
          currentQuestion = {
            question_text: line.substring(line.indexOf(".") + 1).trim(),
            subject_id: selectedSubject,
          };
        } else if (line.startsWith("A.")) {
          currentQuestion.option_a = line.substring(2).trim();
        } else if (line.startsWith("B.")) {
          currentQuestion.option_b = line.substring(2).trim();
        } else if (line.startsWith("C.")) {
          currentQuestion.option_c = line.substring(2).trim();
        } else if (line.startsWith("D.")) {
          currentQuestion.option_d = line.substring(2).trim();
        } else if (line.startsWith("ANSWER:")) {
          currentQuestion.correct_answer = line.substring(7).trim();
        }
      }

      // Add last question
      if (currentQuestion.question_text) {
        questions.push(currentQuestion);
      }

      if (questions.length === 0) {
        toast.error("No valid questions found. Please check the format.");
        return;
      }

      const { error } = await supabase
        .from("questions")
        .insert(questions);

      if (error) throw error;

      toast.success(`${questions.length} questions uploaded successfully`);
      setShowUpload(false);
      setQuestionsText("");
      setSelectedSubject("");
      loadSubjects();
    } catch (error: any) {
      toast.error("Error uploading questions: " + error.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Subject deleted successfully");
      loadSubjects();
    } catch (error: any) {
      toast.error("Error deleting subject");
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Manage Subjects
            </h1>
            <p className="text-muted-foreground">
              Create subjects and upload question banks
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setShowNewSubject(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Subject
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Questions
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-16 bg-gradient-glass backdrop-blur-sm rounded-lg border border-border/50">
              <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Subjects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subject to get started
              </p>
              <Button onClick={() => setShowNewSubject(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  id={subject.id}
                  name={subject.name}
                  questionCount={subject.questionCount}
                  onClick={() => {
                    setSelectedSubject(subject.id);
                    setShowUpload(true);
                  }}
                  onDelete={() => handleDeleteSubject(subject.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Subject Dialog */}
      <Dialog open={showNewSubject} onOpenChange={setShowNewSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Enter the name of the subject you want to create
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                placeholder="e.g., Computer Networks"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleCreateSubject}
            >
              Create Subject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Questions Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Upload Questions
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="font-semibold mb-2">Question Format:</p>
                    <pre className="text-xs bg-muted p-2 rounded">
{`1. What does CPU stand for?
A. Central Processing Unit
B. Computer Personal Unit
C. Central Program Unit
D. Control Process Unit
ANSWER: A

2. Which is volatile memory?
A. ROM
B. RAM
C. SSD
D. HDD
ANSWER: B`}
                    </pre>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
            <DialogDescription>
              Select a subject and paste your questions in the correct format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-select">Subject</Label>
              <select
                id="subject-select"
                className="w-full p-2 rounded-md border border-input bg-background"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="questions-text">Questions</Label>
              <Textarea
                id="questions-text"
                placeholder="Paste your questions here..."
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleUploadQuestions}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Questions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subjects;