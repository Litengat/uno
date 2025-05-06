import React from "react";
import { cn } from "@/lib/utils";

interface CardBackProps {
  small?: boolean;
  extraSmall?: boolean; // Added extraSmall prop
}

export const CardBack: React.FC<CardBackProps> = ({ small, extraSmall }) => {
  // Determine the size factor based on props
  const size = extraSmall ? "extraSmall" : small ? "small" : "large";

  return (
    <div className="flex">
      <div
        className={cn(
          "aspect-[2/3] shadow-xl flex flex-col relative overflow-hidden transform transition-transform bg-black hover:scale-105", // Base styles + hover effect
          size === "large" && "w-50 rounded-2xl", // Large version
          size === "small" && "w-35 rounded-xl", // Small version
          size === "extraSmall" && "w-24 rounded-lg" // Extra Small version
        )}
      >
        {/* Red oval border */}
        <div
          className={cn(
            "absolute border-rose-700 rounded-full",
            size === "large" && "inset-6 border-[12px]", // Large
            size === "small" && "inset-4 border-[8px]", // Small
            size === "extraSmall" && "inset-3 border-[6px]" // Extra Small
          )}
        ></div>

        {/* Center content */}
        <div className="w-full h-full flex items-center justify-center z-10">
          <div className="text-center transform rotate-45">
            <span
              className={cn(
                "font-bold text-rose-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]",
                size === "large" && "text-6xl", // Large
                size === "small" && "text-4xl", // Small
                size === "extraSmall" && "text-2xl" // Extra Small
              )}
            >
              UNO
            </span>
          </div>
        </div>

        {/* Corner circles */}
        <div
          className={cn(
            "absolute rounded-full bg-rose-700 flex items-center justify-center",
            size === "large" && "top-8 left-8 w-12 h-12", // Large
            size === "small" && "top-6 left-6 w-8 h-8", // Small
            size === "extraSmall" && "top-4 left-4 w-6 h-6" // Extra Small
          )}
        >
          <div
            className={cn(
              "rounded-full bg-white",
              size === "large" && "w-8 h-8", // Large
              size === "small" && "w-6 h-6", // Small
              size === "extraSmall" && "w-4 h-4" // Extra Small
            )}
          ></div>
        </div>

        <div
          className={cn(
            "absolute rounded-full bg-rose-700 flex items-center justify-center",
            size === "large" && "bottom-8 right-8 w-12 h-12", // Large
            size === "small" && "bottom-6 right-6 w-8 h-8", // Small
            size === "extraSmall" && "bottom-4 right-4 w-6 h-6" // Extra Small
          )}
        >
          <div
            className={cn(
              "rounded-full bg-white",
              size === "large" && "w-8 h-8", // Large
              size === "small" && "w-6 h-6", // Small
              size === "extraSmall" && "w-4 h-4" // Extra Small
            )}
          ></div>
        </div>
      </div>
    </div>
  );
};
