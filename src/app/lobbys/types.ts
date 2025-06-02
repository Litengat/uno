export interface User {
  id: string;
  name: string;
  avatar: string;
  level?: number;
  stats?: {
    wins: number;
    losses: number;
    draws?: number;
    rank?: string;
    gamesPlayed: number;
    cardsPlayed?: number;
    specialCardsUsed?: number;
    winStreak?: number;
  };
  badges?: string[];
  status?: "online" | "offline" | "in-game";
  favoriteCards?: string[];
  joinedDate?: Date;
  title?: string; // Added title property for profile cards
  experience?: number; // Added experience property for profile cards
}

export interface Lobby {
  id: string;
  name: string;
  host: User;
  status: "open" | "full" | "in-progress";
  gameMode: "casual" | "ranked" | "tournament";
  difficulty: "easy" | "medium" | "hard";
  players: {
    current: number;
    max: number;
  };
  region?: string;
  createdAt: Date;
}
