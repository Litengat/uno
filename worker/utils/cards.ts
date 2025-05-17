export function getRandomCard() {
  const colors = ["red", "blue", "green", "yellow"] as const;
  const types = [
    "number",
    "skip",
    "reverse",
    "draw-two",
    "wild",
    "wild-draw-four",
  ] as const;

  const color = colors[Math.floor(Math.random() * colors.length)];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    id: Math.random().toString(36).substring(7),
    color: type === "wild" || type === "wild-draw-four" ? "black" : color,
    type,
    value: type === "number" ? Math.floor(Math.random() * 10) : undefined,
  };
}
