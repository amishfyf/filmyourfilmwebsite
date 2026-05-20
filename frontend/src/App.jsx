import { useState, useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import AdminPage from "./components/AdminPage";
import HorizontalScroll from "./components/HorizontalScroll";
import Contact from "./components/Contact";
import ClientGrid from "./components/ClientGrid";
import VideoModal from "./components/VideoModal";
import WorkPage from "./components/WorkPage";
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
  const [loading, setLoading] = useState(!isAdminRoute && !isWorkRoute);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (isAdminRoute || isWorkRoute) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1, // Adjust for smoothness
      duration: 1.2,
      smoothWheel: true,
    });

    window.lenis = lenis;
    lenis.stop();
    document.body.style.overflow = "hidden";

    const fadeTimeout = setTimeout(() => {
      setFade(true);
    }, 1000);

    const endTimeout = setTimeout(() => {
      setLoading(false);
      lenis.start();
      document.body.style.overflow = "";
    }, 1500);

    // Handle smooth scrolling for anchor links to prevent the `#contact` URL jump
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
      clearTimeout(fadeTimeout);
      clearTimeout(endTimeout);
      lenis.destroy();
      window.lenis = null;
      document.body.style.overflow = "";
    };
  }, [isAdminRoute, isWorkRoute]);

  if (isAdminRoute) {
    return <AdminPage />;
  }

  if (isWorkRoute) {
    return <WorkPage />;
  }

  return (
    <div className="app-shell">
      {loading && (
        <div className={`fullscreen-loader ${fade ? "fade-out" : ""}`}>
          <img
            alt="Film Your Film"
            className="loader-logo-mark"
            src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
          />
        </div>
      )}

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
        <HorizontalScroll onSelectProject={setActiveProject} loading={loading} />
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
