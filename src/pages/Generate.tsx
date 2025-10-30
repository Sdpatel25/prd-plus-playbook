import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { SubjectCard } from "@/components/SubjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  questionCount: number;
}

const Generate = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [paperTitle, setPaperTitle] = useState("");
  const [generating, setGenerating] = useState(false);

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
      const { data: subjectsData, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

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

      setSubjects(subjectsWithCounts.filter(s => s.questionCount > 0));
    } catch (error: any) {
      toast.error("Error loading subjects");
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !paperTitle.trim()) {
      toast.error("Please enter a paper title");
      return;
    }

    setGenerating(true);

    try {
      // Fetch random questions
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("subject_id", selectedSubject.id);

      if (questionsError) throw questionsError;

      if (!questions || questions.length < questionCount) {
        toast.error("Not enough questions available");
        setGenerating(false);
        return;
      }

      // Shuffle and select questions
      const shuffled = questions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, questionCount);

      // Save paper
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: paper, error: paperError } = await supabase
        .from("papers")
        .insert({
          user_id: user.id,
          subject_id: selectedSubject.id,
          title: paperTitle,
          question_count: questionCount,
          questions_data: selectedQuestions,
        })
        .select()
        .single();

      if (paperError) throw paperError;

      toast.success("Paper generated successfully!");
      navigate(`/paper/${paper.id}`);
    } catch (error: any) {
      toast.error("Error generating paper");
      setGenerating(false);
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
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate("/dashboard") : setStep(step - 1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 1 ? "Back to Dashboard" : "Previous Step"}
          </Button>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-all ${
                  s === step
                    ? "bg-primary"
                    : s < step
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Subject */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Select a Subject
                </h1>
                <p className="text-muted-foreground">
                  Choose the subject for your question paper
                </p>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-16 bg-gradient-glass backdrop-blur-sm rounded-lg border border-border/50">
                  <p className="text-muted-foreground mb-4">
                    No subjects with questions available
                  </p>
                  <Button onClick={() => navigate("/subjects")}>
                    Manage Subjects
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
                      onClick={() => handleSelectSubject(subject)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set Quantity */}
          {step === 2 && selectedSubject && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  How Many Questions?
                </h1>
                <p className="text-muted-foreground">
                  Select the number of questions for your paper
                </p>
              </div>

              <div className="max-w-xl mx-auto bg-gradient-glass backdrop-blur-sm rounded-lg border border-border/50 p-8 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Selected Subject</p>
                  <h3 className="text-2xl font-bold">{selectedSubject.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedSubject.questionCount} questions available
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {questionCount}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">questions</p>
                  </div>

                  <Slider
                    value={[questionCount]}
                    onValueChange={(value) => setQuestionCount(value[0])}
                    min={1}
                    max={Math.min(selectedSubject.questionCount, 100)}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Button
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={() => setStep(3)}
                  size="lg"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Final Details
                </h1>
                <p className="text-muted-foreground">
                  Give your question paper a title
                </p>
              </div>

              <div className="max-w-xl mx-auto bg-gradient-glass backdrop-blur-sm rounded-lg border border-border/50 p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="paper-title">Paper Title</Label>
                  <Input
                    id="paper-title"
                    placeholder="e.g., Midterm Exam - Fall 2025"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Subject: <span className="font-semibold text-foreground">{selectedSubject?.name}</span></p>
                  <p>Questions: <span className="font-semibold text-foreground">{questionCount}</span></p>
                </div>

                <Button
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                  onClick={handleGenerate}
                  size="lg"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Paper
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Generate;