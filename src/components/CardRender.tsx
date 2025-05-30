import React from "react";
import { cn } from "@/lib/utils";

export function CardRender({
  color,
  CornerComp,
  BodyComp,
}: {
  color: string;
  CornerComp: React.ComponentType;
  BodyComp: React.ComponentType;
}) {
  return (
    <div
      className={cn(
        "w-50 aspect-[2/3] rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105",
        color
      )}
    >
      {/* White oval border */}
      <div className="absolute inset-6 border-[12px] border-white rounded-full"></div>

      {/* Corner symbols */}
      {renderCornerSymbol({ Component: CornerComp })}
      {renderBottomCornerSymbol({ Component: CornerComp })}

      {/* Center content */}
      <div className="w-full h-full flex items-center justify-center z-10">
        <div className=" text-white text-7xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
          <BodyComp />
        </div>
      </div>
    </div>
  );
}

function renderCornerSymbol({ Component }: { Component: React.ComponentType }) {
  return (
    <div className="w-10 h-10 absolute top-2 left-2">
      <div className="relative w-full h-full">
        <div className="absolute w-10 h-10">
          <div className="text-white text-3xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] text-center">
            <Component />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBottomCornerSymbol({
  Component,
}: {
  Component: React.ComponentType;
}) {
  return (
    <div className="w-10 h-10 absolute bottom-2 right-2 rotate-180">
      <div className="relative w-full h-full">
        <div className="absolute w-10 h-10">
          <div className="text-white text-3xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] text-center">
            <Component />
          </div>
        </div>
      </div>
    </div>
  );
}
