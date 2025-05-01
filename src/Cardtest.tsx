import { Link } from "react-router";
import Card from "./components/Card";
import { CardBack } from "./components/Cardback";

// import { unstable_ViewTransition as ViewTransition } from "react";

const colors = ["red", "blue", "green", "yellow", "black"] as const;
const specialCards = [
  "skip",
  "reverse",
  "draw-two",
  "wild",
  "wild-draw-four",
] as const;

export function CardTest() {
  return (
    <div>
      <Link to="/">Home</Link>
      <div className=" p-6">
        <Card color="red" type="number" number={1} />
      </div>

      {/* <ViewTransition name="test">
        <CardBack />
      </ViewTransition> */}

      {colors.map((color) => (
        <div className="flex ">
          {specialCards.map((type) => (
            <div className=" p-6">
              <Card key={type} color={color} type={type} />
            </div>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <div className=" p-6">
              <Card key={i} color={color} type="number" number={i} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
