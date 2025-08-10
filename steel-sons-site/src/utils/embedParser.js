export function parseEmbedUrl(rawUrl) {
  try {
    // quick guard
    if (!/^https?:\/\//i.test(rawUrl)) return null;

    const u = new URL(rawUrl);
    let host = u.hostname.toLowerCase();
    const path = u.pathname;
    const clean = (s) => s.replace(/\?.*$/, '').replace(/#.*$/, '');

    // ---- YouTube ----
    if (host.includes('youtube.com') || host === 'youtu.be') {
      // normalize shorts & youtu.be -> videoId
      let videoId = null;
      if (host === 'youtu.be') {
        // youtu.be/<id>(/...)?
        videoId = clean(path).split('/')[1] || null;
      } else {
        // youtube.com
        const sp = u.searchParams;
        videoId = sp.get('v');
        if (!videoId) {
          // /shorts/<id>, /embed/<id>, /watch?v=...
          const parts = clean(path).split('/').filter(Boolean);
          const i = parts.findIndex(p => ['shorts', 'embed', 'v'].includes(p));
          if (i >= 0 && parts[i + 1]) videoId = parts[i + 1];
          // sometimes /live/<id>
          if (!videoId && parts[0] === 'live' && parts[1]) videoId = parts[1];
        }
      }
      return videoId ? { type: 'youtube', url: `https://www.youtube.com/embed/${videoId}` } : null;
    }

    // ---- Vimeo ----
    if (host.includes('vimeo.com')) {
      // use last numeric segment
      const id = clean(path).split('/').filter(Boolean).pop();
      return id ? { type: 'vimeo', url: `https://player.vimeo.com/video/${id}` } : null;
    }

    // ---- Twitter/X ----
    if (host.includes('twitter.com') || host.includes('x.com')) {
      // normalize to twitter.com and canonical /<user>/status/<id>
      const m = clean(rawUrl).match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^/]+\/status\/\d+/i);
      if (m && m[0]) {
        const canonical = m[0].replace(/\/\/(?:www\.)?x\.com/i, '//twitter.com');
        return { type: 'twitter', url: canonical };
      }
      // fallback: treat as link
      return { type: 'link', url: rawUrl };
    }

    // ---- Instagram ----
    if (host.includes('instagram.com')) {
      // normalize host
      if (host === 'm.instagram.com') host = 'www.instagram.com';
      // allow only p/<id>, reel/<id>, tv/<id>
      const parts = clean(path).split('/').filter(Boolean);
      const kind = parts[0];
      const id = parts[1];
      const allowed = ['p', 'reel', 'tv'];
      if (allowed.includes(kind) && id) {
        const canonical = `https://www.instagram.com/${kind}/${id}/`; // trailing slash required
        return { type: 'instagram', url: canonical };
      }
      // anything else (profiles, stories, explore) → just a link
      return { type: 'link', url: rawUrl };
    }

    // ---- TikTok ----
    if (host.includes('tiktok.com')) {
      // keep the clean permalink; widget script consumes the original URL
      const canonical = clean(rawUrl);
      return { type: 'tiktok', url: canonical };
    }

    // ---- Giphy ----
    if (host.includes('giphy.com') || host.includes('media.giphy.com')) {
      return { type: 'giphy', url: clean(rawUrl) };
    }

    // ---- Tenor ----
    if (host.includes('tenor.com')) {
      return { type: 'tenor', url: clean(rawUrl) };
    }

    // ---- Direct image ----
    if (/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(rawUrl)) {
      return { type: 'image', url: clean(rawUrl) };
    }

    // ---- Direct video ----
    if (/\.(mp4|mov|webm)(\?.*)?$/i.test(rawUrl)) {
      return { type: 'video', url: clean(rawUrl) };
    }

    // Fallback
    return { type: 'link', url: rawUrl };
  } catch (err) {
    console.error('Failed to parse embed URL:', rawUrl, err);
    return null;
  }
}
