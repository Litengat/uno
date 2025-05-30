"use client";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const url = env.NEXT_PUBLIC_API_URL;
const create = `${url}/create`;

export default function CreateGame() {
  const router = useRouter();
  return (
    <>
      <Button
        onClick={async () => {
          const id = (await (await fetch(create)).json()) as unknown as {
            id: string;
          };
          console.log("Game created with ID:", id.id);
          void router.push(`/game/${id.id}`);
        }}
      >
        Create Game
      </Button>
    </>
  );
}
