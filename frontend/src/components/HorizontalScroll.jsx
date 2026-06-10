import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { fetchProjects, fetchHeroSetting } from "../services/projectsApi";
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
  const [heroVideoUrl, setHeroVideoUrl] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProjects = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");
        const [data, heroSetting] = await Promise.all([
          fetchProjects(controller.signal),
          fetchHeroSetting(controller.signal).catch(() => ({ heroVideoUrl: "" }))
        ]);
        setProjects(Array.isArray(data) ? normalizeProjects(data) : []);
        setHeroVideoUrl(heroSetting?.heroVideoUrl || "");
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
        <section className="hero-section horizontal-panel" id="home" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {heroVideoUrl && (
            <video
              autoPlay
              loop
              muted
              playsInline
              src={heroVideoUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.4,
                zIndex: 0,
                pointerEvents: "none"
              }}
            />
          )}
          <div
            className="hero-content"
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              textAlign: "center",
              gap: "2.5rem"
            }}
          >
            <h1 className="hero-title" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: "clamp(4rem, 9vw, 8.5rem)", letterSpacing: "-0.03em", maxWidth: "1200px", margin: 0, lineHeight: 1 }}>
              Lights, Camera,<br />and AI
            </h1>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                className="hero-action-btn"
                onClick={() => handleToggle("cinema")}
                style={{
                  padding: "1rem 2.5rem",
                  borderRadius: "50px",
                  border: showcaseType === "cinema" ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.3)",
                  background: showcaseType === "cinema" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: "#fff",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease"
                }}
              >
                TV Commercial
              </button>
              <button
                className="hero-action-btn"
                onClick={() => handleToggle("ai")}
                style={{
                  padding: "1rem 2.5rem",
                  borderRadius: "50px",
                  border: showcaseType === "ai" ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.3)",
                  background: showcaseType === "ai" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: "#fff",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease"
                }}
              >
                AI Videos
              </button>
            </div>

            <div className="scroll-indicator-horizontal" style={{ position: "absolute", bottom: "3rem", left: "50%", transform: "translateX(-50%)" }}>
              <span>Scroll to explore</span>
              <i className="fa-solid fa-arrow-right-long scroll-indicator-arrow"></i>
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
