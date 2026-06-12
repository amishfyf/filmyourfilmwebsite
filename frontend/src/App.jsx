import { useState, useEffect } from "react";
import { Link, useLocation, Routes, Route } from "react-router";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import AdminPage from "./components/AdminPage";
import HorizontalScroll from "./components/HorizontalScroll";
import Contact from "./components/Contact";
import ClientGrid from "./components/ClientGrid";
import VideoModal from "./components/VideoModal";
import WorkPage from "./components/WorkPage";
import BlurryCursor from "./components/BlurryCursor";
import SiteHeader from "./components/SiteHeader";
import ContactPage from "./components/ContactPage";
import "./App.css";

function App() {
  const location = useLocation();
  const normalizedPath = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const isAdminRoute = normalizedPath === "/admin";
  const isWorkRoute = normalizedPath === "/work";
  const isContactRoute = normalizedPath === "/contact";
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(!isAdminRoute && !isWorkRoute && !isContactRoute);
  const [fade, setFade] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    if (isAdminRoute || isWorkRoute || isContactRoute) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1, // Adjust for smoothness
      duration: 1.2,
      smoothWheel: true,
    });

    window.lenis = lenis;

    let fadeTimeout;
    let endTimeout;

    if (loading) {
      lenis.stop();
      document.body.style.overflow = "hidden";

      fadeTimeout = setTimeout(() => {
        setFade(true);
      }, 1000);

      endTimeout = setTimeout(() => {
        setLoading(false);
        lenis.start();
        document.body.style.overflow = "";
      }, 1500);
    } else {
      lenis.start();
      document.body.style.overflow = "";
    }

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
      if (fadeTimeout) clearTimeout(fadeTimeout);
      if (endTimeout) clearTimeout(endTimeout);
      lenis.destroy();
      window.lenis = null;
      document.body.style.overflow = "";
    };
  }, [isAdminRoute, isWorkRoute, isContactRoute, loading]);

  return (
    <>
      {!isAdminRoute && <BlurryCursor />}
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="*"
          element={
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

              <SiteHeader />

              <main className="site-main">
                <HorizontalScroll onSelectProject={setActiveProject} loading={loading} onLoaded={() => setProjectsLoaded(true)} />
                <ClientGrid />
                <Contact />
              </main>

              <VideoModal
                project={activeProject}
                onClose={() => setActiveProject(null)}
              />
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
