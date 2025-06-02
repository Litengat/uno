import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Check, Clock } from "lucide-react";
import { type Player } from "./UnoGameDialog";

interface PlayerCardProps {
  player: Player;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <Card className={`transition-all hover:shadow-md`}>
      <CardContent className="">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback className="text-accent-foreground bg-gradient-to-r from-blue-500 to-purple-500">
                {player.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {player.isHost && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500">
                <Crown className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{player.name}</span>
              {player.isHost && (
                <Badge variant="secondary" className="text-xs">
                  Host
                </Badge>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <div
                className={`flex items-center gap-1 text-xs ${
                  player.isReady ? "text-green-600" : "text-orange-600"
                }`}
              >
                {player.isReady ? (
                  <>
                    <Check className="h-3 w-3" />
                    Ready
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Waiting
                  </>
                )}
              </div>

              <span className="text-xs text-gray-500">
                {player.cardCount} cards
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
