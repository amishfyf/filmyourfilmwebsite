import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { fetchProjects } from '../services/projectsApi';
import { isDirectVideoUrl, normalizeVideoUrl } from '../utils/videoUrl';
import Contact from './Contact';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const getProjectId = (project, index) => project._id || project.vimeoId || project.videoUrl || `project-${index}`;

const getProjectSourceType = (project) => {
  if (project?.sourceType === 'direct') {
    return 'direct';
  }

  if (project?.sourceType === 'external') {
    return 'external';
  }

  if (project?.sourceType === 'vimeo' || project?.vimeoId) {
    return 'vimeo';
  }

  if (project?.videoUrl && isDirectVideoUrl(project.videoUrl)) {
    return 'direct';
  }

  return 'external';
};

const getProjectVideoUrl = (project) => {
  if (!project) {
    return '';
  }

  if (project.videoUrl) {
    return normalizeVideoUrl(project.videoUrl);
  }

  if (project.vimeoId) {
    return `https://vimeo.com/${project.vimeoId}`;
  }

  return '';
};

const getVimeoPreviewUrl = (project) => {
  const vimeoId = String(project?.vimeoId || project?.raw?.vimeoId || '').trim();

  if (!vimeoId) {
    return '';
  }

  return `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1&autopause=0&controls=0&title=0&byline=0&portrait=0&dnt=1`;
};

const normalizeProjects = (projects) => {
  return projects.map((project, index) => ({
    id: getProjectId(project, index),
    title: project.title,
    style: project.gridStyle === 'full' ? 'full' : project.gridStyle,
    thumbnailUrl: project.thumbnailUrl,
    vimeoId: project.vimeoId,
    sourceType: getProjectSourceType(project),
    videoUrl: getProjectVideoUrl(project),
    raw: project,
  }));
};

const buildExplicitPanels = (projects) => {
  const panels = [];
  let tempStack = [];

  projects.forEach((project) => {
    if (project.style === 'full') {
      if (tempStack.length === 1) {
        panels.push({ type: 'full', items: [...tempStack] });
        tempStack = [];
      } else if (tempStack.length === 2) {
        panels.push({ type: 'half-stack', items: [...tempStack] });
        tempStack = [];
      }

      panels.push({ type: 'full', items: [project] });
      return;
    }

    tempStack.push(project);

    if (tempStack.length === 2) {
      panels.push({ type: 'half-stack', items: [...tempStack] });
      tempStack = [];
    }
  });

  if (tempStack.length === 1) {
    panels.push({ type: 'full', items: [...tempStack] });
  } else if (tempStack.length === 2) {
    panels.push({ type: 'half-stack', items: [...tempStack] });
  }

  return panels;
};

const buildAutomaticPanels = (projects) => {
  const panels = [];
  let cursor = 0;
  let shouldRenderFullPanel = true;

  while (cursor < projects.length) {
    const remaining = projects.length - cursor;

    if (shouldRenderFullPanel || remaining === 1) {
      panels.push({ type: 'full', items: [projects[cursor]] });
      cursor += 1;
    } else {
      panels.push({
        type: 'half-stack',
        items: projects.slice(cursor, cursor + 2),
      });
      cursor += Math.min(2, remaining);
    }

    shouldRenderFullPanel = !shouldRenderFullPanel;
  }

  return panels;
};

const buildPanels = (projects) => {
  if (!projects.length) {
    return [];
  }

  const hasExplicitStacking = projects.some((project) => project.style !== 'full');
  return hasExplicitStacking ? buildExplicitPanels(projects) : buildAutomaticPanels(projects);
};

function ProjectPreviewMedia({ item }) {
  const containerRef = useRef(null);
  const [isMediaActive, setIsMediaActive] = useState(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsMediaActive(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsMediaActive(Boolean(entry?.isIntersecting));
      },
      {
        root: null,
        rootMargin: '15% 35%',
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const shouldRenderDirectPreview = isMediaActive && item.sourceType === 'direct' && item.videoUrl;
  const vimeoPreviewUrl = isMediaActive && item.sourceType === 'vimeo' ? getVimeoPreviewUrl(item) : '';

  return (
    <div className="bento-card-media-shell" ref={containerRef}>
      {shouldRenderDirectPreview ? (
        <video
          autoPlay
          className="bento-card-media"
          loop
          muted
          playsInline
          poster={item.thumbnailUrl || undefined}
          preload="metadata"
          src={item.videoUrl}
        />
      ) : vimeoPreviewUrl ? (
        <div aria-hidden="true" className="bento-card-media bento-card-media-frame">
          <iframe
            allow="autoplay; fullscreen; picture-in-picture"
            className="bento-card-media-embed"
            loading="lazy"
            src={vimeoPreviewUrl}
            tabIndex="-1"
            title={`${item.title} preview`}
          ></iframe>
        </div>
      ) : item.thumbnailUrl ? (
        <img alt={`${item.title} thumbnail`} className="bento-card-media" loading="lazy" src={item.thumbnailUrl} />
      ) : (
        <div className="bento-card-fallback" />
      )}
    </div>
  );
}

export default function HorizontalScroll({ onSelectProject }) {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadProjects = async () => {
      try {
        setStatus('loading');
        setErrorMessage('');
        const data = await fetchProjects(controller.signal);
        setProjects(Array.isArray(data) ? normalizeProjects(data) : []);
        setStatus('success');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setProjects([]);
        setErrorMessage(error.message || 'Unable to load projects.');
        setStatus('error');
      }
    };

    loadProjects();

    return () => controller.abort();
  }, []);

  const panels = buildPanels(projects);
  const hasTrackContent = status === 'success' && panels.length > 0;

  useGSAP(() => {
    if (!wrapperRef.current || !trackRef.current || !hasTrackContent) {
      return undefined;
    }

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
      ease: 'none',
    });

    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: () => `+=${trackRef.current.scrollWidth - window.innerWidth}`,
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true,
    });

    return () => {
      trigger.kill();
      tween.kill();
      gsap.set(trackRef.current, { clearProps: 'x' });
    };
  }, {
    scope: wrapperRef,
    dependencies: [hasTrackContent, projects],
    revertOnUpdate: true,
  });

  return (
    <div className="scroll-wrapper" ref={wrapperRef}>
      <div className="horizontal-track" ref={trackRef}>
        <section className="hero-section horizontal-panel" id="home">
          <p className="hero-kicker">Cinematic systems for brands and stories</p>
          <h1 className="hero-title">
            Turning complex ideas into clear,{' '}
            <span className="serif-italic">scalable creative</span> systems.
          </h1>
          <p className="hero-copy">
            Stories, workflows, and AI-powered content designed to scale across premium digital experiences.
          </p>
        </section>

        {status === 'success' && panels.length ? (
          panels.map((panel, index) => (
            <section
              key={`${panel.type}-${index}`}
              className={`showcase-panel bento-column ${panel.type}`}
              id={index === 0 ? 'work' : undefined}
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
                      <p className="bento-card-meta">
                        {item.sourceType === 'direct'
                          ? panel.type === 'full'
                            ? 'Featured film'
                            : 'Stacked film'
                          : item.sourceType === 'vimeo'
                            ? 'Vimeo project'
                            : 'Linked media'}
                      </p>
                      <h3 className="bento-card-title">{item.title}</h3>
                    </div>
                  </div>
                );
              })}
            </section>
          ))
        ) : (
          <section className="horizontal-empty horizontal-panel" aria-live="polite">
            <div className="horizontal-empty-card">
              <h2>{status === 'loading' ? 'Loading reel...' : 'No projects found'}</h2>
              <p>
                {status === 'error'
                  ? errorMessage
                  : 'Publish videos through the hidden /Admin page to populate this showcase.'}
              </p>
            </div>
          </section>
        )}

        <div className="contact-panel">
          <Contact />
        </div>
      </div>
    </div>
  );
}
