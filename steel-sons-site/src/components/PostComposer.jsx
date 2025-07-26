import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const CLOUD_NAME = 'dsvpfi9te';
const UPLOAD_PRESET = 'my_forum_uploads';

export default function PostComposer({ onPost }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return {
      url: data.secure_url,
      type: data.resource_type === 'video' ? 'video' : 'image',
    };
  };

  const parseEmbed = (url) => {
    try {
      const u = new URL(url);

      // YouTube
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const id = u.searchParams.get('v') || u.pathname.split('/').pop();
        return {
          type: 'embed-video',
          provider: 'youtube',
          url: `https://www.youtube.com/embed/${id}`,
        };
      }

      // Giphy
      if (u.hostname.includes('giphy.com')) {
        const id = u.pathname.split('/').pop();
        return {
          type: 'embed-image',
          provider: 'giphy',
          url: `https://giphy.com/embed/${id}`,
        };
      }

      // X/Twitter
      if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) {
        return {
          type: 'embed-html',
          provider: 'twitter',
          url: url,
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!text.trim() && !file && !embedUrl.trim()) {
      setError('Post must include text, media, or an embed');
      return;
    }

    setUploading(true);

    let media = null;
    if (file) {
      try {
        media = await handleUpload();
      } catch (err) {
        setError('Upload failed');
        setUploading(false);
        return;
      }
    }

    const embed = embedUrl.trim() ? parseEmbed(embedUrl.trim()) : null;

    try {
      await addDoc(collection(db, 'posts'), {
        name: name.trim(),
        text: text.trim(),
        createdAt: Date.now(),
        mediaUrl: media?.url || null,
        mediaType: media?.type || null,
        reactions: { '❤️': 0, '😂': 0, '🔥': 0, '👎': 0 },
        comments: [],
        embed: embed || null,
      });
    } catch (err) {
      setError('Failed to save post');
      setUploading(false);
      return;
    }

    setName('');
    setText('');
    setFile(null);
    setEmbedUrl('');
    setUploading(false);
    onPost?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 max-w-2xl mx-auto mt-6 space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <input
        type="text"
        placeholder="Your name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        required
      />

      <textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        rows={3}
      />

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0])}
        className="text-sm"
      />

      <input
        type="url"
        placeholder="Embed a URL (YouTube, Giphy, X/Twitter)"
        value={embedUrl}
        onChange={(e) => setEmbedUrl(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />

      {uploading && (
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div className="h-full w-full bg-rose-500 animate-pulse" />
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className={`w-full py-2 px-4 rounded text-white font-semibold ${
          uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'
        }`}
      >
        {uploading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
