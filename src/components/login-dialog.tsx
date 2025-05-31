"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogIn, User, ArrowLeft } from "lucide-react";
import { authClient, signIn } from "@/lib/auth-client";
import { usePathname, useSearchParams } from "next/navigation";

type LoginStep = "method" | "username" | "google-username";

export default function LoginDialog() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("login") === "true");

  const [username, setUsername] = useState("");
  const pathname = usePathname();
  const { data: session, error } = authClient.useSession();

  const [step, setStep] = useState<LoginStep>(
    session === null ? "username" : "method",
  );

  const handleGoogleLogin = async () => {
    // Simulate Google OAuth flow
    console.log("Initiating Google login...");
    await signIn.social({
      provider: "google",
      callbackURL: pathname + "?login=true",
    });
  };

  const handleAnonymousLogin = () => {
    if (username.trim()) {
      console.log("Logging in anonymously as:", username);
      setOpen(false);
      resetDialog();
    }
  };

  const submitUsername = () => {
    void authClient.updateUser({
      username: username,
    });
  };

  const resetDialog = () => {
    setStep("method");

    setUsername("");
  };

  const goBack = () => {
    setStep("method");

    setUsername("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <LogIn className="h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "method" && (
          <>
            <DialogHeader>
              <DialogTitle>Welcome back</DialogTitle>
              <DialogDescription>
                {"Choose how you'd like to sign in to your account"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3"
                onClick={() => handleGoogleLogin()}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">
                    or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3"
                onClick={() => handleAnonymousLogin()}
              >
                <User className="h-5 w-5" />
                Continue anonymously
              </Button>
            </div>
          </>
        )}
        {step === "username" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="h-auto p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Choose a username
              </DialogTitle>
              <DialogDescription>Enter a username</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && username.trim()) {
                      submitUsername();
                    }
                  }}
                />
              </div>
              <Button
                onClick={submitUsername}
                className="w-full"
                disabled={!username.trim()}
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
