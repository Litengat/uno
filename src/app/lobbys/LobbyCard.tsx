import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lobby } from "./types";
import PlayerProfileCard from "./PlayerProfileCard";
import { useNavigate } from "react-router";

interface LobbyCardProps {
  lobby: Lobby;
  onJoin: (id: string) => void;
}

const LobbyCard: React.FC<LobbyCardProps> = ({ lobby, onJoin }) => {
  const navigate = useNavigate();

  const getStatusClass = () => {
    switch (lobby.status) {
      case "open":
        return "status-open";
      case "full":
        return "status-full";
      case "in-progress":
        return "status-in-progress";
      default:
        return "status-open";
    }
  };

  const getStatusText = () => {
    switch (lobby.status) {
      case "open":
        return "Open";
      case "full":
        return "Full";
      case "in-progress":
        return "In Progress";
      default:
        return "Open";
    }
  };

  const getModeClass = () => {
    switch (lobby.gameMode) {
      case "casual":
        return "game-mode-casual";
      case "ranked":
        return "game-mode-ranked";
      case "tournament":
        return "game-mode-tournament";
      default:
        return "game-mode-casual";
    }
  };

  const getDifficultyClass = () => {
    switch (lobby.difficulty) {
      case "easy":
        return "difficulty-easy";
      case "medium":
        return "difficulty-medium";
      case "hard":
        return "difficulty-hard";
      default:
        return "difficulty-easy";
    }
  };

  const viewProfile = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="lobby-card">
      <div className="lobby-status">
        <span className={`status-indicator ${getStatusClass()}`}></span>
        <span>{getStatusText()}</span>
      </div>

      <h3 className="font-bold text-lg mb-1 pr-16">{lobby.name}</h3>

      <div className="flex gap-2 mb-3">
        <span className={`lobby-tag ${getModeClass()}`}>{lobby.gameMode}</span>
        <span className={`lobby-tag ${getDifficultyClass()}`}>
          {lobby.difficulty}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Host</p>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <HoverCard>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HoverCardTrigger asChild>
                      <button
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        onClick={(e) => viewProfile(e, lobby.host.id)}
                      >
                        <Avatar className="h-6 w-6 border border-border">
                          <AvatarImage
                            src={lobby.host.avatar}
                            alt={lobby.host.name}
                          />
                          <AvatarFallback>
                            {lobby.host.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {lobby.host.name}
                        </span>
                      </button>
                    </HoverCardTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span>Click to view profile</span>
                  </TooltipContent>
                </Tooltip>
                <HoverCardContent className="w-80 p-0 bg-card border-border">
                  <PlayerProfileCard user={lobby.host} compact />
                </HoverCardContent>
              </HoverCard>
            </TooltipProvider>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Players</p>
          <p className="text-sm font-medium">
            {lobby.players.current}/{lobby.players.max}
          </p>
        </div>
      </div>

      {lobby.status === "open" ? (
        <Button
          onClick={() => onJoin(lobby.id)}
          className="w-full"
          variant="default"
        >
          Join Lobby
        </Button>
      ) : (
        <Button disabled className="w-full" variant="secondary">
          {lobby.status === "full" ? "Lobby Full" : "Game In Progress"}
        </Button>
      )}
    </div>
  );
};

export default LobbyCard;
