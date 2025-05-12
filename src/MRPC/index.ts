export type ClientConfig = {
  url?: string;
  customFetch?: (
    path: string,
    input: any,
    options?: { streaming?: boolean }
  ) => Promise<any>;
};

export type Router = Record<string, any>;

export class TRPCClient {
  private customFetch?: (
    path: string,
    input: any,
    options?: { streaming?: boolean }
  ) => Promise<any>;

  constructor(config: ClientConfig = {}) {
    this.customFetch = config.customFetch;
  }

  public async query<TOutput>(path: string, input: any): Promise<TOutput> {
    if (this.customFetch) {
      return await this.customFetch(path, input);
    }

    throw new Error(
      "No fetch implementation provided. Please implement the communication layer."
    );
  }

  public async stream<TOutput>(
    path: string,
    input: any,
    onData: (data: TOutput) => void
  ): Promise<void> {
    if (!this.customFetch) {
      throw new Error(
        "No fetch implementation provided. Please implement the communication layer."
      );
    }

    const generator = await this.customFetch(path, input, { streaming: true });

    if (Symbol.asyncIterator in generator) {
      for await (const item of generator) {
        onData(item);
      }
    } else {
      throw new Error("Stream response is not an async iterable");
    }
  }

  public createProxy() {
    const handler = {
      get: (target: any, prop: string) => {
        if (typeof target[prop] === "object" && target[prop] !== null) {
          // Continue proxy chain for nested objects
          return new Proxy(target[prop], handler);
        }

        if (target[prop] === undefined) {
          // Build path for undefined properties
          const path = this.buildPath(target, prop);

          // Create a function to call the procedure
          return (input: any) => {
            // Check if procedure is marked as streaming in target's metadata
            const isStreaming = target._metadata?.[prop]?.isStream;

            if (isStreaming) {
              return {
                subscribe: (onData: (data: any) => void) => {
                  return this.stream(path, input, onData);
                },
              };
            }

            return this.query(path, input);
          };
        }

        return target[prop];
      },
    };

    const proxy = new Proxy({ _path: [] }, handler);
    return proxy;
  }

  private buildPath(target: any, prop: string): string {
    const path = [...(target._path || [])];

    // Add all properties except special ones
    if (prop !== "_path" && prop !== "_metadata") {
      path.push(prop);
    }

    return path.join(".");
  }
}

// Helper function to wrap a router for client-side usage
export function createClientRouter(router: Router) {
  const clientRouter: any = {};

  // Recursively process the router to create a structure with metadata
  function processRouter(current: any, target: any, path: string[] = []) {
    for (const key of Object.keys(current)) {
      const value = current[key];
      const newPath = [...path, key];

      if (typeof value === "function") {
        // Found a procedure, add metadata
        if (!target._metadata) target._metadata = {};
        target._metadata[key] = {
          isStream: value._def?.isStream || false,
        };
      } else if (typeof value === "object" && value !== null) {
        // Found a nested router
        if (!target[key]) target[key] = { _path: newPath };
        processRouter(value, target[key], newPath);
      }
    }
  }

  processRouter(router, clientRouter);
  return clientRouter;
}
