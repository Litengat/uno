import express from 'express';
import { EventManager } from './game/EventManager';
import { GameRoom } from './GameRoom';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Initialize GameRoom and EventManager
const gameRoom = new GameRoom();
const eventManager = new EventManager(gameRoom);

// Example of registering an event
eventManager.register({
  type: 'exampleEvent',
  schema: z.object({
    playerId: z.string(),
    action: z.string(),
  }),
  func: (data, room) => {
    console.log(`Player ${data.playerId} performed action: ${data.action}`);
    // Handle the event in the game room
  },
});

// Example of handling a POST request to trigger an event
app.post('/event', (req, res) => {
  const result = eventManager.run(req.body);
  if (result.isErr()) {
    return res.status(400).json({ error: result.error });
  }
  res.status(200).json({ message: 'Event processed successfully' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});