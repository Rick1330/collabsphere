import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapThemePreference } from "./hooks/use-theme-preference";

bootstrapThemePreference();
createRoot(document.getElementById("root")!).render(<App />);

