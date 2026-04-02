import { createBrowserClient } from "@supabase/ssr";

export const supabaseUrl = "https://ubblzubuercumamjosfs.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYmx6dWJ1ZXJjdW1hbWpvc2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzU5OTAsImV4cCI6MjA5MDM1MTk5MH0.Dq505N7KRdYhDn9DuE8f3RcK4VfrCOh56s9rJCzwljU";

// Client Supabase pour les composants côté navigateur
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
