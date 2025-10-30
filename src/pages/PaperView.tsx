import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";

const PaperView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaper();
    loadProfile();
  }, [id]);

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

  const loadPaper = async () => {
    try {
      const { data, error } = await supabase
        .from("papers")
        .select("*, subjects(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPaper(data);
    } catch (error: any) {
      toast.error("Error loading paper");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between print:hidden">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={handlePrint} className="bg-gradient-primary">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

          <div className="bg-white text-black p-12 rounded-lg shadow-large print:shadow-none">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-bold mb-2">{paper?.title}</h1>
              <p className="text-lg">{paper?.subjects?.name}</p>
              <p className="text-sm text-gray-600 mt-2">Total Marks: {paper?.question_count}</p>
            </div>

            <div className="space-y-6">
              {paper?.questions_data?.map((q: any, index: number) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-semibold">
                    Q{index + 1}. {q.question_text}
                  </p>
                  <div className="ml-6 space-y-1">
                    <p>A. {q.option_a}</p>
                    <p>B. {q.option_b}</p>
                    <p>C. {q.option_c}</p>
                    <p>D. {q.option_d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaperView;