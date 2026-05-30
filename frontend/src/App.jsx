import { useState, useEffect, useCallback } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import AdminPage from "./components/AdminPage";
import HorizontalScroll from "./components/HorizontalScroll";
import Contact from "./components/Contact";
import ClientGrid from "./components/ClientGrid";
import VideoModal from "./components/VideoModal";
import WorkPage from "./components/WorkPage";
import LandingPage from "./components/LandingPage";
import "./App.css";

const getNormalizedPath = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "");
  return pathname || "/";
};

function App() {
  const normalizedPath = getNormalizedPath().toLowerCase();
  const isAdminRoute = normalizedPath === "/admin";
  const isWorkRoute = normalizedPath === "/work";
  const [activeProject, setActiveProject] = useState(null);
  const [showLanding, setShowLanding] = useState(!isAdminRoute && !isWorkRoute);
  // splashDone drives hero entrance animation — false while splash is visible
  const [splashDone, setSplashDone] = useState(isAdminRoute || isWorkRoute);

  useEffect(() => {
    if (isAdminRoute || isWorkRoute) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
    });

    window.lenis = lenis;

    // Keep scroll locked while landing splash is visible
    if (showLanding) {
      lenis.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis.start();
      document.body.style.overflow = "";
    }

    // Handle smooth scrolling for anchor links
    const handleAnchorClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        lenis.scrollTo(href);
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      window.lenis = null;
      document.body.style.overflow = "";
    };
  }, [isAdminRoute, isWorkRoute, showLanding]);

  const handleSplashComplete = useCallback(() => {
    setShowLanding(false);
    setSplashDone(true);

    // Unlock scroll
    if (window.lenis) {
      window.lenis.start();
      document.body.style.overflow = "";
    }
  }, []);

  if (isAdminRoute) {
    return <AdminPage />;
  }

  if (isWorkRoute) {
    return <WorkPage />;
  }

  return (
    <div className="app-shell">
      {/* Portal-based splash — renders into document.body, covers everything */}
      {showLanding && <LandingPage onComplete={handleSplashComplete} />}

      <header className="site-header">
        <a className="site-logo" href="#home">
          <img
            alt="Film Your Film"
            className="site-logo-mark"
            src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
          />
        </a>
        <nav className="site-nav">
          <a href="#home">Home</a>
          <a href="/work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="site-main">
        {/*
          splashDone=false: GSAP scroll setup runs (positions track to center),
                            but hero entrance anim waits
          splashDone=true:  hero entrance animation plays
        */}
        <HorizontalScroll
          onSelectProject={setActiveProject}
          loading={!splashDone}
        />
        <ClientGrid />
        <Contact />
      </main>

      <VideoModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </div>
  );
}

export default App;
