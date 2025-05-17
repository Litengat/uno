import { z } from "zod";

// === Type Definitions ===

/**
 * Type for a procedure with input validation and handler
 */
export type Procedure<TInput, TOutput, TContext> = {
  _input: z.ZodType<TInput>;
  _output: TOutput;
  _def: {
    input: z.ZodType<TInput>;
    handler: (ctx: { input: TInput } & TContext) => Promise<TOutput>;
  };
};

/**
 * Utility type to extract all procedures from a router
 */
export type ProcedureRecord = Record<string, Procedure<any, any, any>>;

/**
 * Type for a router containing nested routers and procedures
 */
export type Router = {
  [key: string]: Router | Procedure<any, any, any>;
};

/**
 * Utility type to create a type-safe client
 */
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// Type for inferring the input type of a procedure
export type inferProcedureInput<T extends Procedure<any, any, any>> = z.infer<
  T["_def"]["input"]
>;

// Type for inferring the output type of a procedure
export type inferProcedureOutput<T extends Procedure<any, any, any>> =
  T["_output"];

// === Operation System ===

/**
 * Creates type-safe procedures with Zod validation
 */
export function createOS<TContext>() {
  const os = {
    input: <TInput extends z.ZodType>(schema: TInput) => {
      return {
        handler: <TOutput>(
          handler: (
            ctx: TContext & { input: z.infer<TInput> }
          ) => Promise<TOutput>
        ): Procedure<z.infer<TInput>, TOutput, TContext> => {
          return {
            _input: schema,
            _output: {} as TOutput, // Placeholder used for type inference
            _def: {
              input: schema,
              handler: handler as any,
            },
          };
        },
      };
    },
  };
  return os;
}

// === Client Type Utilities ===

/**
 * Creates a type for the client based on the router structure
 */
export type inferClientType<TRouter extends Router> = {
  [TKey in keyof TRouter]: TRouter[TKey] extends Router
    ? inferClientType<TRouter[TKey]>
    : TRouter[TKey] extends Procedure<infer TInput, infer TOutput, any>
    ? (input: TInput) => Promise<TOutput>
    : never;
};

// === Serialization/Deserialization Functions ===

/**
 * Serializes a procedure call
 */
export function serializeCall<TInput>(path: string[], input: TInput) {
  return {
    path,
    input,
  };
}

/**
 * Type for serialized call
 */
type SerializedCall = {
  path: string[];
  input: unknown;
};

/**
 * Deserializes and executes a procedure call
 */
export async function deserializeAndExecute<TOutput, TContext>(
  router: Router,
  serializedCall: any,
  context: TContext
): Promise<TOutput> {
  const { path, input } = serializedCall as SerializedCall;

  // Navigate to the correct procedure in the router
  let current: any = router;
  for (const segment of path) {
    if (!current[segment]) {
      throw new Error(`Path segment "${segment}" not found in router`);
    }
    current = current[segment];
  }

  const procedure = current as Procedure<unknown, TOutput, TContext>;
  // Validate the input using Zod

  try {
    const validatedInput = procedure._def.input.parse(input);
    // Execute the handler with properly validated input
    return await procedure._def.handler({
      ...context,
      input: validatedInput,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
}

// === Create Type-Safe Client ===

/**
 * Creates a type-safe client for the router
 */
export function createMRPCClient<TRouter extends Router>(
  router: TRouter,
  callFn: <TInput, TOutput>(path: string[], input: TInput) => Promise<TOutput>
): inferClientType<TRouter> {
  // Helper function to recursively create a proxy
  function createRecursiveProxy(path: string[] = []) {
    return new Proxy(
      {},
      {
        get(target, prop: string) {
          // Skip internal properties
          if (prop === "then" || prop === "catch" || prop === "finally") {
            return undefined;
          }

          // Build the path as we chain properties
          const newPath = [...path, prop];

          // Check if this is a leaf node (procedure) or another router
          let current: any = router;
          for (const segment of newPath) {
            if (!current || !current[segment]) {
              // If path doesn't exist, still return a proxy to keep the chain going
              return createRecursiveProxy(newPath);
            }
            current = current[segment];
          }

          if (current && typeof current === "object" && "_def" in current) {
            // This is a procedure, create a function that executes it
            return (input: any) => {
              // Validate input (gives better errors at call time)
              const validatedInput = current._def.input.parse(input);

              return callFn(newPath, validatedInput);
            };
          }

          // Continue building the path
          return createRecursiveProxy(newPath);
        },
      }
    );
  }

  return createRecursiveProxy() as inferClientType<TRouter>;
}

// // === Example Usage ===

// // Example schemas and procedures
// const PlanetSchema = z.object({
//   id: z.number().int().min(1),
//   name: z.string(),
//   description: z.string().optional(),
// });

// // Type for a planet
// type Planet = z.infer<typeof PlanetSchema>;

// // Define the procedures with proper typing
// const listPlanet = os
//   .input(
//     z.object({
//       limit: z.number().int().min(1).max(100).optional(),
//       cursor: z.number().int().min(0).default(0),
//     })
//   )
//   .handler(async ({ input }) => {
//     // The input is properly typed
//     const { limit = 10, cursor } = input;
//     console.log(`Listing planets with limit ${limit} and cursor ${cursor}`);
//     return [{ id: 1, name: "Mars" } as Planet];
//   });

// const findPlanet = os
//   .input(PlanetSchema.pick({ id: true }))
//   .handler(async ({ input }) => {
//     // The input is properly typed
//     console.log(`Finding planet with ID: ${input.id}`);
//     return {
//       id: input.id,
//       name: "Earth",
//       description: "Blue planet",
//     } as Planet;
//   });

// // Define the router
// const router = {
//   planet: {
//     list: listPlanet,
//     find: findPlanet,
//   },
// } as const;

// // Create a type-safe client
// // TypeScript will provide autocomplete and command-click navigation
// // const mrpc = createMRPCClient(router,() => {});

// // Example usage
// async function example() {
//   try {
//     // Using the client with type checking
//     console.log("Calling planet.list:");
//     const planets = await mrpc.planet.list({ cursor: 1, limit: 5 });
//     console.log("Result:", planets);

//     console.log("\nCalling planet.find:");
//     const planet = await mrpc.planet.find({ id: 1 });
//     console.log("Result:", planet);

//     // This would be a TypeScript error due to the type safety:
//     // const invalidPlanet = await mrpc.planet.find({ id: "1" });

//     // For demonstration purposes, we can also use the serialization/deserialization
//     console.log("\nDemonstrating serialization/deserialization:");
//     const serializedCall = serializeCall(["planet", "find"], { id: 2 });
//     console.log("Serialized call:", serializedCall);

//     const result = await deserializeAndExecute(router, serializedCall);
//     console.log("Deserialized result:", result);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// // Run the example
// example();

// // Export type utilities for consumers
// export type {
//   Planet, // Export any domain types
// };

// // Type tests - these ensure type inference is working correctly
// type PlanetListInput = inferProcedureInput<typeof listPlanet>;
// type PlanetListOutput = inferProcedureOutput<typeof listPlanet>;
// type PlanetFindInput = inferProcedureInput<typeof findPlanet>;
// type PlanetFindOutput = inferProcedureOutput<typeof findPlanet>;

// // The following types should be:
// // PlanetListInput = { limit?: number; cursor?: number }
// // PlanetListOutput = Planet[]
// // PlanetFindInput = { id: number }
// // PlanetFindOutput = Planet
