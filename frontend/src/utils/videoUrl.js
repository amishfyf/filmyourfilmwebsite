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