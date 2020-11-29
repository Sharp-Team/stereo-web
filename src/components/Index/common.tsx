import React from "react";
import { useInView } from "react-intersection-observer";
import { useSpring } from "react-spring";

export const IndexParagraph: React.FC = ({ children }) => (
  <p className="text-lg text-foreground-secondary mb-2">{children}</p>
);

export const IndexTitle: React.FC = ({ children }) => (
  <h2 className="font-bold text-4xl sm:text-5xl mb-6">{children}</h2>
);

export const useFadeInOnScroll = () => {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const props = useSpring(
    inView
      ? {
          opacity: 1,
          transform: "translateY(0px)",
        }
      : {
          opacity: 0,
          transform: "translateY(40px)",
        }
  );
  return [ref, props] as const;
};

export const IndexSection: React.FC = ({ children }) => {
  return <section className="px-6 py-24 overflow-x-hidden">{children}</section>;
};
