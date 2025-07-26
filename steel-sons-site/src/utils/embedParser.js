export function parseEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = parsedUrl.searchParams.get('v') || parsedUrl.pathname.split('/')[1];
      return videoId ? {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${videoId}`, // Standard YouTube embed URL
      } : null;
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      const id = parsedUrl.pathname.split('/').pop();
      return id ? {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${id}`, // Standard Vimeo embed URL
      } : null;
    }

    // Twitter/X normalization
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    const match = url.match(/status\/(\d+)/);
    if (match) {
        return {
        type: 'twitter',
        url: `https://twitter.com/i/web/status/${match[1]}`, // 👈 Canonical embed format
        };
    }

    // Giphy
    if (hostname.includes('giphy.com') || hostname.includes('media.giphy.com')) {
      return {
        type: 'giphy',
        url: url,
      };
    }

    // Tenor
    if (hostname.includes('tenor.com')) {
      return {
        type: 'tenor',
        url: url,
      };
    }

    // TikTok
    if (hostname.includes('tiktok.com')) {
      return {
        type: 'tiktok',
        url: url,
      };
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      return {
        type: 'instagram',
        url: url,
      };
    }

    // Direct image
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) {
      return {
        type: 'image',
        url: url,
      };
    }

    // Direct video
    if (/\.(mp4|mov|webm)$/i.test(url)) {
      return {
        type: 'video',
        url: url,
      };
    }

    // Unknown: treat as fallback link
    return {
      type: 'link',
      url: url,
    };
  } catch (err) {
    console.error('Failed to parse embed URL:', url, err);
    return null;
  }
}
