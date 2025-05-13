export type EventObject<T> = {
  type: string;
  schema: T;
  func: (event: T, context: any) => void;
};

export type Event = {
  type: string;
  playerId: string;
  [key: string]: any;
};

export type Response<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface ClientToServerEvents {
  [event: string]: (data: any) => void;
}

export interface ServerToClientEvents {
  [event: string]: (data: any) => void;
}

export interface InterServerEvents {
  ping: () => void;
}