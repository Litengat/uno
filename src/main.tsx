import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { CreateGame } from "./createGame.tsx";
import { CardTest } from "./Cardtest.tsx";
import { Game } from "./Game.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/cardtest" element={<CardTest />} />
            <Route path="/game/:id" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ConvexProvider>
  </StrictMode>
);
