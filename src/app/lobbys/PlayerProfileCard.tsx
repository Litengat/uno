import React from "react";
import { User } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface PlayerProfileCardProps {
  user: User;
  compact?: boolean;
}

const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  user,
  compact = false,
}) => {
  if (compact) {
    // Compact version for hover preview
    return (
      <div className="flex gap-3 p-1">
        <Avatar className="h-12 w-12 border-2 border-primary/30">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base">{user.name}</h4>
            {user.level && (
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                Level {user.level}
              </span>
            )}
          </div>

          {user.stats && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Wins</p>
                <p className="font-semibold">{user.stats.wins}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rank</p>
                <p className="font-semibold">{user.stats.rank || "Unranked"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Games</p>
                <p className="font-semibold">{user.stats.gamesPlayed}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full profile card
  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {user.level && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    Level {user.level}
                  </Badge>
                )}
                {user.status && (
                  <Badge
                    variant="outline"
                    className={`bg-${
                      user.status === "online"
                        ? "green"
                        : user.status === "in-game"
                        ? "yellow"
                        : "gray"
                    }-500/10 
                               text-${
                                 user.status === "online"
                                   ? "green"
                                   : user.status === "in-game"
                                   ? "yellow"
                                   : "gray"
                               }-500
                               border-${
                                 user.status === "online"
                                   ? "green"
                                   : user.status === "in-game"
                                   ? "yellow"
                                   : "gray"
                               }-500/20`}
                  >
                    {user.status === "in-game" ? "In Game" : user.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.stats && (
          <>
            <h3 className="font-semibold mb-2 mt-3">UNO Stats</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Win Rate
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {((user.stats.wins / user.stats.gamesPlayed) * 100).toFixed(
                      1
                    )}
                    %
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Games Played
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.stats.gamesPlayed}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Wins / Losses
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.stats.wins} / {user.stats.losses}
                  </TableCell>
                </TableRow>
                {user.stats.winStreak !== undefined && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Current Streak
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.stats.winStreak} wins
                    </TableCell>
                  </TableRow>
                )}
                {user.stats.cardsPlayed !== undefined && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Cards Played
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.stats.cardsPlayed}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        )}

        {user.badges && user.badges.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, index) => (
                <Badge key={index} className="bg-secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {user.joinedDate && (
          <div className="mt-4 text-sm text-muted-foreground">
            Member since {user.joinedDate.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerProfileCard;
