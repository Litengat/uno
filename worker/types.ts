export type Attachment = {
  id: string;
  name: string | undefined;
};

export type Player = {
  id: string;
  name: string | undefined;
  websocket: WebSocket;
};
