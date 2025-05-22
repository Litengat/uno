import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const url = import.meta.env.VITE_API_URL;
const create = `${url}/create`;

/**
 * Renders a button that creates a new game and navigates to its page upon creation.
 *
 * When clicked, the button triggers a backend mutation to create a game and redirects the user to the newly created game's route.
 */
export function CreateGame() {
  let navigate = useNavigate();
  const createGame = useMutation(api.game.createGame);
  return (
    <>
      <Button
        onClick={async () => {
          const id = await createGame();

          navigate(`/game/${id}`);
        }}
      >
        Create Game
      </Button>
    </>
  );
}
