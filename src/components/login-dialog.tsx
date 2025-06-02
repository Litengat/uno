"use client";

import { useEffect, useState } from "react";
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
import {
  LogIn,
  User,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { authClient, signIn } from "@/lib/auth-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "./ui/alert";
import { isUsernameUsed } from "@/server/users";
import { isUtf8 } from "buffer";

type LoginStep = "method" | "username" | "google-username";

export default function LoginDialog() {
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(searchParams.get("login") === "true");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isDisplayNameManuallyEdited, setIsDisplayNameManuallyEdited] =
    useState(false);

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

  const handleAnonymousLogin = async () => {
    await signIn.anonymous();
    setStep("username");
  };

  const submitUsername = () => {
    void authClient.updateUser({
      username: username,
    });
    setOpen(false);
    resetDialog();
  };

  const resetDialog = () => {
    setStep("method");

    setUsername("");
  };

  const goBack = () => {
    setStep("method");

    setUsername("");
  };

  const validateUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim()) {
      setUsernameError("");
      setIsUsernameValid(false);
      return;
    }

    if (usernameToCheck.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      setIsUsernameValid(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameError(
        "Username can only contain letters, numbers, and underscores",
      );
      setIsUsernameValid(false);
      return;
    }

    setIsValidating(true);
    setUsernameError("");

    // Simulate API delay

    if (!(await isUsernameUsed(usernameToCheck.toLowerCase()))) {
      setUsernameError("This username is already taken");
      setIsUsernameValid(false);
    } else {
      setUsernameError("");
      setIsUsernameValid(true);
    }

    setIsValidating(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        void validateUsername(username);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [username]);

  // Auto-sync display name with username unless manually edited
  useEffect(() => {
    if (!isDisplayNameManuallyEdited && username) {
      setDisplayName(username);
    }
  }, [username, isDisplayNameManuallyEdited]);

  const isFormValid = isUsernameValid && displayName.trim() && !isValidating;
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
                Complete your profile
              </DialogTitle>
              <DialogDescription>
                Choose a unique username and display name for your Google
                account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="google-username">Username</Label>
                <div className="relative">
                  <Input
                    id="google-username"
                    placeholder="Enter a unique username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pr-8 ${usernameError ? "border-red-500" : isUsernameValid ? "border-green-500" : ""}`}
                  />
                  <div className="absolute top-1/2 right-2 -translate-y-1/2">
                    {isValidating && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {!isValidating && usernameError && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {!isValidating && isUsernameValid && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="flex items-center text-sm text-red-500">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    {usernameError}
                  </p>
                )}
                {isUsernameValid && (
                  <p className="text-sm text-green-600">
                    ✓ Username is available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-display-name">Display Name</Label>
                <Input
                  id="google-display-name"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setIsDisplayNameManuallyEdited(true);
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  Auto-filled from username. You can change this if you prefer.
                </p>
              </div>

              <Button
                onClick={submitUsername}
                className="w-full"
                disabled={!isFormValid}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Complete sign-in"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
