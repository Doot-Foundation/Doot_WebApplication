import { TypeAnimation } from "react-type-animation";

export default function HeroAnimatedText() {
  return (
    <>
      <TypeAnimation
        sequence={[
          "Supercharged",
          1500,
          "Transparent",
          1500,
          "Trustless",
          1500,
          "Provable",
          1500,
        ]}
        wrapper="span"
        cursor={false}
        repeat={Infinity}
        style={{
          fontSize: "88px",
          fontWeight: "700",
          display: "inline-block",
          fontFamily: "'Montserrat Variable'",
          background:
            "linear-gradient(91.65deg, #6B1BFF -5.86%, #D2B9FF 99.55%)",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      />
    </>
  );
}
