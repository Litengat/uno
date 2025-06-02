import React from "react";
import { Separator } from "@/components/ui/separator";
import { Trophy, Clock, Zap, TrendingUp } from "lucide-react";

interface GameStatsProps {
  stats: {
    totalGames: number;
    averageGameTime: string;
    fastestWin: string;
    currentStreak: number;
  };
}

export const GameStats: React.FC<GameStatsProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Trophy className="h-4 w-4" />
          Total Games
        </div>
        <span className="font-bold">{stats.totalGames}</span>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          Avg. Game Time
        </div>
        <span className="font-bold">{stats.averageGameTime}</span>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Zap className="h-4 w-4" />
          Fastest Win
        </div>
        <span className="font-bold text-green-600">{stats.fastestWin}</span>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4" />
          Win Streak
        </div>
        <span className="font-bold text-purple-600">{stats.currentStreak}</span>
      </div>
    </div>
  );
};
