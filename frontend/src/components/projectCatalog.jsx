import { useEffect, useRef, useState } from 'react';
import { isDirectVideoUrl, normalizeVideoUrl, isGoogleDriveUrl, getGoogleDriveDirectUrl, isCloudinaryUrl, getCloudinaryOptimizedUrl } from '../utils/videoUrl';

const ACTIVE_PREVIEW_VISIBILITY_RATIO = 0;
const PREVIEW_VISIBILITY_THRESHOLDS = [0, 0.15, 0.35, 0.55, 0.75, 1];

const getProjectId = (project, index) => project._id || project.vimeoId || project.videoUrl || `project-${index}`;

const getProjectSourceType = (project) => {
  if (project?.sourceType === 'direct') {
    return 'direct';
  }

  if (project?.sourceType === 'external') {
    if (project?.videoUrl && isGoogleDriveUrl(project.videoUrl)) {
      return 'google-drive';
    }
    return 'external';
  }

  if (project?.sourceType === 'vimeo' || project?.vimeoId) {
    return 'vimeo';
  }

  if (project?.videoUrl && isGoogleDriveUrl(project.videoUrl)) {
    return 'google-drive';
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
    const normalized = normalizeVideoUrl(project.videoUrl);
    return isCloudinaryUrl(normalized) ? getCloudinaryOptimizedUrl(normalized) : normalized;
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

export const normalizeProjects = (projects) => {
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

export const buildPanels = (projects) => {
  if (!projects.length) {
    return [];
  }

  const hasExplicitStacking = projects.some((project) => project.style !== 'full');
  return hasExplicitStacking ? buildExplicitPanels(projects) : buildAutomaticPanels(projects);
};

export const getProjectMetaLabel = (item, panelType) => {
  if (item.sourceType === 'direct') {
    return panelType === 'full' ? 'Featured film' : 'Stacked film';
  }

  if (item.sourceType === 'vimeo') {
    return 'Vimeo project';
  }

  return 'Linked media';
};

export function ProjectPreviewMedia({ item }) {
  const shouldRenderDirectPreview = item.sourceType === 'direct' && item.videoUrl;
  const vimeoPreviewUrl = item.sourceType === 'vimeo' ? getVimeoPreviewUrl(item) : '';
  const isGoogleDrive = item.sourceType === 'google-drive';
  const driveDirectUrl = isGoogleDrive ? getGoogleDriveDirectUrl(item.videoUrl) : '';

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      { rootMargin: "200px" } // Preload slightly before entering viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  return (
    <div className="bento-card-media-shell" ref={containerRef}>
      {shouldRenderDirectPreview ? (
        <video
          ref={videoRef}
          className="bento-card-media"
          loop
          muted
          playsInline
          poster={item.thumbnailUrl || undefined}
          preload="metadata"
          src={hasBeenVisible ? item.videoUrl : ""}
        />
      ) : isGoogleDrive && driveDirectUrl ? (
        <video
          ref={videoRef}
          className="bento-card-media"
          loop
          muted
          playsInline
          poster={item.thumbnailUrl || undefined}
          preload="metadata"
          src={hasBeenVisible ? driveDirectUrl : ""}
        />
      ) : vimeoPreviewUrl ? (
        <div aria-hidden="true" className="bento-card-media bento-card-media-frame">
          {hasBeenVisible && (
            <iframe
              allow="autoplay; fullscreen; picture-in-picture"
              className="bento-card-media-embed"
              src={vimeoPreviewUrl}
              tabIndex="-1"
              title={`${item.title} preview`}
              loading="lazy"
            ></iframe>
          )}
        </div>
      ) : item.thumbnailUrl ? (
        <img alt={`${item.title} thumbnail`} className="bento-card-media" src={hasBeenVisible ? item.thumbnailUrl : ""} loading="lazy" />
      ) : (
        <div className="bento-card-fallback" />
      )}
    </div>
  );
}