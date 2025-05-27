# 🎴 UNO - Multiplayer Card Game

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/Litengat/uno?utm_source=oss&utm_medium=github&utm_campaign=Litengat%2Funo&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

A real-time multiplayer UNO card game built with React, TypeScript, and Cloudflare Workers. Play the classic UNO card game with friends online in real-time!

## ✨ Features

### 🎮 Game Features

- **Real-time Multiplayer**: Play with up to 6 players simultaneously
- **Full UNO Rules**: Complete implementation of classic UNO gameplay
- **Interactive UI**: Drag-and-drop card playing with smooth animations
- **Game Lobby System**: Browse and join game lobbies with different modes
- **Player Statistics**: Track wins, losses, games played, and more
- **Multiple Game Modes**: Casual, ranked, and tournament gameplay

### 🎯 Card Types Supported

- **Number Cards**: 0-9 in four colors (Red, Blue, Green, Yellow)
- **Action Cards**: Skip, Reverse, Draw Two
- **Wild Cards**: Wild and Wild Draw Four with color selection
- **Special Effects**: All card effects properly implemented

### 🏆 Game Modes

- **Casual**: Relaxed gameplay for fun
- **Ranked**: Competitive matches with skill-based matchmaking
- **Tournament**: Multi-round elimination tournaments

## 🚀 Tech Stack

### Frontend

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **DND Kit** - Drag and drop functionality

- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

### Backend

- **Cloudflare Workers** - Serverless backend
- **Durable Objects** - Stateful game rooms
- **WebSockets** - Real-time communication

### Development Tools

- **pnpm** - Fast package manager
- **ESLint** - Code linting
- **Wrangler** - Cloudflare development CLI

## 🏗️ Architecture

### Game State Management

The game uses a distributed architecture with:

- **Client State**: Player hand, UI state, local game state
- **Server State**: Authoritative game state, player validation, turn management
- **Real-time Sync**: WebSocket events keep all clients synchronized

### Durable Objects

Each game room is backed by a Cloudflare Durable Object that maintains:

- Game state (deck, discard pile, current player)
- Player data (cards, connection state)
- Turn management and game rules enforcement

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account (for deployment)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd uno
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

The game will be available at `http://localhost:5173`

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm deploy` - Build and deploy to Cloudflare
- `pnpm lint` - Run ESLint

## 🎯 How to Play

### Joining a Game

1. Browse available lobbies on the main screen
2. Filter by game mode, difficulty, or region
3. Click "Join Lobby" on an open game
4. Wait for other players or use "Quick Join"

### Gameplay

1. **Your Turn**: Drag and drop a valid card onto the discard pile
2. **Drawing Cards**: Click the deck to draw a card if you can't play
3. **Wild Cards**: Select a color when playing wild cards
4. **Special Cards**:
   - **Skip**: Next player loses their turn
   - **Reverse**: Changes direction of play
   - **Draw Two**: Next player draws 2 cards and loses turn
   - **Wild Draw Four**: Choose color, next player draws 4 cards

### Winning

- First player to play all their cards wins the round
- Watch out for other players getting close to winning!

## 🔧 Configuration

### Environment Variables

```bash
# Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# WebSocket URL (for development)
VITE_WEBSOCKET_URL=ws://localhost:5173/websocket/
```

### Wrangler Configuration

The project uses `wrangler.jsonc` for Cloudflare Workers configuration:

- Durable Objects for game rooms
- WebSocket support for real-time communication
- SQLite for game state persistence

## 🎨 Customization

### Styling

- Uses TailwindCSS with custom UNO color palette
- Card animations and hover effects
- Responsive design for various screen sizes
- Dark/light theme support with `next-themes`

### Game Rules

Card validation and game rules are implemented in:

- `worker/db/card.ts` - Card logic and deck creation
- `worker/game/events/` - Game event handlers
- `lib/LayDownVerifier.ts` - Client-side card validation

## 🚀 Deployment

### Cloudflare Workers

```bash
# Build and deploy
pnpm run deploy

# Deploy with custom environment
wrangler deploy --env production
```

### Environment Setup

1. Configure Cloudflare Workers environment
2. Set up Durable Objects
3. Configure domain and routing
4. Set environment variables in Cloudflare dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint configuration provided
- Write meaningful commit messages
- Test multiplayer functionality thoroughly
- Ensure WebSocket events are properly typed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues & Roadmap

### Current Known Issues

- Game state occasionally desyncs during rapid play
- Mobile drag-and-drop needs optimization
- Tournament mode needs additional testing

### Roadmap

- [ ] Mobile app version
- [ ] Spectator mode
- [ ] Custom game rules (house rules)
- [ ] Voice chat integration
- [ ] Advanced tournament brackets
- [ ] Player achievements and badges
- [ ] Custom card themes

## 🙏 Acknowledgments

- UNO card game by Mattel
- Cloudflare Workers team for excellent platform
- Open source community for amazing libraries
- Contributors and testers

## 🔗 References

- [CodePen Fan Card Layout](https://codepen.io/marssantoso/pen/RwvqJOa)
- [React TextFit Documentation](https://www.npmjs.com/package/react-textfit?activeTab=readme)

---

**Ready to play?** Start the development server and challenge your friends to a game of UNO! 🎴✨
