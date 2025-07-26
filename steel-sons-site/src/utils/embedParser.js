export function parseEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      const videoId = parsedUrl.searchParams.get('v') || parsedUrl.pathname.split('/')[1];
      return {
        type: 'youtube',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      const id = parsedUrl.pathname.split('/').pop();
      return {
        type: 'vimeo',
        url: `https://vimeo.com/${id}`,
      };
    }

    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      const match = url.match(/status\/(\d+)/);
      if (match) {
        return {
          type: 'twitter',
          url: `https://twitter.com/i/web/status/${match[1]}`,
        };
      }
    }

    // Giphy
    if (hostname.includes('giphy.com') || hostname.includes('media.giphy.com')) {
      return {
        type: 'giphy',
        url,
      };
    }

    // Tenor
    if (hostname.includes('tenor.com')) {
      return {
        type: 'tenor',
        url,
      };
    }

    // TikTok
    if (hostname.includes('tiktok.com')) {
      return {
        type: 'tiktok',
        url,
      };
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      return {
        type: 'instagram',
        url,
      };
    }

    // Direct image
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) {
      return {
        type: 'image',
        url,
      };
    }

    // Direct video
    if (/\.(mp4|mov|webm)$/i.test(url)) {
      return {
        type: 'video',
        url,
      };
    }

    // Unknown: treat as fallback link
    return {
      type: 'link',
      url,
    };
  } catch (err) {
    console.error('Failed to parse embed URL:', url, err);
    return null;
  }
}
