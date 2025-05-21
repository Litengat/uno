import React from "react";
import ProfileBadge from "./ProfileBadge";
import { User } from "./types";

interface LobbyHeaderProps {
  user: User;
  totalPlayers: number;
}

const LobbyHeader: React.FC<LobbyHeaderProps> = ({ user, totalPlayers }) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Game Lobby
        </h1>
        <p className="text-muted-foreground">
          {totalPlayers} players online - Choose a room to join
        </p>
      </div>
      <ProfileBadge user={user} />
    </div>
  );
};

export default LobbyHeader;
