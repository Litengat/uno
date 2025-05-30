"use client";
import dynamic from "next/dynamic";

const Game = dynamic(
  () => import("./Game"),
  { ssr: false }, // This is the key!
);

const MyPage = () => {
  return <Game />;
};

export default MyPage;
