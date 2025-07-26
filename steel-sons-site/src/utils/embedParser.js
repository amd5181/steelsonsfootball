export function parseEmbedUrl(input) {
  if (!input) return null;

  const url = input.trim();

  // Handle YouTube
  if (/youtu\.be|youtube\.com/.test(url)) {
    return { type: 'youtube', url };
  }

  // Handle Vimeo
  if (/vimeo\.com/.test(url)) {
    return { type: 'vimeo', url };
  }

  // Handle Giphy
  if (/giphy\.com\/media/.test(url)) {
    return { type: 'giphy', url };
  }

  // Handle Tenor
  if (/tenor\.com\/view/.test(url)) {
    return { type: 'tenor', url };
  }

  // Handle Twitter/X (x.com or twitter.com)
  if (/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/.test(url)) {
    return { type: 'twitter', url };
  }

  // TikTok
  if (/tiktok\.com/.test(url)) {
    return { type: 'tiktok', url };
  }

  // Instagram
  if (/instagram\.com/.test(url)) {
    return { type: 'instagram', url };
  }

  // Direct image
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
    return { type: 'image', url };
  }

  // Direct video
  if (/\.(mp4|mov|webm)$/i.test(url)) {
    return { type: 'video', url };
  }

  // Fallback generic
  return { type: 'link', url };
}
