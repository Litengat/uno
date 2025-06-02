import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const url = env.NEXT_PUBLIC_WORKER_URL;
const create = `${url}/create`;

export function CreateGame() {
  const navigate = useNavigate();
  return (
    <>
      <Button
        onClick={async () => {
          const id = (await (await fetch(create)).json()) as unknown as {
            id: string;
          };
          console.log("Game created with ID:", id.id);
          void navigate(`/game/${id.id}`);
        }}
      >
        Create Game
      </Button>
    </>
  );
}
