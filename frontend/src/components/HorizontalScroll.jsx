import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { fetchProjects } from "../services/projectsApi";
import Contact from "./Contact";
import {
  buildPanels,
  getProjectMetaLabel,
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
  const [showcaseType, setShowcaseType] = useState("cinema");

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
  const activePanels = showcaseType === "cinema" ? regularPanels : aiPanels;
  const hasTrackContent = status === "success" && activePanels.length > 0;

  const handleToggle = (type) => {
    if (type === showcaseType) return;
    setShowcaseType(type);
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  };

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

  useGSAP(
    () => {
      if (!wrapperRef.current || !trackRef.current || !hasTrackContent) {
        return undefined;
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 721px)", () => {
        const getScrollAmount = () => {
          const trackWidth = trackRef.current.scrollWidth;
          return -(trackWidth - window.innerWidth);
        };

        if (trackRef.current.scrollWidth <= window.innerWidth) {
          gsap.set(trackRef.current, { x: 0 });
          return undefined;
        }

        const tween = gsap.to(trackRef.current, {
          x: getScrollAmount,
          ease: "none",
        });

        const trigger = ScrollTrigger.create({
          trigger: wrapperRef.current,
          start: "top top",
          end: () =>
            `+=${(trackRef.current.scrollWidth - window.innerWidth) * 0.5}`,
          pin: true,
          animation: tween,
          scrub: 1.5,
          invalidateOnRefresh: true,
        });

        return () => {
          trigger.kill();
          tween.kill();
          gsap.set(trackRef.current, { clearProps: "all" });
        };
      });

      return () => mm.revert();
    },
    {
      scope: wrapperRef,
      dependencies: [hasTrackContent, projects, showcaseType],
      revertOnUpdate: true,
    },
  );

  return (
    <div className="scroll-wrapper" ref={wrapperRef}>
      <div className="horizontal-track" ref={trackRef}>
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
            <div className="hero-selector-vertical">
              <button
                className={`selector-btn-v ${showcaseType === "cinema" ? "active" : ""}`}
                onClick={() => handleToggle("cinema")}
              >
                Cinema Work
              </button>
              <button
                className={`selector-btn-v ${showcaseType === "ai" ? "active" : ""}`}
                onClick={() => handleToggle("ai")}
              >
                AI Videos
              </button>
            </div>

            <div className="scroll-indicator-horizontal">
              <span>Scroll to explore</span>
              <svg className="scroll-indicator-arrow" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </section>

        {status === "success" && activePanels.length ? (
          activePanels.map((panel, index) => (
            <section
              key={`${showcaseType}-${panel.type}-${index}`}
              className={`showcase-panel bento-column ${panel.type}`}
              id={index === 0 ? "work" : undefined}
            >
              {panel.items.map((item) => {
                return (
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
                );
              })}
            </section>
          ))
        ) : (
          <section
            className="horizontal-empty horizontal-panel"
            aria-live="polite"
          >
            <div className="horizontal-empty-card">
              <h2>
                {status === "loading" ? "Loading reel..." : "No projects found"}
              </h2>
              <p>
                {status === "error"
                  ? errorMessage
                  : `Publish ${showcaseType === "ai" ? "AI " : ""}videos through the hidden /Admin page to populate this showcase.`}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
