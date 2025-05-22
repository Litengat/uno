"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Renders a sign-in form with options for email/password authentication, account creation, and anonymous sign-in.
 *
 * Provides UI and logic for users to sign in or sign up using their email and password, or to sign in anonymously with a chosen username. Displays appropriate form fields, handles submission state, and shows error notifications on authentication failure.
 */
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [anonymousUsername, setAnonymousUsername] = useState("");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{flow === "signIn" ? "Sign In" : "Sign Up"}</CardTitle>
        <CardDescription>
          {flow === "signIn"
            ? "Enter your credentials to access your account."
            : "Create an account to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData)
              .catch((_error) => {
                const toastTitle =
                  flow === "signIn"
                    ? "Could not sign in. Please check your credentials."
                    : "Could not sign up. Please try again.";
                toast.error(toastTitle);
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="email@example.com"
              required
              disabled={submitting}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              required
              disabled={submitting}
            />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting
              ? flow === "signIn"
                ? "Signing In..."
                : "Signing Up..."
              : flow === "signIn"
              ? "Sign In"
              : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {flow === "signIn"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            disabled={submitting}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </Button>
        </div>
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-muted" />
          <span className="mx-4 text-xs uppercase text-muted-foreground">
            Or
          </span>
          <div className="flex-grow border-t border-muted" />
        </div>
        <div className="grid w-full items-center gap-1.5 mb-4">
          <Label htmlFor="anonymousUsername">Username</Label>
          <Input
            id="anonymousUsername"
            type="text"
            name="anonymousUsername"
            placeholder="Choose a username"
            value={anonymousUsername}
            onChange={(e) => setAnonymousUsername(e.target.value)}
            disabled={submitting}
          />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (!anonymousUsername.trim()) {
              toast.error("Please enter a username to sign in anonymously.");
              return;
            }
            setSubmitting(true);
            const formData = new FormData();
            formData.set("username", anonymousUsername);
            void signIn("anonymous", formData)
              .catch((_error) => {
                toast.error("Could not sign in anonymously. Please try again.");
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
          disabled={submitting || !anonymousUsername.trim()}
        >
          Sign in anonymously
        </Button>
      </CardContent>
    </Card>
  );
}
