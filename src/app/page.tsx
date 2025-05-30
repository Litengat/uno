"use client";
import SignIn from "@/components/signin";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function HomePage() {
  const auth = authClient.useSession();
  console.log(auth);
  return (
    <div>
      <h1>Hi {auth.data?.user.name}</h1>
      <SignIn></SignIn>
    </div>
  );
}
