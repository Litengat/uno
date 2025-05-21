import { Id } from "convex/_generated/dataModel";
import { useParams } from "react-router";

export function useGame() {
  const { id } = useParams();
  if (!id) {
    throw new Error("id is undefined");
  }
  return id as Id<"games">;
}
