import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PaperCard } from "@/components/PaperCard";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  question_count: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadProfile();
      loadPapers();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
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

  const loadPapers = async () => {
    try {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error: any) {
      toast.error("Error loading papers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (id: string) => {
    try {
      const { error } = await supabase
        .from("papers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Paper deleted successfully");
      loadPapers();
    } catch (error: any) {
      toast.error("Error deleting paper");
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
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Welcome to Your Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create professional MCQ question papers in seconds. Manage your subjects, questions, and generated papers all in one place.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow text-lg px-8 py-6"
              onClick={() => navigate("/generate")}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Paper
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/subjects")}
            >
              <FileText className="mr-2 h-5 w-5" />
              Manage Subjects
            </Button>
          </div>

          {/* My Papers Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">My Papers</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : papers.length === 0 ? (
              <div className="text-center py-16 bg-gradient-glass backdrop-blur-sm rounded-lg border border-border/50">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Papers Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first question paper to get started
                </p>
                <Button onClick={() => navigate("/generate")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Paper
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    id={paper.id}
                    title={paper.title}
                    questionCount={paper.question_count}
                    createdAt={paper.created_at}
                    onView={() => navigate(`/paper/${paper.id}`)}
                    onDelete={() => handleDeletePaper(paper.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;