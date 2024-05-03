import { Box, ScaleFade } from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";

export default function ScaleFadeBox({ children }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.4,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <>
      <ScaleFade in={isVisible}>
        <Box ref={ref}>{children}</Box>
      </ScaleFade>
    </>
  );
}
