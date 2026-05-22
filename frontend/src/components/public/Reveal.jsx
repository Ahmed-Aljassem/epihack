/*
Tiny wrapper that adds an entrance animation when its content scrolls into view.
Uses the `useReveal` hook + CSS-only transitions — no animation library.

Usage:
  <Reveal as="section" delay={80}>...</Reveal>
*/

import { createElement } from "react";
import { useReveal } from "../../hooks/useReveal";

export default function Reveal({
  as = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}) {
  const [ref, inView] = useReveal();

  return createElement(
    as,
    {
      ref,
      className: `reveal-up ${inView ? "is-revealed" : ""} ${className}`.trim(),
      style: { ...style, transitionDelay: `${delay}ms` },
      ...rest,
    },
    children,
  );
}
