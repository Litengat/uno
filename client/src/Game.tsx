import React, { useEffect, useState } from "react";
import { getOrCreateTrpcClient } from "./trpc";

interface Card {
  id: string;
  color: string;
  type: string;
  value: number | null;
}

interface Player {
  id: string;
  name: string;
  cardCount: number;
  hasCalledUno: boolean;
}

interface GameState {
  currentPlayerId: string | null;
  status: "WAITING" | "ACTIVE" | "COMPLETED";
  direction: "CLOCKWISE" | "COUNTER_CLOCKWISE";
  players: Player[];
  topCard?: Card;
  deckCount: number;
  winnerId?: string;
}

const Game: React.FC = () => {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedWildCard, setSelectedWildCard] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }/game-ws`
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setSocket(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        switch (message.type) {
          case "connected":
            setPlayerId(message.playerId);
            localStorage.setItem("playerId", message.playerId);
            break;

          case "gameStateUpdate":
            setGameState(message.gameState);
            break;

          case "playersUpdate":
            if (gameState) {
              setGameState((prev) =>
                prev ? { ...prev, players: message.players } : prev
              );
            }
            break;

          case "cardDrawn":
            setPlayerCards((prev) => [...prev, message.card]);
            break;

          case "gameStarted":
            setGameState(message.gameState);
            loadPlayerCards();
            break;

          case "gameOver":
            setGameState((prev) =>
              prev
                ? { ...prev, status: "COMPLETED", winnerId: message.winnerId }
                : prev
            );
            break;
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    };

    // Load playerId from storage
    const storedPlayerId = localStorage.getItem("playerId");
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    return () => {
      ws.close();
    };
  }, []);

  // Initialize tRPC client when playerId is available
  const trpc = playerId ? getOrCreateTrpcClient(playerId) : null;

  // Load game state when client is ready
  useEffect(() => {
    if (trpc && playerId) {
      fetchGameState();
      loadPlayerCards();
    }
  }, [trpc, playerId]);

  // Fetch current game state
  const fetchGameState = async () => {
    if (!trpc) return;

    try {
      const state = await trpc.getGameState.query();
      setGameState(state);
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError("Failed to load game state");
    }
  };

  // Load player's cards
  const loadPlayerCards = async () => {
    if (!trpc) return;

    try {
      const cards = await trpc.getPlayerCards.query();
      setPlayerCards(cards);
    } catch (err) {
      console.error("Error loading cards:", err);
    }
  };

  // Join game handler
  const handleJoinGame = async () => {
    if (!trpc || !playerName.trim()) return;

    try {
      await trpc.joinGame.mutate({ name: playerName.trim() });
      fetchGameState();
    } catch (err) {
      console.error("Error joining game:", err);
      setError("Failed to join game");
    }
  };

  // Start game handler
  const handleStartGame = async () => {
    if (!trpc) return;

    try {
      await trpc.startGame.mutate();
    } catch (err) {
      console.error("Error starting game:", err);
      setError("Failed to start game");
    }
  };

  // Play card handler
  const handlePlayCard = async (cardId: string) => {
    if (!trpc) return;

    const card = playerCards.find((c) => c.id === cardId);

    if (!card) return;

    try {
      if (card.type === "WILD" || card.type === "WILD_DRAW_FOUR") {
        setSelectedWildCard(cardId);
        setShowColorPicker(true);
      } else {
        await trpc.playCard.mutate({ cardId });
        setPlayerCards((cards) => cards.filter((c) => c.id !== cardId));
      }
    } catch (err) {
      console.error("Error playing card:", err);
      setError("Failed to play card");
    }
  };

  // Handle color selection for wild cards
  const handleColorSelect = async (color: string) => {
    if (!trpc || !selectedWildCard) return;

    try {
      await trpc.playCard.mutate({
        cardId: selectedWildCard,
        chosenColor: color,
      });

      setPlayerCards((cards) => cards.filter((c) => c.id !== selectedWildCard));
      setShowColorPicker(false);
      setSelectedWildCard(null);
    } catch (err) {
      console.error("Error playing wild card:", err);
      setError("Failed to play card");
    }
  };

  // Draw card handler
  const handleDrawCard = async () => {
    if (!trpc) return;

    try {
      await trpc.drawCard.mutate();
    } catch (err) {
      console.error("Error drawing card:", err);
      setError("Failed to draw card");
    }
  };

  // Call UNO handler
  const handleCallUno = async () => {
    if (!trpc) return;

    try {
      await trpc.sayUno.mutate();
    } catch (err) {
      console.error("Error calling UNO:", err);
      setError("Failed to call UNO");
    }
  };

  // Call out missing UNO handler
  const handleCallOutMissingUno = async (targetPlayerId: string) => {
    if (!trpc) return;

    try {
      const result = await trpc.callOutMissingUno.mutate({ targetPlayerId });
      if (!result.penalized) {
        setError("Player already called UNO or has more than one card");
      }
    } catch (err) {
      console.error("Error calling out UNO:", err);
      setError("Failed to call out missing UNO");
    }
  };

  // Render join form
  if (!gameState || gameState.status === "WAITING") {
    return (
      <div className="game-container">
        <h1>UNO Game</h1>
        {!playerId ? (
          <div className="loading">Connecting...</div>
        ) : (
          <>
            <div className="join-form">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <button onClick={handleJoinGame}>Join Game</button>
            </div>

            {gameState?.players && gameState.players.length > 0 && (
              <div className="lobby">
                <h2>Players in Lobby:</h2>
                <ul>
                  {gameState.players.map((player) => (
                    <li key={player.id}>{player.name}</li>
                  ))}
                </ul>

                {gameState.players.length >= 2 && (
                  <button onClick={handleStartGame}>Start Game</button>
                )}
              </div>
            )}
          </>
        )}

        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  // Render active game
  const isPlayerTurn = gameState.currentPlayerId === playerId;
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayerId
  );

  return (
    <div className="game-container">
      <h1>UNO Game</h1>

      {gameState.status === "COMPLETED" && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>
            Winner:{" "}
            {gameState.players.find((p) => p.id === gameState.winnerId)?.name}
          </p>
          <button onClick={handleStartGame}>Play Again</button>
        </div>
      )}

      <div className="game-info">
        <div className="direction">
          Direction: {gameState.direction === "CLOCKWISE" ? "→" : "←"}
        </div>
        <div className="current-player">
          Current Turn: {currentPlayer?.name || "Unknown"}
          {isPlayerTurn && <span className="your-turn"> (Your Turn)</span>}
        </div>
      </div>

      <div className="players-list">
        <h3>Players:</h3>
        <ul>
          {gameState.players.map((player) => (
            <li
              key={player.id}
              className={
                player.id === gameState.currentPlayerId ? "active-player" : ""
              }
            >
              {player.name} - {player.cardCount} cards
              {player.cardCount === 1 && !player.hasCalledUno && (
                <button onClick={() => handleCallOutMissingUno(player.id)}>
                  Call out!
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="play-area">
        <div className="top-card">
          <h3>Top Card:</h3>
          {gameState.topCard && (
            <div
              className={`card ${gameState.topCard.color.toLowerCase()}`}
              title={`${gameState.topCard.color} ${gameState.topCard.type} ${
                gameState.topCard.value || ""
              }`}
            >
              {gameState.topCard.type === "NUMBER"
                ? gameState.topCard.value
                : gameState.topCard.type}
            </div>
          )}
        </div>

        <div
          className="deck"
          onClick={isPlayerTurn ? handleDrawCard : undefined}
        >
          <div className="card deck-card">
            <span className="card-back">UNO</span>
          </div>
          <div className="deck-count">{gameState.deckCount} cards</div>
        </div>
      </div>

      <div className="player-hand">
        <h3>Your Cards:</h3>
        <div className="cards-container">
          {playerCards.map((card) => (
            <div
              key={card.id}
              className={`card ${card.color.toLowerCase()}`}
              onClick={() => (isPlayerTurn ? handlePlayCard(card.id) : null)}
              title={`${card.color} ${card.type} ${card.value || ""}`}
            >
              {card.type === "NUMBER" ? card.value : card.type}
            </div>
          ))}
        </div>
      </div>

      {isPlayerTurn && playerCards.length === 2 && (
        <button className="uno-button" onClick={handleCallUno}>
          UNO!
        </button>
      )}

      {showColorPicker && (
        <div className="color-picker">
          <h3>Choose a color:</h3>
          <div className="color-options">
            <button
              className="color-btn red"
              onClick={() => handleColorSelect("RED")}
            >
              Red
            </button>
            <button
              className="color-btn blue"
              onClick={() => handleColorSelect("BLUE")}
            >
              Blue
            </button>
            <button
              className="color-btn green"
              onClick={() => handleColorSelect("GREEN")}
            >
              Green
            </button>
            <button
              className="color-btn yellow"
              onClick={() => handleColorSelect("YELLOW")}
            >
              Yellow
            </button>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Game;
