import React, { useState, useEffect, useRef } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  /** Ritardo in ms prima della comparsa (per effetti a cascata). */
  delay?: number;
  className?: string;
  /** Disattiva lo scostamento verticale (solo fade). */
  fadeOnly?: boolean;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  className = "",
  fadeOnly = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      // threshold 0 (non 0.12): un elemento PIÙ ALTO della viewport non riesce mai
      // a mostrarne il 12% in una volta, e con 0.12 resterebbe invisibile per sempre
      // (è successo alla Guida rapida quando è cresciuta oltre ~8× lo schermo). Con 0
      // si rivela appena entra in vista; il rootMargin sotto preserva il timing.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : `opacity-0 ${fadeOnly ? "" : "translate-y-8"}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
