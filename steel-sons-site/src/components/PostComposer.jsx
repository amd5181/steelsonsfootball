import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { parseEmbedUrl } from '../utils/embedParser';

const CLOUD_NAME = 'dsvpfi9te';
const UPLOAD_PRESET = 'my_forum_uploads';

export default function PostComposer({ onPost }) {
  const [postType, setPostType] = useState('general');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [giving, setGiving] = useState('');
  const [seeking, setSeeking] = useState('');
  const [notes, setNotes] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items;
    const html = event.clipboardData?.getData('text/html');

    // Step 1: Try parsing <img> src from clipboard HTML
    if (html) {
      const match = html.match(/<img[^>]+src="([^">]+\.gif[^">]*)"/i);
      if (match && match[1]) {
        const gifUrl = match[1];

        try {
          const response = await fetch(gifUrl, { mode: 'cors' });
          const blob = await response.blob();
          const file = new File([blob], 'pasted.gif', { type: 'image/gif' });
          setFile(file);
          return;
        } catch (err) {
          console.error('Failed to fetch pasted gif:', err);
        }
      }
    }

    // Step 2: Fall back to clipboard image blob
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            setFile(pastedFile);
          }
        }
      }
    }
  };


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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    let payload = {
      name: name.trim(),
      createdAt: Date.now(),
      type: postType,
      reactions: { '❤️': 0, '😂': 0, '🔥': 0, '👎': 0 },
      comments: [],
    };

    if (postType === 'general') {
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

      const embed = embedUrl.trim() ? parseEmbedUrl(embedUrl.trim()) : null;

      payload = {
        ...payload,
        text: text.trim(),
        mediaUrl: media?.url || null,
        mediaType: media?.type || null,
        embed: embed || null,
      };
    }

    if (postType === 'trade') {
      if (!giving.trim() && !seeking.trim() && !notes.trim()) {
        setError('Trade Block must include at least one field');
        return;
      }
      payload = {
        ...payload,
        giving: giving.trim(),
        seeking: seeking.trim(),
        notes: notes.trim(),
      };
    }

    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        setError('Poll must include a question');
        return;
      }
      const cleanedOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (cleanedOptions.length < 2) {
        setError('Poll must have at least 2 options');
        return;
      }
      payload = {
        ...payload,
        poll: {
          question: pollQuestion.trim(),
          options: cleanedOptions.map((text) => ({
            text,
            votes: [],
          })),
        },
      };
    }

    try {
      await addDoc(collection(db, 'posts'), payload);
    } catch (err) {
      setError('Failed to save post');
      setUploading(false);
      return;
    }

    setName('');
    setText('');
    setFile(null);
    setEmbedUrl('');
    setGiving('');
    setSeeking('');
    setNotes('');
    setPollQuestion('');
    setPollOptions(['', '']);
    setUploading(false);
    onPost?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // The following line has been added to reload the page on successful post.
    // This is a forceful reload. The `onPost?.()` prop is the recommended
    // way to trigger a data refresh in the parent component for a smoother
    // user experience.
    window.location.reload();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-4 max-w-2xl mx-auto mt-6 space-y-4"
    >
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-center space-x-2 border-b border-gray-200 mb-4">
        {[
          { label: 'General Post', value: 'general' },
          { label: 'Trade Block', value: 'trade' },
          { label: 'Poll', value: 'poll' },
        ].map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPostType(value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150 ${
              postType === value
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Your name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        required
      />

      {postType === 'general' && (
        <>
          <textarea
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={3}
          />

          {file && (
            <div className="relative w-32 h-32 mt-2">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-full h-full object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute -top-2 -right-2 bg-white text-red-600 border border-gray-300 rounded-full text-xs px-2 py-1 shadow-sm"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0])}
            className="text-sm"
          />
          <input
            type="url"
            placeholder="Embed a URL (Instagram, Twitter, Youtube, URL)"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </>
      )}

      {postType === 'trade' && (
        <>
          <input
            type="text"
            placeholder="Player(s)/Position(s) Giving Away"
            value={giving}
            onChange={(e) => setGiving(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Player(s)/Position(s) Seeking"
            value={seeking}
            onChange={(e) => setSeeking(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Comments, deadline, or other details"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={3}
          />
        </>
      )}

      {postType === 'poll' && (
        <>
          <input
            type="text"
            placeholder="Poll Question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) =>
                  setPollOptions((prev) =>
                    prev.map((o, idx) => (idx === i ? e.target.value : o))
                  )
                }
                className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPollOptions((prev) => [...prev, ''])}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Option
          </button>
        </>
      )}

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
