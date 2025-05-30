import { clsx, type ClassValue } from "clsx";
import { err, ok } from "neverthrow";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse(jsonString: string) {
  try {
    return ok(JSON.parse(jsonString));
  } catch (e: unknown) {
    console.error("Json parse error", e);
    return err("Json failed to parse");
  }
}
