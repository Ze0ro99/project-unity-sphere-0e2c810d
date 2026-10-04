import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Public (publishable) backend settings. Used as a fallback so a published
// build never ships without them (a missing value blanks the whole app).
const FALLBACK = {
  VITE_SUPABASE_URL: "https://iirymtunobrpjlxxnuad.supabase.co",
  VITE_SUPABASE_PROJECT_ID: "iirymtunobrpjlxxnuad",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcnltdHVub2JycGpseHhudWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTgyMjAsImV4cCI6MjA5NjU3NDIyMH0.fYsPqLAP7kK4nJa2rWo7GO5fxtiMEEFMEPMt4uu55YY",
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define: Record<string, string> = {};
  for (const [k, v] of Object.entries(FALLBACK)) {
    if (!env[k]) define[`import.meta.env.${k}`] = JSON.stringify(v);
  }
  return {
    plugins: [react()],
    define,
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    // Only scan the real app entry — repository sub-projects must not break the build.
    optimizeDeps: { entries: ["index.html", "src/**/*.{ts,tsx}"] },
    server: { host: "0.0.0.0", port: 8080 },
  };
});
