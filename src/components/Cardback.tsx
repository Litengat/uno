import React from "react";
import { cn } from "@/lib/utils";

interface CardBackProps {
  customText?: string;
}

export const CardBack: React.FC<CardBackProps> = ({ customText }) => {
  return (
    <div className="flex p-6">
      <div
        className={cn(
          "w-50 aspect-[2/3] rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105 bg-black"
        )}
      >
        {/* Red oval border */}
        <div className="absolute inset-6 border-[12px] border-rose-700 rounded-full"></div>

        {/* Center content */}
        <div className="w-full h-full flex items-center justify-center z-10">
          <div className="text-center transform rotate-45">
            <span className="text-6xl font-bold text-rose-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]">
              UNO
            </span>
          </div>
        </div>

        {/* Corner circles */}
        <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-rose-700 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white"></div>
        </div>

        <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-rose-700 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white"></div>
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
