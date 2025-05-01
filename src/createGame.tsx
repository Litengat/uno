import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";

export function CreateGame() {
  let navigate = useNavigate();
  return (
    <>
      <Button
        onClick={async () => {
          const id = (await (
            await fetch("http://localhost:5173/create")
          ).json()) as unknown as { id: string };
          console.log("Game created with ID:", id.id);
          navigate(`/game/${id.id}`);
        }}
      >
        Create Game
      </Button>
    </>
  );
}
