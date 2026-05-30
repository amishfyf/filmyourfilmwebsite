import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

export default function LandingPage({ onComplete }) {
  const overlayRef = useRef(null);
  const logoRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Logo pulse in → hold → fade out
    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        onComplete?.();
      },
    });

    tl.fromTo(
      logoRef.current,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
    )
      .to(logoRef.current, {
        duration: 0.6, // hold
      })
      .to(logoRef.current, {
        scale: 1.08,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in",
      })
      .to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        },
        "-=0.2"
      );

    return () => tl.kill();
  }, [onComplete]);

  if (!visible) return null;

  return createPortal(
    <div className="landing-overlay" ref={overlayRef}>
      <div className="landing-content">
        <div className="landing-logo-wrap" ref={logoRef}>
          <img
            alt="Film Your Film"
            className="landing-logo"
            src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
          />
        </div>
      </div>

      <div className="landing-ambient landing-ambient-1" />
      <div className="landing-ambient landing-ambient-2" />
    </div>,
    document.body
  );
}
