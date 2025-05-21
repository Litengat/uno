import { Id } from "convex/_generated/dataModel";
import { useParams } from "react-router";

/**
 * Retrieves the game ID from the URL parameters and returns it as a typed value.
 *
 * @returns The game ID from the route parameters, typed as {@link Id<"games">}.
 *
 * @throws {Error} If the `id` parameter is missing from the URL.
 */
export function useGame() {
  const { id } = useParams();
  if (!id) {
    throw new Error("id is undefined");
  }
  return id as Id<"games">;
}
