import React, { useState, useEffect } from "react";
import LobbyHeader from "./LobbyHeader";
import LobbyFilters from "./LobbyFilters";
import LobbyCard from "./LobbyCard";
import CreateLobbyButton from "./CreateLobbyButton";
import { toast } from "sonner";
import { mockLobbies, currentUser } from "./mockData";
import { Lobby } from "./types";

const Index: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>(mockLobbies);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>(mockLobbies);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    gameMode: "all",
    difficulty: "all",
  });

  // Apply filters when they change
  useEffect(() => {
    let result = [...mockLobbies];

    // Apply search filter
    if (filters.search) {
      result = result.filter((lobby) =>
        lobby.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter((lobby) => lobby.status === filters.status);
    }

    // Apply game mode filter
    if (filters.gameMode !== "all") {
      result = result.filter((lobby) => lobby.gameMode === filters.gameMode);
    }

    // Apply difficulty filter
    if (filters.difficulty !== "all") {
      result = result.filter(
        (lobby) => lobby.difficulty === filters.difficulty
      );
    }

    setFilteredLobbies(result);
  }, [filters]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJoinLobby = (lobbyId: string) => {
    const lobby = lobbies.find((l) => l.id === lobbyId);
    if (lobby) {
      toast({
        title: "Joining Lobby",
        description: `You're joining "${lobby.name}"`,
      });
    }
  };

  const handleCreateLobby = () => {
    toast({
      title: "Create New Lobby",
      description: "Opening lobby creation form...",
    });
  };

  // Count total players online across all lobbies
  const totalPlayersOnline = mockLobbies.reduce(
    (sum, lobby) => sum + lobby.players.current,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <LobbyHeader user={currentUser} totalPlayers={totalPlayersOnline} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <LobbyFilters filters={filters} onFilterChange={handleFilterChange} />

          {filteredLobbies.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLobbies.map((lobby) => (
                <LobbyCard
                  key={lobby.id}
                  lobby={lobby}
                  onJoin={handleJoinLobby}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-card/50">
              <h3 className="text-xl font-medium mb-2">No lobbies found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create a new lobby.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h3 className="font-bold mb-4">Game Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Lobbies:</span>
                <span className="font-medium">
                  {mockLobbies.filter((l) => l.status !== "in-progress").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Players Online:</span>
                <span className="font-medium">{totalPlayersOnline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open Slots:</span>
                <span className="font-medium">
                  {mockLobbies
                    .filter((l) => l.status === "open")
                    .reduce(
                      (sum, lobby) =>
                        sum + (lobby.players.max - lobby.players.current),
                      0
                    )}
                </span>
              </div>
            </div>
          </div>

          <CreateLobbyButton onClick={handleCreateLobby} />

          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h3 className="font-bold mb-4">Quick Join</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join the first available lobby matching your preferences.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Casual Game:</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary cursor-pointer hover:bg-primary/30">
                  Quick Join
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ranked Game:</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary cursor-pointer hover:bg-primary/30">
                  Quick Join
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
