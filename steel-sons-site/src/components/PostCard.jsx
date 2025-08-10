import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {
  doc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { parseEmbedUrl } from '../utils/embedParser';

// Global variable to track the currently playing video.
let currentPlayingPlayerInfo = null;

// Initial emoji set for reactions
const EMOJI_SET = { '❤️': 0, '😂': 0, '🔥': 0, '👎': 0 };

/**
 * Formats a timestamp into a localized date and time string.
 * @param {number} timestamp - The timestamp to format.
 * @returns {string} The formatted date and time string.
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * PostCard component to display various types of posts (general, trade, poll)
 * with media, reactions, comments, and embeds.
 * @param {object} props - Component props.
 * @param {string} props.name - The name of the post creator.
 * @param {string} props.text - The main text content of the post.
 * @param {number} props.createdAt - The creation timestamp of the post.
 * @param {string} props.mediaUrl - URL of the attached media (image/video).
 * @param {string} props.mediaType - Type of the attached media ('image' or 'video').
 * @param {string} props.postId - The ID of the post in Firestore.
 * @param {string} props.access - User's access level ('admin' or 'user').
 * @param {function} props.onUpdate - Callback function for post updates (e.g., after deletion).
 */
export default function PostCard({
  name,
  text,
  createdAt,
  mediaUrl,
  mediaType,
  postId,
  access,
  onUpdate,
}) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const handlerRef = useRef(null); // stable tap handler reference
  const [videoSource, setVideoSource] = useState(null);
  const [videoType, setVideoType] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const [embed, setEmbed] = useState(null);
  const [postType, setPostType] = useState('general');
  const [tradeData, setTradeData] = useState(null);
  const [pollData, setPollData] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [reactions, setReactions] = useState(EMOJI_SET);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [twitterEmbedFailed, setTwitterEmbedFailed] = useState(false);
  const [instagramEmbedFailed, setInstagramEmbedFailed] = useState(false);
  const [aspect, setAspect] = useState(16 / 9); // lock size from metadata; prevents “blow up”
  const [showPoster, setShowPoster] = useState(true); // draw an <img> until video is actually playing

  const postRef = doc(db, 'posts', postId);

  // Effect to fetch initial post data and set up real-time listener
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      postRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPostType(data.type || 'general');

          if (data.type === 'trade') {
            setTradeData({
              giving: data.giving || '',
              seeking: data.seeking || '',
              notes: data.notes || '',
            });
          } else {
            setTradeData(null);
          }

          if (data.type === 'poll') {
            setPollData(data.poll);
            const voted = localStorage.getItem(`voted-${postId}`);
            setHasVoted(!!voted);
          } else {
            setPollData(null);
          }

          const fromFirestore = data.reactions || {};
          const mergedReactions = { ...EMOJI_SET, ...fromFirestore };
          setReactions(mergedReactions);
          setComments(data.comments || []);
          setEmbed(data.embed || null);
          setTwitterEmbedFailed(false);
          setInstagramEmbedFailed(false);
        } else {
          onUpdate?.();
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching post data:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId, onUpdate]);

  // Source & poster selection with safe Cloudinary parsing
  useEffect(() => {
    if (mediaType !== 'video' || !mediaUrl) {
      setVideoSource(null);
      setVideoType(null);
      setPosterUrl(null);
      setShowPoster(false);
      return;
    }

    const afterUpload = mediaUrl.split('/upload/')[1];
    if (!afterUpload) {
      // Non-standard/unsigned URL: use MP4 directly; we'll still try to keep poster visible until playing
      setPosterUrl(null);
      setVideoSource(mediaUrl);
      setVideoType('video/mp4');
      setShowPoster(true);
      return;
    }

    const basePath = afterUpload.replace(/\.(mp4|mov)$/i, '');
    const hlsUrl = `https://res.cloudinary.com/dsvpfi9te/video/upload/sp_auto/${basePath}.m3u8`;
    const poster = `https://res.cloudinary.com/dsvpfi9te/video/upload/so_0/${basePath}.jpg`;

    setPosterUrl(poster);
    setVideoSource(hlsUrl);
    setVideoType('application/x-mpegURL');
    setShowPoster(true);
  }, [mediaUrl, mediaType]);

  // Gesture-based play/pause toggle that ignores scrolls, with runtime fallback to MP4
  const togglePlayTapAware = useCallback(async (e) => {
    const player = playerRef.current;
    if (!player) return;

    // Pause any other currently playing video
    if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player !== player) {
      currentPlayingPlayerInfo.player.pause();
      currentPlayingPlayerInfo.setShowOverlay(true);
      currentPlayingPlayerInfo.player.muted(true);
    }

    if (player.paused()) {
      try {
        await player.play();
        setShowPlayOverlay(false);
        currentPlayingPlayerInfo = { player, setShowOverlay: setShowPlayOverlay };
      } catch (err) {
        console.warn('play() rejected; attempting MP4 fallback', err);
        try {
          if (mediaUrl) {
            player.src({ src: mediaUrl, type: 'video/mp4' });
            if (posterUrl) player.poster(posterUrl);
            await player.play();
            setShowPlayOverlay(false);
            currentPlayingPlayerInfo = { player, setShowOverlay: setShowPlayOverlay };
          }
        } catch (err2) {
          console.error('Fallback play failed:', err2);
          setShowPlayOverlay(true);
      }
    } else {
      player.pause();
      setShowPlayOverlay(true);
      player.muted(true);
      currentPlayingPlayerInfo = null;
    }
  }, [mediaUrl, posterUrl]);

  // Initialize and manage video.js player
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current || !videoSource) return;

    if (!playerRef.current) {
      // Initialize player with conservative, mobile-friendly defaults
      playerRef.current = videojs(videoRef.current, {
        controls: false, // we use our overlay
        autoplay: false,
        preload: 'metadata',
        responsive: true,
        fluid: true, // video.js maintains an internal ratio; we also set CSS aspect-ratio wrapper
        loop: true,
        muted: true, // allow autoplay after tap
        poster: posterUrl || undefined,
        // html5: { vhs: { overrideNative: true } }, // uncomment if Android Chrome has native HLS quirks
      });

      const player = playerRef.current;

      // Always set source via API (not <source> tag)
      player.src({ src: videoSource, type: videoType });

      // Keep overlay state in sync
      player.on('play', () => {
        setShowPlayOverlay(false);
        setShowPoster(false);
      });
      player.on('pause', () => setShowPlayOverlay(true));

      // Unmute only after playback actually starts (avoids iOS rejection)
      player.one('playing', () => {
        try { player.muted(false); } catch {}
        setShowPoster(false);
      });

      // Derive aspect ratio once metadata is ready; locks layout before/after play
      player.one('loadedmetadata', () => {
        try {
          const el = player.el().querySelector('video');
          if (el && el.videoWidth && el.videoHeight) {
            const ar = el.videoWidth / el.videoHeight;
            setAspect(ar > 0 ? ar : 16 / 9);
          }
        } catch (err) {
          setAspect(16 / 9);
        }
      });

      // Robust fallback: if HLS fails, swap to MP4 once
      const handleError = async () => {
        const err = player.error();
        console.warn('Video.js error:', err);
        try {
          // If already MP4, do nothing
          if (player.currentType && player.currentType() === 'video/mp4') return;
          if (mediaUrl) {
            player.src({ src: mediaUrl, type: 'video/mp4' });
            if (posterUrl) player.poster(posterUrl);
            await player.play().catch(() => {});
          }
        } catch {}
      };
      player.on('error', handleError);

      // Build a tap-aware handler once and keep it stable
      handlerRef.current = (() => {
        let startX = 0, startY = 0, startT = 0, moved = false;

        const onPointerDown = (ev) => {
          startX = ev.clientX ?? (ev.touches?.[0]?.clientX || 0);
          startY = ev.clientY ?? (ev.touches?.[0]?.clientY || 0);
          startT = Date.now();
          moved = false;
        };

        const onPointerMove = (ev) => {
          const x = ev.clientX ?? (ev.touches?.[0]?.clientX || 0);
          const y = ev.clientY ?? (ev.touches?.[0]?.clientY || 0);
          if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) moved = true;
        };

        const onPointerUp = (ev) => {
          const dur = Date.now() - startT;
          const x = ev.clientX ?? (ev.changedTouches?.[0]?.clientX || 0);
          const y = ev.clientY ?? (ev.changedTouches?.[0]?.clientY || 0);

          if (!moved && dur < 300) {
            const rect = player.el().getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
              togglePlayTapAware(ev);
            }
          }
        };

        return { onPointerDown, onPointerMove, onPointerUp };
      })();

      const videoEl = player.el().querySelector('video');
      if (videoEl) {
        // CORS + inline playback hints
        videoEl.setAttribute('crossorigin', 'anonymous');
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');

        // Use pointer/touch listeners tuned for mobile scroll behavior
        videoEl.addEventListener('touchstart', handlerRef.current.onPointerDown, { passive: true });
        videoEl.addEventListener('touchmove', handlerRef.current.onPointerMove, { passive: true });
        videoEl.addEventListener('touchend', handlerRef.current.onPointerUp, { passive: true });
        videoEl.addEventListener('mousedown', handlerRef.current.onPointerDown);
        videoEl.addEventListener('mousemove', handlerRef.current.onPointerMove);
        videoEl.addEventListener('mouseup', handlerRef.current.onPointerUp);
        // Hint to browsers: vertical pan allowed (don’t treat as pinch/zoom area)
        videoEl.style.touchAction = 'pan-y';
      }
      }
    } else {
      // Update source when it changes
      const player = playerRef.current;
      if (player.currentSrc() !== videoSource) {
        player.src({ src: videoSource, type: videoType });
        if (posterUrl) player.poster(posterUrl);
        setShowPlayOverlay(true);
      }
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        const player = playerRef.current;
        const videoEl = player.el()?.querySelector('video');

        if (videoEl && handlerRef.current) {
          videoEl.removeEventListener('touchstart', handlerRef.current.onPointerDown);
          videoEl.removeEventListener('touchmove', handlerRef.current.onPointerMove);
          videoEl.removeEventListener('touchend', handlerRef.current.onPointerUp);
          videoEl.removeEventListener('mousedown', handlerRef.current.onPointerDown);
          videoEl.removeEventListener('mousemove', handlerRef.current.onPointerMove);
          videoEl.removeEventListener('mouseup', handlerRef.current.onPointerUp);
        }

        // If this player was active, clear global ref
        if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player === player) {
          currentPlayingPlayerInfo = null;
        }
        player.dispose();
        playerRef.current = null;
        handlerRef.current = null;
      }
    };
  }, [videoSource, videoType, mediaType, posterUrl, togglePlayTapAware, mediaUrl]);

  // Twitter widgets
  useEffect(() => {
    if (embed?.type !== 'twitter') return;

    const loadTwitterWidgets = () => {
      const targetElement = document.getElementById(`tweet-embed-${postId}`);
      if (!targetElement) {
        setTwitterEmbedFailed(true);
        return;
      }
      try {
        if (window.twttr?.widgets?.load) {
          window.twttr.widgets
            .load(targetElement)
            .then(() => setTwitterEmbedFailed(false))
            .catch((err) => {
              console.error('Twitter load error:', err);
              setTwitterEmbedFailed(true);
            });
        } else {
          setTwitterEmbedFailed(true);
        }
      } catch (e) {
        setTwitterEmbedFailed(true);
      }
    };

    if (typeof window.twttr === 'undefined') {
      const script = document.createElement('script');
      script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
      script.setAttribute('async', '');
      script.setAttribute('charset', 'utf-8');
      document.body.appendChild(script);
      script.onload = loadTwitterWidgets;
      script.onerror = () => setTwitterEmbedFailed(true);
    } else {
      loadTwitterWidgets();
    }
  }, [embed, postId]);

  // Instagram widgets
  useEffect(() => {
    if (embed?.type !== 'instagram') return;

    const process = () => {
      try {
        if (window.instgrm?.Embeds?.process) {
          window.instgrm.Embeds.process();
          setInstagramEmbedFailed(false);
        } else {
          setInstagramEmbedFailed(true);
        }
      } catch (e) {
        setInstagramEmbedFailed(true);
      }
    };

    if (typeof window.instgrm === 'undefined') {
      const script = document.createElement('script');
      script.setAttribute('src', 'https://www.instagram.com/embed.js');
      script.setAttribute('async', '');
      script.setAttribute('charset', 'utf-8');
      document.body.appendChild(script);
      script.onload = process;
      script.onerror = () => setInstagramEmbedFailed(true);
    } else {
      process();
    }
  }, [embed, postId]);

  /**
   * Handles user reaction to the post.
   * @param {string} emoji - The emoji character reacted with.
   */
  const handleReaction = async (emoji) => {
    try {
      setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: increment(1),
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      setReactions((prev) => ({
        ...prev,
        [emoji]: Math.max((prev[emoji] || 1) - 1, 0),
      }));
    }
  };

  /**
   * Handles submission of a new comment.
   * @param {Event} e - The form submission event.
   */
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      text: newComment.trim(),
      createdAt: Date.now(),
      id: crypto.randomUUID(),
    };

    const prev = comments;
    const updated = [...prev, comment];
    setComments(updated);

    setNewComment('');

    try {
      await updateDoc(postRef, {
        comments: updated,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setComments(prev);
    }
  };

  /**
   * Initiates the post deletion process, showing a confirmation modal.
   */
  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Confirms and performs post deletion.
   */
  const confirmDeletePost = async () => {
    try {
      await deleteDoc(postRef);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  /**
   * Resets all reactions on the post.
   */
  const handleResetReactions = async () => {
    try {
      await updateDoc(postRef, { reactions: EMOJI_SET });
      setReactions(EMOJI_SET);
    } catch (error) {
      console.error('Error resetting reactions:', error);
    }
  };

  /**
   * Deletes a specific comment from the post.
   * @param {string} commentId - The ID of the comment to delete.
   */
  const handleDeleteComment = async (commentId) => {
    const prev = comments;
    const updated = prev.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      await updateDoc(postRef, { comments: updated });
    } catch (error) {
      console.error('Error deleting comment:', error);
      setComments(prev);
    }
  };

  /**
   * Renders the embedded content based on its type.
   */
  const renderEmbed = () => {
    if (!embed) return null;

    let type, url;
    const parsed = parseEmbedUrl(embed.url);
    if (parsed) {
      type = parsed.type;
      url = parsed.url;
    } else {
      return null;
    }

    if (!type || !url) return null;

    if (type === 'youtube') {
      return (
        <div className="mt-4">
          <iframe
            className="w-full aspect-video rounded-lg"
            src={url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      );
    }

    if (type === 'vimeo') {
      return (
        <div className="mt-4">
          <iframe
            className="w-full aspect-video rounded-lg"
            src={url}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo video"
          />
        </div>
      );
    }

    if (type === 'giphy' || type === 'tenor') {
      return (
        <div className="mt-4">
          <iframe
            src={url}
            className="w-full h-64 rounded-lg"
            frameBorder="0"
            allowFullScreen
            title={`${type} embed`}
          />
        </div>
      );
    }

    if (type === 'twitter') {
      const twitterDotComUrl = url.replace('x.com', 'twitter.com');
      return (
        <div className="mt-4">
          {twitterEmbedFailed ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold mb-2">Could not load Twitter post.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Click here to view the post on X.com
              </a>
            </div>
          ) : (
            <div id={`tweet-embed-${postId}`}>
              <blockquote className="twitter-tweet" data-dnt="true" data-theme="light">
                <a href={twitterDotComUrl}></a>
              </blockquote>
            </div>
          )}
        </div>
      );
    }

    if (type === 'tiktok') {
      return (
        <div className="mt-4">
          <blockquote
            className="tiktok-embed"
            cite={url}
            data-video-id=""
            style={{ maxWidth: '605px', margin: '0 auto' }}
          >
            <a href={url}></a>
          </blockquote>
        </div>
      );
    }

    if (type === 'instagram') {
      return (
        <div className="mt-4">
          {instagramEmbedFailed ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold mb-2">Could not load Instagram post.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Click here to view the post on Instagram
              </a>
            </div>
          ) : (
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{ width: '100%', margin: '0 auto' }}
            >
              <a href={url} target="_blank" rel="noopener noreferrer"></a>
            </blockquote>
          )}
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div className="mt-4">
          <img src={url} alt="Embedded content" className="w-full rounded-lg object-cover" />
        </div>
      );
    }

    if (type === 'video') {
      return (
        <div className="mt-4">
          <video src={url} controls className="w-full rounded-lg max-h-[500px]" playsInline />
        </div>
      );
    }

    return (
      <div className="mt-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          View Embedded Link
        </a>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border-l-8 border-rose-400 relative animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="flex items-center gap-3 mt-4">
          <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border-l-8 border-rose-400 relative font-sans">
      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg font-semibold mb-4">Are you sure you want to delete this post?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDeletePost}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {access === 'admin' && (
        <div className="absolute top-3 right-3">
          <details className="relative">
            <summary className="cursor-pointer text-xl text-gray-400 hover:text-rose-500">⋮</summary>
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-md rounded-md p-2 text-sm z-50 space-y-2">
              <button onClick={handleDeletePost} className="w-full text-left text-red-600 hover:underline">Delete Post</button>
              <button onClick={handleResetReactions} className="w-full text-left hover:underline">Reset Reactions</button>
            </div>
          </details>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="text-sm uppercase font-bold tracking-wide text-rose-500">
          {name}
        </div>
        {createdAt && (
          <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
            {formatDate(createdAt)}
          </div>
        )}
      </div>

      <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line mt-2">{text}</p>

      {mediaUrl && (
        <div className="mt-4 rounded-lg overflow-hidden relative">
          {mediaType === 'video' && videoSource ? (
            // Size is pre-locked via CSS aspect-ratio; no “blow up” on play.
            <div
              className="relative rounded-lg"
              style={{ aspectRatio: aspect || 16 / 9, width: '100%' }}
            >
              {/* Poster image stays on top until playback actually starts */}
              {showPoster && (
                <img
                  src={posterUrl || ''}
                  alt="video poster"
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      const ar = img.naturalWidth / img.naturalHeight;
                      if (ar > 0) setAspect(ar);
                    }
                  }}
                  onError={() => setShowPoster(false)}
                />
              )}

              <div data-vjs-player className="absolute inset-0">
                <video
                  ref={videoRef}
                  className="video-js rounded-lg w-full h-full object-cover"
                  playsInline
                />
              </div>
              {showPlayOverlay && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-20 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    togglePlayTapAware(e);
                  }}
                  style={{ touchAction: 'pan-y' }}
                >
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 84 84" aria-label="Play video"><polygon points="32,24 64,42 32,60" /></svg>
                </div>
              )}
            </div>
          ) : (
            mediaType === 'image' && (
              <img
                src={mediaUrl}
                alt="uploaded media"
                className="w-full rounded-lg object-cover"
              />
            )
          )}
        </div>
      )}

      {/* Embed block rendering using the renderEmbed function */}
      {renderEmbed()}

      {/* TRADE BLOCK RENDERING */}
      {postType === 'trade' && tradeData && (
        <div className="mt-4 border rounded-lg p-4 bg-yellow-50">
          <h4 className="text-sm font-bold text-yellow-700 uppercase mb-2">Trade Block</h4>
          {tradeData.giving && (
            <p className="text-sm"><strong>Giving:</strong> {tradeData.giving}</p>
          )}
          {tradeData.seeking && (
            <p className="text-sm"><strong>Seeking:</strong> {tradeData.seeking}</p>
          )}
          {tradeData.notes && (
            <p className="text-sm"><strong>Notes:</strong> {tradeData.notes}</p>
          )}
        </div>
      )}

      {/* POLL RENDERING */}
      {postType === 'poll' && pollData && (
        <div className="mt-4 border rounded-lg p-4 bg-blue-50">
          <h4 className="text-sm font-bold text-blue-700 uppercase mb-2">Poll</h4>
          <p className="text-sm font-semibold text-gray-800 mb-2">{pollData.question}</p>

          {!hasVoted ? (
            <ul className="space-y-2">
              {pollData.options.map((opt, idx) => (
                <li key={idx}>
                  <button
                    onClick={async () => {
                      const updatedOptions = [...pollData.options];
                      updatedOptions[idx].votes = [...(updatedOptions[idx].votes || []), Date.now()];

                      try {
                        await updateDoc(postRef, {
                          [`poll.options`]: updatedOptions,
                        });

                        localStorage.setItem(`voted-${postId}`, '1');
                        setHasVoted(true);
                        setPollData((prev) => ({
                          ...prev,
                          options: updatedOptions,
                        }));
                      } catch (error) {
                        console.error('Error voting on poll:', error);
                        setPollData((prev) => ({
                          ...prev,
                          options: pollData.options,
                        }));
                      }
                    }}
                    className="w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded transition"
                  >
                    {opt.text}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {pollData.options.map((opt, idx) => {
                const voteCount = opt.votes?.length || 0;
                const totalVotes = pollData.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                const percent = totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0;
                return (
                  <li key={idx} className="bg-white border rounded p-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{opt.text}</span>
                      <span>{voteCount} vote{voteCount !== 1 ? 's' : ''} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded mt-1 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${percent}%` }}></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 text-xl">
        {Object.keys(reactions).map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm hover:scale-105 transition"
          >
            {emoji} {reactions[emoji] || 0}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-1 text-sm focus:ring-rose-500 focus:border-rose-500"
          />
          <button type="submit" className="text-rose-500 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-rose-50 transition">
            Post
          </button>
        </form>

        <ul className="mt-3 space-y-1 text-sm text-gray-700">
          {comments.map((c) => (
            <li key={c.id} className="bg-gray-100 rounded-md p-2 flex justify-between items-center">
              <span>{c.text}</span>
              {access === 'admin' && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="ml-2 text-red-500 text-xs hover:underline"
                  aria-label="Delete comment"
                >
                  ✖
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
