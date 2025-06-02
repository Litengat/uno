import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "./types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useNavigate } from "react-router";
import PlayerProfileCard from "./PlayerProfileCard";

interface ProfileBadgeProps {
  user: User;
  showHoverCard?: boolean;
}

const ProfileBadge: React.FC<ProfileBadgeProps> = ({
  user,
  showHoverCard = true,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${user.id}`);
  };

  const statusIndicator = user.status ? user.status : "online";

  const badge = (
    <div
      className="flex items-center gap-3 bg-secondary rounded-full px-3 py-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={handleClick}
    >
      <Avatar className="h-8 w-8 border border-primary/30">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              statusIndicator === "online"
                ? "bg-green-500"
                : statusIndicator === "in-game"
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {statusIndicator === "in-game"
              ? "In Game"
              : statusIndicator.charAt(0).toUpperCase() +
                statusIndicator.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );

  if (!showHoverCard) {
    return badge;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 bg-card border-border">
        <PlayerProfileCard user={user} compact />
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileBadge;
