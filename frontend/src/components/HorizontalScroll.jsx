import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { fetchProjects } from '../services/projectsApi';
import Contact from './Contact';
import { buildPanels, getProjectMetaLabel, normalizeProjects, ProjectPreviewMedia } from './projectCatalog';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

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

    const mm = gsap.matchMedia();

    mm.add('(min-width: 721px)', () => {
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
        end: () => `+=${(trackRef.current.scrollWidth - window.innerWidth) * 0.5}`,
        pin: true,
        animation: tween,
        scrub: 1.5,
        invalidateOnRefresh: true,
      });

      return () => {
        trigger.kill();
        tween.kill();
        gsap.set(trackRef.current, { clearProps: 'all' });
      };
    });

    return () => mm.revert();
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
                      <p className="bento-card-meta">{getProjectMetaLabel(item, panel.type)}</p>
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
      </div>
    </div>
  );
}
