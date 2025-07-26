// utils/embedParser.js
export function parseEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      return { type: 'youtube', url };
    }
    if (hostname === 'vimeo.com') {
      return { type: 'vimeo', url };
    }
    if (hostname === 'giphy.com') {
      return { type: 'giphy', url };
    }
    if (hostname === 'tenor.com') {
      return { type: 'tenor', url };
    }
    if (hostname === 'twitter.com' || hostname === 'x.com') {
      return { type: 'twitter', url };
    }
    if (hostname.includes('tiktok.com')) {
      return { type: 'tiktok', url };
    }
    if (hostname.includes('instagram.com')) {
      return { type: 'instagram', url };
    }
    if (/\.(jpeg|jpg|gif|png|webp)$/i.test(url)) {
      return { type: 'image', url };
    }
    if (/\.(mp4|mov|webm)$/i.test(url)) {
      return { type: 'video', url };
    }

    return { type: 'link', url };
  } catch (error) {
    console.error('Failed to parse embed URL:', error);
    return null;
  }
}
