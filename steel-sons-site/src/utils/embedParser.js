// src/utils/embedParser.js
export const parseEmbedUrl = (url) => {
  if (!url) return null;

  url = url.trim();

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be'))
      return { type: 'youtube', url };

    if (hostname.includes('vimeo.com'))
      return { type: 'vimeo', url };

    if (hostname.includes('giphy.com'))
      return { type: 'giphy', url };

    if (hostname.includes('tenor.com'))
      return { type: 'tenor', url };

    if (hostname.includes('twitter.com') || hostname.includes('x.com'))
      return { type: 'twitter', url };

    if (hostname.includes('tiktok.com'))
      return { type: 'tiktok', url };

    if (hostname.includes('instagram.com'))
      return { type: 'instagram', url };

    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(parsed.pathname))
      return { type: 'image', url };

    if (/\.(mp4|mov|webm)$/i.test(parsed.pathname))
      return { type: 'video', url };

    return { type: 'link', url };
  } catch (err) {
    console.warn('Invalid embed URL:', err);
    return null;
  }
};
