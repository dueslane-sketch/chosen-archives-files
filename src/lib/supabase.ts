import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { Database } from "./database.types"; // Assuming you'll create this type definition

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("VITE_SUPABASE_URL:", supabaseUrl);
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "******" : "Not set"); // Mask key for console output

if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL") {
  console.error("Supabase URL is not set. Please add VITE_SUPABASE_URL to your .env.local file.");
  toast.error("Supabase URL is missing. Please configure your .env.local file.");
}
if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.error("Supabase Anon Key is not set. Please add VITE_SUPABASE_ANON_KEY to your .env.local file.");
  toast.error("Supabase Anon Key is missing. Please configure your .env.local file.");
}

export const supabase =
  supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL" && supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

if (supabase) {
  console.log("Supabase client initialized successfully.");
} else {
  console.error("Supabase client could not be initialized. Check environment variables.");
}

// Define types for your database schema (adjust as needed)
export type { Database }; // Export the Database type