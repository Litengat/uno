"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CardColor } from "@/types";

type ColorOption = Exclude<CardColor, "black">;

interface WildCardColorDialogProps {
  onColorSelect?: (color: ColorOption) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const WildCardColorDialog: React.FC<WildCardColorDialogProps> = ({
  onColorSelect,
  open,
  setOpen,
}) => {
  const handleColorSelect = (color: ColorOption) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
    toast(`Selected color: ${color.toUpperCase()}`, {
      icon: "🎮",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Select a color
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-4">
          <div className="mb-3 text-center">
            <p className="text-gray-600">Choose a color for your wild card</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleColorSelect("red")}
              className={cn(
                "h-24 transform rounded-lg transition-transform hover:scale-105",
                "bg-rose-700",
              )}
              aria-label="Red"
            />
            <button
              onClick={() => handleColorSelect("blue")}
              className={cn(
                "h-24 transform rounded-lg transition-transform hover:scale-105",
                "bg-indigo-700",
              )}
              aria-label="Blue"
            />
            <button
              onClick={() => handleColorSelect("green")}
              className={cn(
                "h-24 transform rounded-lg transition-transform hover:scale-105",
                "bg-emerald-700",
              )}
              aria-label="Green"
            />
            <button
              onClick={() => handleColorSelect("yellow")}
              className={cn(
                "h-24 transform rounded-lg transition-transform hover:scale-105",
                "bg-yellow-500",
              )}
              aria-label="Yellow"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WildCardColorDialog;
