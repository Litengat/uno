"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UnoGameDialog, type Player } from "./UnoGameDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Users, Zap } from "lucide-react";

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);
  const [countdown, setCountdown] = useState<number | undefined>(undefined);

  // Sample game data
  const players: Player[] = [
    {
      id: "1",
      name: "Alex Rodriguez",
      avatar: "/placeholder.svg",
      isHost: true,
      isReady: true,
      cardCount: 7,
    },
    {
      id: "2",
      name: "Maria Santos",
      avatar: "/placeholder.svg",
      isHost: false,
      isReady: true,
      cardCount: 7,
    },
    {
      id: "3",
      name: "John Chen",
      avatar: "/placeholder.svg",
      isHost: false,
      isReady: false,
      cardCount: 7,
    },
    {
      id: "4",
      name: "Emma Wilson",
      avatar: "/placeholder.svg",
      isHost: false,
      isReady: true,
      cardCount: 7,
    },
  ];

  const gameStats = {
    totalGames: 127,
    averageGameTime: "8m 32s",
    fastestWin: "3m 45s",
    currentStreak: 5,
  };

  const specialRules = [
    "Card Stacking Enabled",
    "Reverse Direction on Skip",
    "Draw 4 Challenge Rule",
    "Seven-0 Hand Swap",
  ];

  const handleJoinGame = () => {
    setIsDialogOpen(true);
  };

  const handleStartGame = () => {
    setIsGameStarting(true);
    setCountdown(5);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== undefined && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Game would start here
      setIsDialogOpen(false);
      setIsGameStarting(false);
      setCountdown(undefined);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 p-4">
  //   <div className="w-full max-w-4xl">
  //     {/* Hero Section */}
  //     <div className="mb-8 text-center">
  //       <div className="mb-4 inline-flex items-center gap-3">
  //         <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
  //           <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-3xl font-bold text-transparent">
  //             U
  //           </span>
  //         </div>
  //         <h1 className="text-6xl font-bold text-white">UNO</h1>
  //       </div>
  //       <p className="mb-8 text-xl text-white/90">
  //         The classic card game that brings friends together!
  //       </p>
  //     </div>

  //     {/* Game Features */}
  //     <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
  //       <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
  //         <CardHeader className="text-center">
  //           <Gamepad2 className="mx-auto mb-2 h-12 w-12 text-white" />
  //           <CardTitle className="text-white">Easy to Play</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <p className="text-center text-white/80">
  //             Jump right in with intuitive controls and classic UNO rules
  //           </p>
  //         </CardContent>
  //       </Card>

  //       <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
  //         <CardHeader className="text-center">
  //           <Users className="mx-auto mb-2 h-12 w-12 text-white" />
  //           <CardTitle className="text-white">Multiplayer Fun</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <p className="text-center text-white/80">
  //             Play with up to 8 friends in real-time matches
  //           </p>
  //         </CardContent>
  //       </Card>

  //       <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
  //         <CardHeader className="text-center">
  //           <Zap className="mx-auto mb-2 h-12 w-12 text-white" />
  //           <CardTitle className="text-white">Special Rules</CardTitle>
  //         </CardHeader>
  //         <CardContent>
  //           <p className="text-center text-white/80">
  //             Customize your game with exciting rule variations
  //           </p>
  //         </CardContent>
  //       </Card>
  //     </div>

  //     {/* Action Buttons */}
  //     <div className="space-y-4 text-center">
  //       <Button
  //         onClick={handleJoinGame}
  //         size="lg"
  //         className="rounded-xl bg-white px-8 py-6 text-xl text-red-500 shadow-lg hover:bg-white/90"
  //       >
  //         Join Game
  //       </Button>

  //       <div className="space-x-4">
  //         <Button
  //           variant="outline"
  //           className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
  //         >
  //           Create Room
  //         </Button>
  //         <Button
  //           variant="outline"
  //           className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
  //         >
  //           Quick Match
  //         </Button>
  //       </div>
  //     </div>

  //     {/* Demo button to start countdown */}
  //     {isDialogOpen && !isGameStarting && (
  //       <div className="fixed right-4 bottom-4">
  //         <Button
  //           onClick={handleStartGame}
  //           className="bg-green-500 text-white hover:bg-green-600"
  //         >
  //           Start Game (Demo)
  //         </Button>
  //       </div>
  //     )}
  //   </div>
  return (
    <div>
      {/* UNO Game Dialog */}
      <UnoGameDialog
        isOpen={true}
        onClose={() => {
          setIsDialogOpen(false);
          setIsGameStarting(false);
          setCountdown(undefined);
        }}
        gameId="UNO-2024-001"
        players={players}
        startingCardCount={7}
        specialRules={specialRules}
        gameStats={gameStats}
        isGameStarting={isGameStarting}
        countdown={countdown}
      />
    </div>
  );
};

export default Index;
