// Import event handlers
import { join } from "./events/joinHandler";
import { startGame } from "./events/startGameHandler";
import { drawCard } from "./events/drawCardHandler";
import { layDown } from "./events/layDownHandler";
import { leave } from "./events/leaveHandler";

export const serverRouter = {
  meta: {
    startGame,
    join,
    leave,
  },
  game: {
    layDown,
    drawCard,
  },
};
