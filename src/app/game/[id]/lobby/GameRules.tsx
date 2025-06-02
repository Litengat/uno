import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, RotateCcw, Plus } from "lucide-react";

interface GameRulesProps {
  rules: string[];
}

export const GameRules: React.FC<GameRulesProps> = ({ rules }) => {
  const getRuleIcon = (rule: string) => {
    if (rule.toLowerCase().includes("stacking"))
      return <Plus className="h-3 w-3" />;
    if (rule.toLowerCase().includes("reverse"))
      return <RotateCcw className="h-3 w-3" />;
    if (rule.toLowerCase().includes("skip"))
      return <ArrowRight className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  if (rules.length === 0) {
    return (
      <Badge variant="outline" className="text-gray-500">
        Standard Rules
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((rule, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="text-blue-500">{getRuleIcon(rule)}</div>
          <span className="text-sm">{rule}</span>
        </div>
      ))}
    </div>
  );
};
