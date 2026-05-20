import { useEffect } from "react";
import { isDirectVideoUrl, normalizeVideoUrl, isGoogleDriveUrl, getGoogleDriveEmbedUrl } from "../utils/videoUrl";

const getSourceType = (project) => {
  if (project?.sourceType === "direct") {
    return "direct";
  }

  if (project?.sourceType === "external") {
    if (project?.videoUrl && isGoogleDriveUrl(project.videoUrl)) {
      return "google-drive";
    }
    return "external";
  }

  if (project?.sourceType === "vimeo" || project?.vimeoId) {
    return "vimeo";
  }

  if (project?.videoUrl && isGoogleDriveUrl(project.videoUrl)) {
    return "google-drive";
  }

  if (project?.videoUrl && isDirectVideoUrl(project.videoUrl)) {
    return "direct";
  }

  return "external";
};

const getVideoUrl = (project) => {
  if (!project) {
    return "";
  }

  if (project.vimeoId) {
    return `https://player.vimeo.com/video/${project.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
  }

  if (project.videoUrl) {
    if (isGoogleDriveUrl(project.videoUrl)) {
      return getGoogleDriveEmbedUrl(project.videoUrl);
    }
    return normalizeVideoUrl(project.videoUrl);
  }

  return "";
};

function VideoModal({ project, onClose }) {
  useEffect(() => {
    if (!project) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, project]);

  if (!project) {
    return null;
  }

  const sourceType = getSourceType(project);
  const videoUrl = getVideoUrl(project);

  return (
    <div className="video-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="video-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="video-modal-header">
          <div>
            <h2 className="video-modal-label">{project.title}</h2>
          </div>

          <div className="video-modal-actions">
            {videoUrl ? (
              <a
                className="video-modal-close"
                href={videoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open source
              </a>
            ) : null}

            <button
              className="video-modal-close"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="video-modal-player-shell">
          {sourceType === "direct" ? (
            <video
              autoPlay
              className="video-modal-player"
              controls
              playsInline
              preload="auto"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : sourceType === "vimeo" ? (
            <iframe
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              src={videoUrl}
              title={project.title}
            ></iframe>
          ) : sourceType === "google-drive" ? (
            <iframe
              allow="autoplay; fullscreen"
              allowFullScreen
              src={videoUrl}
              title={project.title}
              style={{ border: 'none', width: '100%', height: '100%' }}
            ></iframe>
          ) : (
            <iframe
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              src={videoUrl}
              title={project.title}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoModal;
