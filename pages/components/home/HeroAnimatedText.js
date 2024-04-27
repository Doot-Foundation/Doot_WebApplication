import { TypeAnimation } from "react-type-animation";

export default function HeroAnimatedText() {
  return (
    <>
      <TypeAnimation
        sequence={[
          "Supercharged",
          1200,
          "Transparent",
          1200,
          "Trustless",
          1200,
          "Provable",
          1200,
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
