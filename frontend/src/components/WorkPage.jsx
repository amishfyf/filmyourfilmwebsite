import { useEffect, useState } from "react";
import { fetchProjects } from "../services/projectsApi";
import VideoModal from "./VideoModal";
import {
  getProjectMetaLabel,
  normalizeProjects,
  ProjectPreviewMedia,
} from "./projectCatalog";
import "./styles.css";
import "./WorkPage.css";

const getWorkCardVariant = (index, total) => {
  if (total % 2 === 1 && index === total - 1) {
    return "work-project-card work-project-card-wide work-project-card-feature";
  }

  const pairIndex = Math.floor(index / 2);
  const isFirstInPair = index % 2 === 0;

  if (pairIndex % 2 === 0) {
    return isFirstInPair
      ? "work-project-card work-project-card-compact work-project-card-left"
      : "work-project-card work-project-card-wide work-project-card-right";
  }

  return isFirstInPair
    ? "work-project-card work-project-card-wide work-project-card-left"
    : "work-project-card work-project-card-compact work-project-card-right";
};

function WorkPage() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const previousScrollBehavior =
      document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    window.scrollTo(0, 0);

    return () => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

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

  return (
    <div className="work-page-shell">
      <header className="site-header site-header-work">
        <a className="site-logo" href="/">
          <img
            alt="Film Your Film"
            className="site-logo-mark"
            src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
          />
        </a>

        <a aria-label="Back to home" className="work-page-orb" href="/">
          ✦
        </a>

        <nav className="site-nav">
          <a href="/">Home</a>
          <a aria-current="page" href="#work-grid">
            Work
          </a>
          <a href="/#contact">Contact</a>
        </nav>
      </header>

      <main className="work-page-main">
        <section className="work-page-grid" id="work-grid">
          {status === "success" && projects.length ? (
            projects.map((item, index) => (
              <article
                className={getWorkCardVariant(index, projects.length)}
                key={item.id}
                onClick={() => setActiveProject(item.raw)}
                role="presentation"
              >
                <div className="work-project-media">
                  <ProjectPreviewMedia item={item} />
                </div>

                <div className="work-project-copy">
                  <h2 className="work-project-title">{item.title}</h2>
                  <p className="work-project-meta">
                    {getProjectMetaLabel(item, "full")}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <section className="work-empty-state" aria-live="polite">
              <div className="work-empty-card">
                <h2>
                  {status === "loading"
                    ? "Loading work..."
                    : "No projects found"}
                </h2>
                <p>
                  {status === "error"
                    ? errorMessage
                    : "Publish videos through the hidden /Admin page to populate this work archive."}
                </p>
              </div>
            </section>
          )}
        </section>

        <section className="work-page-contact" id="work-contact">
          <div className="work-page-contact-copy">
            <h2 className="work-page-contact-title">
              Got a project in mind? <span>Let&apos;s talk</span>
            </h2>
            <div className="work-page-contact-blob"></div>
          </div>

          <div className="work-page-footer">
            <p className="work-page-footer-brand">filmyourfilm.com</p>
            <nav className="work-page-footer-nav">
              <a href="#work-grid">Work</a>
              <a href="/#home">Home</a>
              <a href="/#contact">Contact</a>
            </nav>
          </div>
        </section>
      </main>

      <VideoModal
        onClose={() => setActiveProject(null)}
        project={activeProject}
      />
    </div>
  );
}

export default WorkPage;
