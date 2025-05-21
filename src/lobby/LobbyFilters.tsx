import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LobbyFiltersProps {
  filters: {
    search: string;
    status: string;
    gameMode: string;
    difficulty: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

const LobbyFilters: React.FC<LobbyFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 mb-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Lobbies</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gameMode">Game Mode</Label>
          <Select
            value={filters.gameMode}
            onValueChange={(value) => onFilterChange("gameMode", value)}
          >
            <SelectTrigger id="gameMode">
              <SelectValue placeholder="All Game Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Game Modes</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="ranked">Ranked</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={filters.difficulty}
            onValueChange={(value) => onFilterChange("difficulty", value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default LobbyFilters;
