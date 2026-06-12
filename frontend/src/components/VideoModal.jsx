import { useEffect } from "react";
import { isDirectVideoUrl, normalizeVideoUrl, isCloudinaryUrl, getCloudinaryOptimizedUrl } from "../utils/videoUrl";

const getSourceType = (project) => {
  if (project?.sourceType === "direct" || project?.sourceType === "cloudinary") {
    return "direct";
  }

  if (project?.sourceType === "external") {
    return "external";
  }

  if (project?.sourceType === "vimeo" || project?.vimeoId) {
    return "vimeo";
  }

  if (project?.videoUrl && isCloudinaryUrl(project.videoUrl)) {
    return "direct";
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

  if (project.vimeoId && !project.videoUrl) {
    return `https://player.vimeo.com/video/${project.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
  }

  if (project.videoUrl) {
    const normalized = normalizeVideoUrl(project.videoUrl);
    return isCloudinaryUrl(normalized) ? getCloudinaryOptimizedUrl(normalized) : normalized;
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