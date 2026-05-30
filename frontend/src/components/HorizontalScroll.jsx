import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { fetchProjects } from "../services/projectsApi";
import {
  buildPanels,
  normalizeProjects,
  ProjectPreviewMedia,
} from "./projectCatalog";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalScroll({ onSelectProject, loading }) {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProjects = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");
        const data = await fetchProjects(controller.signal);
        setProjects(Array.isArray(data) ? normalizeProjects(data) : []);
        setStatus("success");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setProjects([]);
        setErrorMessage(error.message || "Unable to load projects.");
        setStatus("error");
      }
    };

    loadProjects();

    return () => controller.abort();
  }, []);

  const aiProjects = projects.filter((project) => project.raw?.isAi);
  const regularProjects = projects.filter((project) => !project.raw?.isAi);

  const aiPanels = buildPanels(aiProjects);
  const regularPanels = buildPanels(regularProjects);

  const hasTrackContent =
    status === "success" && (aiPanels.length > 0 || regularPanels.length > 0);

  // Hero entrance animation
  useGSAP(
    () => {
      if (loading) return;

      gsap.from(".hero-section > *", {
        x: -50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.2,
      });
    },
    { scope: wrapperRef, dependencies: [loading] }
  );

  // Horizontal scroll with hero centered — AI left, cinema right
  // Runs even while splash is visible so the track silently positions to hero center
  useGSAP(
    () => {
      if (!wrapperRef.current || !trackRef.current) {
        return undefined;
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 721px)", () => {
        const track = trackRef.current;

        // Wait for layout to fully compute before measuring
        // Double-RAF ensures the browser has painted at least once
        const setupId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!track || !wrapperRef.current) return;

            const trackWidth = track.scrollWidth;

            if (trackWidth <= window.innerWidth) {
              gsap.set(track, { x: 0 });
              return;
            }

            // Find the hero panel and measure its actual position
            // This is dynamic — based on however many AI panels rendered to its left
            const heroPanel = track.querySelector(".hero-section");
            if (!heroPanel) return;

            // heroLeft = sum of all AI panel widths (everything before the hero)
            // This is measured from DOM, so it accounts for any number of AI videos,
            // their container widths, padding, and gap
            const heroLeft = heroPanel.offsetLeft;
            const heroWidth = heroPanel.offsetWidth;

            // Total scrollable range
            const totalRange = trackWidth - window.innerWidth;

            // Offset to place hero at left edge of viewport = -heroLeft
            // Hero is 100vw wide, so left-aligning it shows it fully
            const heroOffset = Math.max(
              -totalRange,
              Math.min(0, -heroLeft)
            );

            // What fraction of the total scroll range puts us at the hero
            const heroProgress = Math.abs(heroOffset) / totalRange;

            // Create the scroll animation across the full range
            const tween = gsap.fromTo(
              track,
              { x: 0 },
              { x: -totalRange, ease: "none" }
            );

            const trigger = ScrollTrigger.create({
              trigger: wrapperRef.current,
              start: "top top",
              end: () => `+=${totalRange * 0.5}`,
              pin: true,
              animation: tween,
              scrub: 1.5,
              invalidateOnRefresh: true,
            });

            // Calculate the page scroll position that maps to heroProgress
            const targetScrollY =
              trigger.start + heroProgress * (trigger.end - trigger.start);

            // Use window.scrollTo directly — Lenis is stopped during splash,
            // so lenis.scrollTo won't work. This silently positions behind the portal.
            window.scrollTo(0, targetScrollY);
          });
        });

        return () => {
          cancelAnimationFrame(setupId);
          // Kill any existing triggers on this element
          ScrollTrigger.getAll()
            .filter((t) => t.trigger === wrapperRef.current)
            .forEach((t) => t.kill());
          gsap.set(track, { clearProps: "all" });
        };
      });

      return () => mm.revert();
    },
    {
      scope: wrapperRef,
      dependencies: [hasTrackContent, projects],
      revertOnUpdate: true,
    }
  );

  // Build track: AI panels → Hero → Cinema panels
  const renderPanels = (panels, type) =>
    panels.map((panel, index) => (
      <section
        key={`${type}-${panel.type}-${index}`}
        className={`showcase-panel bento-column ${panel.type}`}
      >
        {panel.items.map((item) => (
          <div
            key={item.id}
            className="bento-card"
            onClick={() => onSelectProject?.(item.raw)}
            role="presentation"
          >
            <ProjectPreviewMedia item={item} />

            <div className="bento-card-overlay" />
            <div className="bento-card-title-wrap">
              <h3 className="bento-card-meta">{item.title}</h3>
            </div>
          </div>
        ))}
      </section>
    ));

  const emptyPanel = (label) => (
    <section className="horizontal-empty horizontal-panel" aria-live="polite">
      <div className="horizontal-empty-card">
        <h2>
          {status === "loading" ? "Loading reel..." : `No ${label} found`}
        </h2>
        <p>
          {status === "error"
            ? errorMessage
            : `Publish ${label === "AI projects" ? "AI " : ""}videos through the hidden /Admin page to populate this showcase.`}
        </p>
      </div>
    </section>
  );

  return (
    <div className="scroll-wrapper" ref={wrapperRef}>
      <div className="horizontal-track" ref={trackRef}>
        {/* AI panels on the LEFT */}
        {status === "success" && aiPanels.length > 0
          ? renderPanels(aiPanels, "ai")
          : emptyPanel("AI projects")}

        {/* HERO / MAIN PAGE in the CENTER */}
        <section className="hero-section horizontal-panel" id="home">
          <div className="hero-left">
            <p className="hero-kicker">
              Cinematic systems for brands and stories
            </p>
            <h1 className="hero-title">
              Turning complex ideas into clear,{" "}
              <span className="serif-italic">scalable creative</span> systems.
            </h1>
            <p className="hero-copy">
              Stories, workflows, and AI-powered content designed to scale across
              premium digital experiences.
            </p>
          </div>

          <div className="hero-right">
            <div className="hero-direction-hints">
              <div className="direction-hint direction-hint-up">
                <svg viewBox="0 0 24 24" fill="none" className="direction-hint-icon">
                  <path
                    d="M12 19V5M12 5L6 11M12 5L18 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Scroll up — AI Videos</span>
              </div>
              <div className="direction-hint direction-hint-down">
                <svg viewBox="0 0 24 24" fill="none" className="direction-hint-icon">
                  <path
                    d="M12 5V19M12 19L6 13M12 19L18 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Scroll down — Cinema</span>
              </div>
            </div>
          </div>
        </section>

        {/* CINEMA panels on the RIGHT */}
        {status === "success" && regularPanels.length > 0
          ? renderPanels(regularPanels, "cinema")
          : emptyPanel("cinema projects")}
      </div>
    </div>
  );
}
