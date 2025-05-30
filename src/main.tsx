import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { CreateGame } from "./createGame.tsx";
import { CardTest } from "./Cardtest.tsx";
import { Game } from "./Game.tsx";
<<<<<<< HEAD
import SignIn from "./sign-in.tsx";
=======
>>>>>>> parent of 5788069 (nuke)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/cardtest" element={<CardTest />} />
          <Route path="/game/:id" element={<Game />} />
<<<<<<< HEAD
          <Route path="signin" element={<SignIn />} />
=======
>>>>>>> parent of 5788069 (nuke)
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
