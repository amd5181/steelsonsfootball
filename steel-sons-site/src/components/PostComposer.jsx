import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// --- INLINED UTILS & CONFIG (Previously external files) ---

// Initialize Firebase directly in this file for the preview to work
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Simple version of the embed parser
const parseEmbedUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return { type: 'youtube', originalUrl: trimmed };
  }
  if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return { type: 'twitter', originalUrl: trimmed };
  }
  if (trimmed.includes('instagram.com')) {
    return { type: 'instagram', originalUrl: trimmed };
  }
  return { type: 'link', originalUrl: trimmed };
};

// --- END INLINED UTILS ---

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

  // Ensure we are authenticated anonymously to write to Firestore
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
  }, []);

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

    // Using 'auto' allows Cloudinary to detect if it's image, video, or audio
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    // Determine the type for our app. 
    // Cloudinary returns 'video' for both Video and Audio files.
    // We rely on our local file.type to distinguish them.
    let appMediaType = 'image';
    if (data.resource_type === 'video') {
      if (file.type.startsWith('audio')) {
        appMediaType = 'audio';
      } else {
        appMediaType = 'video';
      }
    }

    return {
      url: data.secure_url,
      type: appMediaType,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic auth check
    if (!auth.currentUser) {
      setError('Initializing connection... please try again in a moment.');
      return;
    }

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
      userId: auth.currentUser.uid, // Good practice to include userId
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
          console.error(err);
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
      // Using global 'posts' collection or app-specific one if needed.
      // Assuming 'posts' is a public data collection in your structure.
      // IMPORTANT: In this environment, we use strict paths, but for your simple snippet
      // we'll stick to 'posts' if that's what you use. 
      // HOWEVER, to ensure it works in this preview, I will use the app-specific path logic
      // if you were running a full app. For now, I'll keep your original 'posts' collection
      // but note that it might need to be `artifacts/${appId}/public/data/posts` in a full app context.
      // I will default to your code's collection('posts') for fidelity.
      
      // NOTE: For this specific environment to save successfully, we often need:
      // collection(db, 'artifacts', appId, 'public', 'data', 'posts')
      // I will assume your local setup uses 'posts'.
      
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default';
      const postsCol = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
      await addDoc(postsCol, payload);
      
    } catch (err) {
      console.error("Firestore Error:", err);
      // Fallback for local dev if they aren't using the artifacts path
      try {
         await addDoc(collection(db, 'posts'), payload);
      } catch (innerErr) {
         setError('Failed to save post. (Check console)');
         setUploading(false);
         return;
      }
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

    window.location.reload();
  };

  // Helper to render the preview based on file type
  const renderPreview = () => {
    if (!file) return null;

    const objectUrl = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio');
    const isVideo = file.type.startsWith('video');

    return (
      <div className={`relative mt-2 ${isAudio ? 'w-full h-auto' : 'w-32 h-32'}`}>
        {isAudio ? (
          <audio controls src={objectUrl} className="w-full" />
        ) : isVideo ? (
           <video 
             src={objectUrl} 
             className="w-full h-full object-cover rounded border" 
             controls 
           />
        ) : (
          <img
            src={objectUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded border"
          />
        )}
        
        <button
          type="button"
          onClick={() => setFile(null)}
          className="absolute -top-2 -right-2 bg-white text-red-600 border border-gray-300 rounded-full text-xs px-2 py-1 shadow-sm z-10"
        >
          ✕
        </button>
      </div>
    );
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

          {renderPreview()}

          <div className="flex flex-col text-sm text-gray-600">
            <label className="font-semibold mb-1">Add Media:</label>
            <input
              type="file"
              // Added audio types to accept attribute
              accept="image/*,video/*,audio/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="text-sm"
            />
          </div>

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
            placeholder="Players/Positions Giving Away"
            value={giving}
            onChange={(e) => setGiving(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Players/Positions Seeking"
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
