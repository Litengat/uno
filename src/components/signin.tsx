"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Key, User } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { Dialog, DialogHeader } from "./ui/dialog";

type LoginStep = "method" | "username" | "google-username";
type LoginMethod = "google" | "anonymous" | null;

export default function SignIn() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<LoginStep>("method");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null);
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);

  const handleMethodSelect = (method: LoginMethod) => {
    setLoginMethod(method);
    if (method === "google") {
      setStep("google-username");
    } else {
      setStep("username");
    }
  };

  const handleGoogleLogin = async () => {
    // Simulate Google OAuth flow
    console.log("Initiating Google login...");
    // After Google auth, you might want to ask for username or use Google profile name
    if (username.trim()) {
      console.log("Logging in with Google as:", username);
      setOpen(false);
      resetDialog();
    }
  };

  const handleAnonymousLogin = () => {
    if (username.trim()) {
      console.log("Logging in anonymously as:", username);
      setOpen(false);
      resetDialog();
    }
  };

  const resetDialog = () => {
    setStep("method");
    setLoginMethod(null);
    setUsername("");
  };

  const goBack = () => {
    setStep("method");
    setLoginMethod(null);
    setUsername("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your email below to login to your account
        </CardDescription>
      </DialogHeader>
      <CardContent>
        <div className="grid gap-4">
          <div
            className={cn(
              "flex w-full items-center gap-2",
              "flex-col justify-between",
            )}
          >
            <Button
              variant="outline"
              className={cn("w-full gap-2")}
              disabled={loading}
              onClick={async () => {
                await signIn.social(
                  {
                    provider: "google",
                    callbackURL: "/",
                  },
                  {
                    onRequest: (ctx) => {
                      setLoading(true);
                    },
                    onResponse: (ctx) => {
                      setLoading(false);
                    },
                  },
                );
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285F4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                ></path>
                <path
                  fill="#34A853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                ></path>
                <path
                  fill="#EB4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2">or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className={cn("w-full gap-2")}
            onClick={() => handleMethodSelect("anonymous")}
          >
            <User className="h-5 w-5" />
            Continue anonymously
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-center border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            Powered by{" "}
            <Link
              href="https://better-auth.com"
              className="underline"
              target="_blank"
            >
              <span className="dark:text-orange-200/90">better-auth.</span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Dialog>
  );
}
