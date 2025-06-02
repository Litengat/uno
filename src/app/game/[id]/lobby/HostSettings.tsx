import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Clock, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HostSettingsProps {
  startingCardCount: number;
  onStartingCardCountChange: (count: number) => void;
  specialRules: string[];
  onSpecialRulesChange: (rules: string[]) => void;
  maxPlayers: number;
  onMaxPlayersChange: (max: number) => void;
  timeLimit: number;
  onTimeLimitChange: (time: number) => void;
}

export const HostSettings: React.FC<HostSettingsProps> = ({
  startingCardCount,
  onStartingCardCountChange,
  specialRules,
  onSpecialRulesChange,
  maxPlayers,
  onMaxPlayersChange,
  timeLimit,
  onTimeLimitChange,
}) => {
  const availableRules = [
    "Card Stacking Enabled",
    "Reverse Direction on Skip",
    "Draw 4 Challenge Rule",
    "Seven-0 Hand Swap",
    "Jump-In Rule",
    "Progressive UNO",
  ];

  const handleRuleToggle = (rule: string, checked: boolean) => {
    if (checked) {
      onSpecialRulesChange([...specialRules, rule]);
    } else {
      onSpecialRulesChange(specialRules.filter((r) => r !== rule));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Host Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScrollArea className="overflow-hidden">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="starting-cards"
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Starting Cards
                </Label>
                <Input
                  id="starting-cards"
                  type="number"
                  min="3"
                  max="15"
                  value={startingCardCount}
                  onChange={(e) =>
                    onStartingCardCountChange(Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="max-players"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Max Players
                </Label>
                <Input
                  id="max-players"
                  type="number"
                  min="2"
                  max="8"
                  value={maxPlayers}
                  onChange={(e) => onMaxPlayersChange(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-limit" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Turn Time Limit (seconds)
              </Label>
              <Input
                id="time-limit"
                type="number"
                min="10"
                max="120"
                value={timeLimit}
                onChange={(e) => onTimeLimitChange(Number(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          {/* Special Rules */}
          <div className="space-y-3">
            <Label className="font-medium">Special Rules</Label>
            <div className="space-y-3">
              {availableRules.map((rule) => (
                <div key={rule} className="flex items-center space-x-2">
                  <Checkbox
                    id={rule}
                    checked={specialRules.includes(rule)}
                    onCheckedChange={(checked) =>
                      handleRuleToggle(rule, checked as boolean)
                    }
                  />
                  <Label htmlFor={rule} className="text-sm font-normal">
                    {rule}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Current Settings Summary */}
          <Separator />
          <div className="space-y-2">
            <Label className="font-medium">Current Settings</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{startingCardCount} cards</Badge>
              <Badge variant="outline">Max {maxPlayers} players</Badge>
              <Badge variant="outline">{timeLimit}s turns</Badge>
              <Badge variant="outline">
                {specialRules.length} special rules
              </Badge>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
