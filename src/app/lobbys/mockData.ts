import { Lobby, User } from "./types";

export const currentUser: User = {
  id: "user-1",
  name: "Player1337",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey",
  level: 42,
};

export const mockLobbies: Lobby[] = [
  {
    id: "lobby-1",
    name: "Quick Match Lobby",
    host: {
      id: "host-1",
      name: "GameMaster",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    },
    status: "open",
    gameMode: "casual",
    difficulty: "easy",
    players: {
      current: 2,
      max: 8,
    },
    region: "NA",
    createdAt: new Date("2023-05-20T14:30:00"),
  },
  {
    id: "lobby-2",
    name: "Pro Players Only",
    host: {
      id: "host-2",
      name: "EliteGamer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mittens",
    },
    status: "open",
    gameMode: "ranked",
    difficulty: "hard",
    players: {
      current: 3,
      max: 4,
    },
    region: "EU",
    createdAt: new Date("2023-05-20T15:15:00"),
  },
  {
    id: "lobby-3",
    name: "Beginners Welcome",
    host: {
      id: "host-3",
      name: "FriendlyHost",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dusty",
    },
    status: "open",
    gameMode: "casual",
    difficulty: "easy",
    players: {
      current: 1,
      max: 10,
    },
    region: "AS",
    createdAt: new Date("2023-05-20T15:45:00"),
  },
  {
    id: "lobby-4",
    name: "Tournament Practice",
    host: {
      id: "host-4",
      name: "TourneyPro",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    },
    status: "in-progress",
    gameMode: "tournament",
    difficulty: "medium",
    players: {
      current: 8,
      max: 8,
    },
    region: "EU",
    createdAt: new Date("2023-05-20T11:00:00"),
  },
  {
    id: "lobby-5",
    name: "Casual Fun Times",
    host: {
      id: "host-5",
      name: "LaidBackPlayer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy",
    },
    status: "open",
    gameMode: "casual",
    difficulty: "easy",
    players: {
      current: 3,
      max: 6,
    },
    region: "NA",
    createdAt: new Date("2023-05-20T16:20:00"),
  },
  {
    id: "lobby-6",
    name: "Hardcore Gamers",
    host: {
      id: "host-6",
      name: "NeverSleep",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
    },
    status: "full",
    gameMode: "ranked",
    difficulty: "hard",
    players: {
      current: 4,
      max: 4,
    },
    region: "AS",
    createdAt: new Date("2023-05-20T13:10:00"),
  },
  {
    id: "lobby-7",
    name: "Weekend Warriors",
    host: {
      id: "host-7",
      name: "WeekendGamer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pepper",
    },
    status: "open",
    gameMode: "casual",
    difficulty: "medium",
    players: {
      current: 2,
      max: 6,
    },
    region: "EU",
    createdAt: new Date("2023-05-20T17:00:00"),
  },
  {
    id: "lobby-8",
    name: "Championship Qualifier",
    host: {
      id: "host-8",
      name: "ChampionSeeker",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    },
    status: "in-progress",
    gameMode: "tournament",
    difficulty: "hard",
    players: {
      current: 16,
      max: 16,
    },
    region: "NA",
    createdAt: new Date("2023-05-20T10:30:00"),
  },
];
