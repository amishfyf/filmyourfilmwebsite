const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

export const normalizeVideoUrl = (value = '') => {
  try {
    const parsedUrl = new URL(String(value).trim());
    const pathname = parsedUrl.pathname.replace(/^\//, '');
    const malformedMatch = pathname.match(/^([a-f0-9]{24})([a-f0-9]{24}_.+\.(?:mp4|webm|ogg|mov|m4v))$/i);

    if (malformedMatch && parsedUrl.hostname === 'cdn.prod.website-files.com') {
      return `${parsedUrl.origin}/${malformedMatch[1]}%2F${malformedMatch[2]}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return parsedUrl.toString();
  } catch (error) {
    return String(value || '').trim();
  }
};

export const isDirectVideoUrl = (value = '') => {
  return DIRECT_VIDEO_PATTERN.test(normalizeVideoUrl(value));
};

export const isGoogleDriveUrl = (value = '') => {
  return /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.test(String(value));
};

export const getGoogleDriveFileId = (value = '') => {
  const match = String(value).match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
};

export const getGoogleDriveEmbedUrl = (value = '') => {
  const id = getGoogleDriveFileId(value);
  return id ? `https://drive.google.com/file/d/${id}/preview` : '';
};

export const getGoogleDriveDirectUrl = (value = '') => {
  const id = getGoogleDriveFileId(value);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : '';
};

export const isCloudinaryUrl = (value = '') => {
  return /res\.cloudinary\.com\/.+\/video\/upload/i.test(String(value));
};

export const getCloudinaryOptimizedUrl = (value = '') => {
  const url = String(value).trim();

  if (!isCloudinaryUrl(url)) {
    return url;
  }

  // Already has transforms — don't double-add
  if (/\/q_auto|\/f_auto/.test(url)) {
    return url;
  }

  // Insert q_auto,f_auto after /upload/
  return url.replace(
    /(\/upload\/)/i,
    '$1q_auto,f_auto/'
  );
};