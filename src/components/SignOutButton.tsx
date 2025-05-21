"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "./ui/button";

/**
 * Renders a button that signs out the authenticated user.
 *
 * If the user is not authenticated, nothing is rendered.
 */
export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button className="" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
