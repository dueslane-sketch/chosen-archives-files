import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSupabase } from "@/components/SupabaseProvider"; // Import useSupabase
import { supabase } from "@/lib/supabase"; // Import supabase client
import { toast } from "sonner";

const Index = () => {
  const { session } = useSupabase();

  const handleLogout = async () => {
    if (!supabase) {
      toast.error("Supabase client not initialized. Cannot log out.");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
    } else {
      toast.success("Logged out successfully!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Welcome to Your Communication App
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Connect with others through video, audio, and chat.
        </p>
        {session ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/call">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Calling
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={handleLogout} className="text-lg px-8 py-4">
              Logout
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-4">
              Login / Sign Up
            </Button>
          </Link>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;