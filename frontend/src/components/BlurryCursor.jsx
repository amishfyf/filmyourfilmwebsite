import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const colors = [
  "#df253145",
  "#df253165",
  "#df2531",
  "#fff",
  "#000",
];

export default function BlurryCursor() {
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });
  const delayedMouse = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);
  const circles = useRef([]);

  const size = isActive ? 120 : 24; // Size of cursor when active vs normal
  const delay = 0.08; // Delay for smooth trailing separation

  const lerp = (x, y, a) => x * (1 - a) + y * a;

  const manageMouseMove = (e) => {
    const target = e.target;
    if (!target) {
      setIsVisible(false);
      return;
    }

    const isInsideAllowedSection =
      (target.closest("#home") !== null || target.closest("#contact") !== null) &&
      target.closest(".selector-btn-v") === null &&
      target.closest(".hero-toggle-btn") === null;

    setIsVisible(isInsideAllowedSection);

    const { clientX, clientY } = e;
    mouse.current = {
      x: clientX,
      y: clientY,
    };
  };

  const moveCircles = (x, y) => {
    if (circles.current.length < 1) return;
    circles.current.forEach((circle) => {
      if (circle) {
        gsap.set(circle, { x, y, xPercent: -50, yPercent: -50 });
      }
    });
  };

  const animate = () => {
    const { x, y } = delayedMouse.current;
    delayedMouse.current = {
      x: lerp(x, mouse.current.x, 0.075),
      y: lerp(y, mouse.current.y, 0.075),
    };

    moveCircles(delayedMouse.current.x, delayedMouse.current.y);
    rafId.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animate();
    window.addEventListener("mousemove", manageMouseMove);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const hoverable = target.closest("a") ||
        target.closest("button") ||
        target.closest(".bento-card") ||
        target.closest(".hero-title") ||
        target.closest(".contact-heading") ||
        target.closest(".work-page-contact-title") ||
        target.closest(".selector-btn-v");

      if (hoverable) {
        setIsActive(true);
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      const hoverable = target.closest("a") ||
        target.closest("button") ||
        target.closest(".bento-card") ||
        target.closest(".hero-title") ||
        target.closest(".contact-heading") ||
        target.closest(".work-page-contact-title") ||
        target.closest(".selector-btn-v");

      if (hoverable) {
        setIsActive(false);
      }
    };

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mouseleave", handleMouseLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", manageMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mouseleave", handleMouseLeaveWindow);
      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      className="blurry-cursor-wrapper"
      style={{
        pointerEvents: "none",
        zIndex: 99999,
        position: "fixed",
        inset: 0,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <style>{`
        @media (pointer: coarse) {
          .blurry-cursor-wrapper {
            display: none !important;
          }
        }
      `}</style>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          ref={(ref) => (circles.current[i] = ref)}
          style={{
            backgroundColor: colors[i],
            width: size,
            height: size,
            filter: `blur(${isActive ? 30 : 2}px)`,
            transition: `transform ${(4 - i) * delay}s linear, height 0.3s ease-out, width 0.3s ease-out, filter 0.3s ease-out`,
            position: "fixed",
            top: 0,
            left: 0,
            borderRadius: "50%",
            mixBlendMode: "normal",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
