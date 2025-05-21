import { ConvexError } from "convex/values";
import { toast } from "sonner";

export async function catchError<T>(Promise: Promise<T>) {
  try {
    return await Promise;
  } catch (error) {
    console.log(error instanceof ConvexError);
    if (error instanceof ConvexError) {
      toast(error.data);
    }

    // do something with `errorMessage`
  }
}
