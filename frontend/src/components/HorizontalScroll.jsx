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

const normalizeProjects = (projects) => {
  return projects.map((project, index) => ({
    id: getProjectId(project, index),
    title: project.title,
    style: project.gridStyle === 'full' ? 'full' : project.gridStyle,
    thumbnailUrl: project.thumbnailUrl,
    sourceType: getProjectSourceType(project),
    videoUrl: getProjectVideoUrl(project),
    raw: project,
  }));
};

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

  const columns = [];
  let tempStack = [];

  projects.forEach((project) => {
    if (project.style === 'full') {
      columns.push({ type: 'full', items: [project] });
    } else {
      tempStack.push(project);

      if (tempStack.length === 2) {
        columns.push({ type: 'half-stack', items: [...tempStack] });
        tempStack = [];
      }
    }
  });

  if (tempStack.length) {
    columns.push({ type: 'half-stack', items: [...tempStack] });
  }

  const hasTrackContent = status === 'success' && columns.length > 0;

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
    <div className="scroll-wrapper" id="work" ref={wrapperRef}>
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

        {status === 'success' && columns.length ? (
          columns.map((col, index) => (
            <div key={`${col.type}-${index}`} className={`bento-column ${col.type}`}>
              {col.items.map((item) => {
                const shouldRenderVideoPreview = item.sourceType === 'direct' && !item.thumbnailUrl && item.videoUrl;

                return (
                  <div
                    key={item.id}
                    className="bento-card"
                    onClick={() => onSelectProject?.(item.raw)}
                    role="presentation"
                  >
                    {shouldRenderVideoPreview ? (
                      <video autoPlay className="bento-card-media" loop muted playsInline preload="metadata" src={item.videoUrl} />
                    ) : item.thumbnailUrl ? (
                      <img alt={`${item.title} thumbnail`} className="bento-card-media" src={item.thumbnailUrl} />
                    ) : (
                      <div className="bento-card-fallback" />
                    )}

                    <div className="bento-card-overlay" />
                    <div className="bento-card-title-wrap">
                      <p className="bento-card-meta">
                        {item.sourceType === 'direct'
                          ? 'Direct video'
                          : item.sourceType === 'vimeo'
                            ? 'Vimeo project'
                            : 'Linked media'}
                      </p>
                      <h3 className="bento-card-title">{item.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <section className="horizontal-empty horizontal-panel" aria-live="polite">
            <div className="horizontal-empty-card">
              <h2>{status === 'loading' ? 'Loading reel...' : 'No projects found'}</h2>
              <p>
                {status === 'error'
                  ? errorMessage
                  : 'Publish videos through the backend admin routes to populate this horizontal grid.'}
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
