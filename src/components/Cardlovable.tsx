import React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Ban } from "lucide-react";

export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw-two"
  | "wild"
  | "wild-draw-four";

export interface CardPreviewProps {
  color: "red" | "blue" | "green" | "yellow" | "black";
  type: CardType;
  number?: number;
  customText?: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  color,
  type,
  number,
  customText,
}) => {
  const isSpecialCard = [
    "skip",
    "reverse",
    "draw-two",
    "wild",
    "wild-draw-four",
  ].includes(type);
  const isBlackCard = ["wild", "wild-draw-four"].includes(type);
  const bgColor = isBlackCard ? "bg-uno-black" : `bg-uno-${color}`;

  const renderCornerSymbol = () => {
    if (type === "reverse") {
      return (
        <div className="w-10 h-10 absolute top-2 left-2">
          <div className="relative w-full h-full">
            <div className="absolute w-10 h-10">
              <RefreshCw
                className="w-full h-full text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === "skip") {
      return (
        <div className="w-10 h-10 absolute top-2 left-2">
          <div className="relative w-full h-full">
            <div className="absolute w-10 h-10">
              <Ban
                className="w-full h-full text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === "number") {
      return (
        <div className="absolute top-2 left-3 text-white text-4xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
          {number}
        </div>
      );
    }

    return null;
  };

  const renderBottomCornerSymbol = () => {
    if (type === "reverse") {
      return (
        <div className="w-10 h-10 absolute bottom-2 right-2 rotate-180">
          <div className="relative w-full h-full">
            <div className="absolute w-10 h-10">
              <RefreshCw
                className="w-full h-full text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === "skip") {
      return (
        <div className="w-10 h-10 absolute bottom-2 right-2 rotate-180">
          <div className="relative w-full h-full">
            <div className="absolute w-10 h-10">
              <Ban
                className="w-full h-full text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                strokeWidth={3}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === "number") {
      return (
        <div className="absolute bottom-2 right-3 text-white text-4xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] rotate-180">
          {number}
        </div>
      );
    }

    return null;
  };

  const renderCardContent = () => {
    switch (type) {
      case "number":
        return (
          <div className="text-center">
            <span className="text-8xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">
              {number}
            </span>
          </div>
        );
      case "skip":
        return (
          <div className="w-full h-full flex items-center justify-center">
            <Ban
              className="w-32 h-32 text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)]"
              strokeWidth={4}
            />
          </div>
        );
      case "reverse":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <RefreshCw
              className="w-32 h-32 text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)]"
              strokeWidth={4}
            />
          </div>
        );
      case "draw-two":
        return (
          <div className="text-center space-y-2">
            <span className="text-8xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">
              +2
            </span>
          </div>
        );
      case "wild":
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-36 h-36 rounded-full overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              <div className="h-1/2 flex">
                <div className="w-1/2 bg-uno-red"></div>
                <div className="w-1/2 bg-uno-blue"></div>
              </div>
              <div className="h-1/2 flex">
                <div className="w-1/2 bg-uno-yellow"></div>
                <div className="w-1/2 bg-uno-green"></div>
              </div>
            </div>
          </div>
        );
      case "wild-draw-four":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              <div className="h-1/2 flex">
                <div className="w-1/2 bg-uno-red"></div>
                <div className="w-1/2 bg-uno-blue"></div>
              </div>
              <div className="h-1/2 flex">
                <div className="w-1/2 bg-uno-yellow"></div>
                <div className="w-1/2 bg-uno-green"></div>
              </div>
            </div>
            <span className="text-5xl font-bold text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)]">
              +4
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center p-6">
      <div
        className={cn(
          "w-64 h-96 rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105",
          bgColor
        )}
      >
        {/* White oval border */}
        <div className="absolute inset-6 border-[12px] border-white rounded-full"></div>

        {/* Corner symbols */}
        {renderCornerSymbol()}
        {renderBottomCornerSymbol()}

        {/* Center content */}
        <div className="w-full h-full flex items-center justify-center z-10">
          {renderCardContent()}
        </div>

        {/* Custom text bottom overlay */}
        {customText && (
          <div className="absolute bottom-3 left-0 right-0 mx-auto w-40 bg-white text-black p-2 text-center font-semibold text-sm rounded-md z-20">
            {customText}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPreview;
