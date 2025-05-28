import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { CreateGame } from "./createGame.tsx";
import { CardTest } from "./Cardtest.tsx";
import { Game } from "./Game.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import SignInPage from "./signIn.tsx";
import { dark } from "@clerk/themes";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/cardtest" element={<CardTest />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/sign-in" element={<SignInPage />} />
          </Routes>
        </BrowserRouter>
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>
);
