/*
Reveal-on-scroll hook. Returns a ref to attach to a node and a boolean flag
that flips to true the first time the node intersects the viewport.

Pair with the `.reveal` / `.reveal-up` / `.reveal-in` CSS classes in global.css:
elements start invisible + translated, then transition to their resting state
when `inView` becomes true. Honors `prefers-reduced-motion` automatically.
*/

import { useEffect, useRef, useState } from "react";

export function useReveal({ threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}
