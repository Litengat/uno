import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerCard } from "./PlayerCard";
import { GameRules } from "./GameRules";
import { HostSettings } from "./HostSettings";
import {
  Users,
  Trophy,
  Zap,
  UserPlus,
  UserMinus,
  Play,
  Settings,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  cardCount: number;
}

export interface UnoGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  players: Player[];
  startingCardCount: number;
  specialRules: string[];
  gameStats: {
    totalGames: number;
    averageGameTime: string;
    fastestWin: string;
    currentStreak: number;
  };
  isGameStarting: boolean;
  countdown?: number;
}

export const UnoGameDialog: React.FC<UnoGameDialogProps> = ({
  isOpen,
  onClose,
  gameId,
  players,
  startingCardCount: initialStartingCardCount,
  specialRules: initialSpecialRules,
  isGameStarting,
  countdown,
}) => {
  const [showHostSettings, setShowHostSettings] = useState(false);
  const [startingCardCount, setStartingCardCount] = useState(
    initialStartingCardCount,
  );
  const [specialRules, setSpecialRules] = useState(initialSpecialRules);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [timeLimit, setTimeLimit] = useState(30);

  // Check if current user is host (assuming first player is host for demo)
  const isHost = players.length > 0 && players[0].isHost;
  const allPlayersReady = players.length > 1 && players.every((p) => p.isReady);

  const readyPlayers = players.filter((p) => p.isReady);

  const handleJoinGame = () => {
    console.log("Joining game...");
  };

  const handleLeaveGame = () => {
    console.log("Leaving game...");
    onClose();
  };

  const handleStartGame = () => {
    console.log("Starting game...");
    // This would trigger the game start countdown
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-yellow-500">
              <span className="font-bold text-white">U</span>
            </div>
            UNO Game Lobby
            <Badge variant="secondary" className="ml-2">
              Room: {gameId}
            </Badge>
            {isHost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHostSettings(!showHostSettings)}
                className="ml-auto"
              >
                <Settings className="mr-1 h-4 w-4" />
                {showHostSettings ? "Hide Settings" : "Host Settings"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Starting Countdown */}
          {isGameStarting && countdown && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-green-600">
                    Game Starting in {countdown}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Zap className="h-4 w-4" />
                    Get ready to play!
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content - Settings on left (larger), Players on right (smaller) */}
          <div className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Game Settings - Left Side (2/3 of space) */}
            <div className="space-y-4 lg:col-span-2">
              {showHostSettings && isHost ? (
                <HostSettings
                  startingCardCount={startingCardCount}
                  onStartingCardCountChange={setStartingCardCount}
                  specialRules={specialRules}
                  onSpecialRulesChange={setSpecialRules}
                  maxPlayers={maxPlayers}
                  onMaxPlayersChange={setMaxPlayers}
                  timeLimit={timeLimit}
                  onTimeLimitChange={setTimeLimit}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Game Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Starting Cards:</span>
                      <Badge variant="outline" className="font-bold">
                        {startingCardCount} cards
                      </Badge>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="mb-2 font-medium">Special Rules:</h4>
                      <GameRules rules={specialRules} />
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Waiting Status or Start Game - Below Settings
              {!isGameStarting && (
                <Card
                  className={
                    allPlayersReady && isHost
                      ? "bg-green-0 border-green-800"
                      : "bg-blue-80 bg-sky-600"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      {allPlayersReady && isHost ? (
                        <div className="space-y-3">
                          <div className="font-medium text-green-700">
                            All players are ready! You can start the game.
                          </div>
                          <Button
                            onClick={handleStartGame}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Game
                          </Button>
                        </div>
                      ) : (
                        <div className="text-accent-foreground">
                          <div className="mb-1 font-medium">
                            Waiting for all players to be ready...
                          </div>
                          <div className="text-sm">
                            {players.filter((p) => p.isReady).length} of{" "}
                            {players.length} players ready
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )} */}
              {/* </div> */}

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">
                    {allPlayersReady ? (
                      // isCountingDown ? (
                      //   <span className="text-green-400">
                      //     Starting in {timeLeft}...
                      //   </span>
                      // ) : (
                      <span className="text-green-400">All players ready!</span>
                    ) : (
                      // )
                      <span className="text-blue-400">
                        Waiting for all players to be ready...
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    <span>
                      {readyPlayers.length} of {players.length} players ready
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress
                    value={(readyPlayers.length / players.length) * 100}
                    className="h-3 bg-gray-800"
                  />

                  {allPlayersReady && (
                    <div className="text-center">
                      <Button
                        onClick={handleStartGame}
                        className="bg-green-600 px-8 py-2 text-white hover:bg-green-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Game Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Players Section - Right Side (1/3 of space) */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Players ({players.length}/8)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full overflow-hidden rounded-xl border p-2">
                  <div className="space-y-3">
                    {players.map((player) => (
                      <React.Fragment key={player.id}>
                        <PlayerCard key={player.id} player={player} />
                      </React.Fragment>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleLeaveGame}
            className="flex items-center gap-2"
          >
            <UserMinus className="h-4 w-4" />
            Leave Game
          </Button>
          <Button
            onClick={handleJoinGame}
            className="flex items-center gap-2"
            disabled={isGameStarting}
          >
            <UserPlus className="h-4 w-4" />
            {isGameStarting ? "Game Starting..." : "Ready Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
