import React, { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerCard } from "./PlayerCard";
import { GameRules } from "./GameRules";
import { Users, Trophy, Zap, UserPlus, UserMinus } from "lucide-react";

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
  startingCardCount,
  specialRules,
  isGameStarting,
  countdown,
}) => {
  const handleJoinGame = () => {
    console.log("Joining game...");
  };

  const handleLeaveGame = () => {
    console.log("Leaving game...");
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-yellow-500">
            <span className="font-bold text-white">U</span>
          </div>
          UNO Game Lobby
          <Badge variant="secondary" className="ml-2">
            Room: {gameId}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
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

            {/* Waiting Status - Below Settings */}
            {!isGameStarting && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center text-blue-700">
                    <div className="mb-1 font-medium">
                      Waiting for all players to be ready...
                    </div>
                    <div className="text-sm">
                      {players.filter((p) => p.isReady).length} of{" "}
                      {players.length} players ready
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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

        {/* Action Buttons */}
        <div className="flex justify-between border-t pt-6">
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
        </div>
      </CardContent>
    </Card>
  );
};
