"use client";
import SignIn from "@/components/signin";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { NameDialog } from "@/components/NameDialog";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/login-dialog";

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const auth = authClient.useSession();
  console.log(auth);

  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Name
      </Button>
      <Button
        onClick={() => {
          void authClient.signOut();
        }}
      >
        Signout
      </Button>
      <Button
        onClick={async () => {
          const user = await authClient.signIn.anonymous();
          console.log(user);
        }}
      >
        Anonymus
      </Button>
      <h1>Hi {auth.data?.user.displayUsername}</h1>
      <LoginDialog></LoginDialog>
      {/* <NameDialog open={open} setOpen={setOpen}></NameDialog> */}
    </div>
  );
}
