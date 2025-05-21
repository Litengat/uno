import { ConvexError } from "convex/values";
import { toast } from "sonner";

/**
 * Awaits a Promise and displays a toast notification if a ConvexError is caught.
 *
 * If the awaited Promise rejects with a {@link ConvexError}, the error's data is shown using a toast notification.
 *
 * @param Promise - The Promise to await.
 * @returns The resolved value of the Promise, or undefined if an error occurs.
 *
 * @remark Errors that are not instances of {@link ConvexError} are ignored and not rethrown.
 */
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
