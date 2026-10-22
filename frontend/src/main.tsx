import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { AuthProvider } from "@/lib/auth";
import { PrefsProvider } from "@/lib/prefs";
import { JourneyProvider } from "@/lib/journey";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrefsProvider><AuthProvider><JourneyProvider><App /></JourneyProvider></AuthProvider></PrefsProvider>
  </StrictMode>,
);
