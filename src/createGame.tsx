import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";

const url = import.meta.env.VITE_API_URL;
const create = `${url}/create`;

export function CreateGame() {
  let navigate = useNavigate();
  return (
    <>
      <Button
        onClick={async () => {
          const id = (await (await fetch(create)).json()) as unknown as {
            id: string;
          };
          console.log("Game created with ID:", id.id);
          navigate(`/game/${id.id}`);
        }}
      >
        Create Game
      </Button>
    </>
  );
}
