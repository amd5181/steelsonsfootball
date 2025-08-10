
import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {
  doc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot, // Import onSnapshot for real-time updates
} from 'firebase/firestore';
// Assuming db is initialized elsewhere, e.g., in a separate firebase.js
// import { initializeApp } from 'firebase/app'; // Not needed here as db is imported
import { db } from '../lib/firebase'; // Assuming db is initialized elsewhere
import { parseEmbedUrl } from '../utils/embedParser';


// Global variable to track the currently playing video.
// For a more robust solution in a larger app, consider using React Context API.
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for custom delete confirmation
  const [isLoading, setIsLoading] = useState(true); // Loading state for post data
  const [twitterEmbedFailed, setTwitterEmbedFailed] = useState(false); // State to track Twitter embed failure
  const [instagramEmbedFailed, setInstagramEmbedFailed] = useState(false); // State to track Instagram embed failure

  // NEW: State to track touch start position for distinguishing taps from scrolls
  const touchStartPos = useRef({ x: 0, y: 0 });

  const postRef = doc(db, 'posts', postId);

  // Effect to fetch initial post data and set up real-time listener
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(postRef, (snap) => {
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
          setTradeData(null); // Clear trade data if post type changes
        }

        if (data.type === 'poll') {
          setPollData(data.poll);
          // Check localStorage for vote status. Note: localStorage is client-side only.
          const voted = localStorage.getItem(`voted-${postId}`);
          setHasVoted(!!voted);
        } else {
          setPollData(null); // Clear poll data if post type changes
        }

        const fromFirestore = data.reactions || {};
        const mergedReactions = { ...EMOJI_SET, ...fromFirestore };
        setReactions(mergedReactions);
        setComments(data.comments || []);
        setEmbed(data.embed || null);
        console.log("PostCard - Fetched embed data:", data.embed); // Log embed data
        setTwitterEmbedFailed(false); // Reset failure state on new data
        setInstagramEmbedFailed(false); // Reset failure state for Instagram
      } else {
        // Handle case where post might have been deleted
        console.log("Post does not exist or has been deleted.");
        // Optionally, trigger onUpdate to remove the card from the UI
        onUpdate?.();
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching post data:", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [postId, onUpdate]); // onUpdate added as dependency for cleanup if it changes

  // Effect to handle video source and type detection
  useEffect(() => {
    if (mediaType === 'video' && mediaUrl) {
      const basePath = mediaUrl.split('/upload/')[1]?.replace(/\.(mp4|mov)$/i, '');
      const hlsUrl = `https://res.cloudinary.com/dsvpfi9te/video/upload/sp_auto/${basePath}.m3u8`;
      const poster = `https://res.cloudinary.com/dsvpfi9te/video/upload/so_0/${basePath}.jpg`;

      setPosterUrl(poster);

      // Check for HLS availability first
      fetch(hlsUrl, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            setVideoSource(hlsUrl);
            setVideoType('application/x-mpegURL');
          } else {
            // Fallback to original MP4 if HLS is not available
            setVideoSource(mediaUrl);
            setVideoType('video/mp4');
          }
        })
        .catch(error => {
          console.error('Error checking HLS source, falling back to MP4:', error);
          setVideoSource(mediaUrl);
          setVideoType('video/mp4');
        });
    }
  }, [mediaUrl, mediaType]);

  // Callback to toggle video play/pause
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    // Pause any other currently playing video
    if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player !== player) {
      currentPlayingPlayerInfo.player.pause();
      currentPlayingPlayerInfo.setShowOverlay(true);
      currentPlayingPlayerInfo.player.muted(true); // Mute when pausing others
    }

    if (player.paused()) {
      player.play().then(() => {
        player.muted(false); // Unmute when playing
        player.poster(''); // Hide poster after play starts
        setShowPlayOverlay(false);
        currentPlayingPlayerInfo = { player, setShowOverlay: setShowPlayOverlay };
      }).catch(err => {
        console.error('Video play error:', err);
        setShowPlayOverlay(true); // Show overlay if play fails
      });
    } else {
      player.pause();
      setShowPlayOverlay(true);
      player.muted(true); // Mute when paused
      currentPlayingPlayerInfo = null;
    }
  }, []);

  // Effect to initialize and manage video.js player
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current && videoSource) {
      if (!playerRef.current) {
        // Initialize video.js player
        playerRef.current = videojs(videoRef.current, {
          controls: false, // Custom controls via overlay
          autoplay: false,
          preload: 'auto',
          responsive: true,
          fluid: true,
          loop: true,
          muted: true, // Start muted to allow autoplay without user interaction
          poster: posterUrl,
        });

        const player = playerRef.current;
        const videoElement = player.el().querySelector('video');

        // NEW: Event handlers for more deliberate touch detection on mobile
        const handleTouchStart = (e) => {
            // Store the initial touch position
            touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        const handleTouchEnd = (e) => {
            // Get the final touch position
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            // Calculate the distance moved
            const dx = Math.abs(endX - touchStartPos.current.x);
            const dy = Math.abs(endY - touchStartPos.current.y);

            // Define a small threshold to distinguish a tap from a scroll
            const touchThreshold = 10; // in pixels

            if (dx < touchThreshold && dy < touchThreshold) {
                // If the movement was minimal, treat it as a deliberate tap
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
            }
        };

        // Add event listeners to the video element
        if (videoElement) {
          // Add touch event listeners to the video element itself
          videoElement.addEventListener('touchstart', handleTouchStart);
          videoElement.addEventListener('touchend', handleTouchEnd);
          // Keep the click listener for desktop users
          videoElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          });
        }

        // Update overlay state based on player events
        player.on('play', () => setShowPlayOverlay(false));
        player.on('pause', () => setShowPlayOverlay(true));
        setShowPlayOverlay(true); // Ensure overlay is shown initially
      } else {
        // Update video source if it changes
        if (playerRef.current.currentSrc() !== videoSource) {
          playerRef.current.src({ src: videoSource, type: videoType });
          playerRef.current.poster(posterUrl);
          setShowPlayOverlay(true); // Show overlay when source changes
        }
      }
    }

    // Cleanup function for video.js player and event listeners
    return () => {
      if (playerRef.current) {
        const player = playerRef.current;
        const videoElement = player.el().querySelector('video');
        if (videoElement) {
            // Remove event listeners
            videoElement.removeEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
            });
            videoElement.removeEventListener('touchstart', () => {});
            videoElement.removeEventListener('touchend', () => {});
        }
        playerRef.current.dispose(); // Dispose of the video.js player
        playerRef.current = null;
      }
      // Clear global reference if this player was the one currently playing
      if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player === playerRef.current) {
        currentPlayingPlayerInfo = null;
      }
    };
  }, [videoSource, videoType, mediaType, posterUrl, togglePlay]);

  // Effect to handle Twitter widget loading and rendering
  useEffect(() => {
    if (embed?.type === 'twitter') {
      const loadTwitterWidgets = () => {
        if (window.twttr && window.twttr.widgets) {
          const targetElement = document.getElementById(`tweet-embed-${postId}`);
          setTimeout(() => {
            if (targetElement) {
              window.twttr.widgets.load(targetElement)
                .then((el) => {
                  console.log("Twitter widget loaded successfully for postId:", postId, el);
                  setTwitterEmbedFailed(false);
                })
                .catch((err) => {
                  console.error("Error loading Twitter widget for postId:", postId, err);
                  setTwitterEmbedFailed(true);
                });
            } else {
              console.warn("Twitter Embed - Target element not found for postId:", postId);
              setTwitterEmbedFailed(true);
            }
          }, 100);
        } else {
          console.warn("Twitter Embed - window.twttr or window.twttr.widgets not available.");
          setTwitterEmbedFailed(true);
        }
      };

      if (typeof window.twttr === 'undefined') {
        const script = document.createElement('script');
        script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
        script.setAttribute('async', '');
        script.setAttribute('charset', 'utf-8');
        document.body.appendChild(script);
        script.onload = () => {
          loadTwitterWidgets();
        };
        script.onerror = (e) => {
          console.error("Twitter Embed - Failed to load widgets.js script:", e);
          setTwitterEmbedFailed(true);
        };
      } else {
        loadTwitterWidgets();
      }
    }
  }, [embed, postId]);

  // NEW: Effect to handle Instagram widget loading and rendering
  useEffect(() => {
    if (embed?.type === 'instagram') {
      const loadInstagramWidgets = () => {
        // Instagram's script uses window.instgrm.Embeds.process()
        if (window.instgrm && window.instgrm.Embeds) {
          // A small delay to ensure the blockquote is in the DOM before processing
          setTimeout(() => {
            try {
              window.instgrm.Embeds.process();
              console.log("Instagram widget processed successfully for postId:", postId);
              setInstagramEmbedFailed(false);
            } catch (err) {
              console.error("Error processing Instagram widget for postId:", postId, err);
              setInstagramEmbedFailed(true);
            }
          }, 100);
        } else {
          console.warn("Instagram Embed - window.instgrm or window.instgrm.Embeds not available.");
          setInstagramEmbedFailed(true);
        }
      };

      // Check if instgrm object exists, if not, load the script
      if (typeof window.instgrm === 'undefined') {
        console.log("Instagram Embed - Loading embed.js script...");
        const script = document.createElement('script');
        script.setAttribute('src', 'https://www.instagram.com/embed.js');
        script.setAttribute('async', '');
        script.setAttribute('charset', 'utf-8');
        document.body.appendChild(script);
        script.onload = () => {
          console.log("Instagram Embed - embed.js script loaded.");
          loadInstagramWidgets(); // Process widgets once script is loaded
        };
        script.onerror = (e) => {
          console.error("Instagram Embed - Failed to load embed.js script:", e);
          setInstagramEmbedFailed(true);
        };
      } else {
        console.log("Instagram Embed - embed.js script already loaded, attempting to process widgets.");
        loadInstagramWidgets();
      }
    }
  }, [embed, postId]); // Depend on embed and postId to re-run when they change


  /**
   * Handles user reaction to the post.
   * @param {string} emoji - The emoji character reacted with.
   */
  const handleReaction = async (emoji) => {
    try {
      // Optimistic UI update
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: increment(1),
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
      // Revert optimistic update on error
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) - 1 }));
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
      createdAt: Date.now(), // Using Date.now() for simplicity, Firestore Timestamp is also an option
      id: crypto.randomUUID(),
    };

    const updated = [...comments, comment];
    setComments(updated); // Optimistic UI update
    setNewComment('');

    try {
      await updateDoc(postRef, {
        comments: updated,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      // Revert optimistic update on error
      setComments(comments);
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
      onUpdate?.(); // Notify parent component of deletion
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setShowDeleteConfirm(false); // Hide confirmation modal
    }
  };

  /**
   * Resets all reactions on the post.
   */
  const handleResetReactions = async () => {
    try {
      await updateDoc(postRef, { reactions: EMOJI_SET });
      setReactions(EMOJI_SET); // Optimistic UI update
    } catch (error) {
      console.error("Error resetting reactions:", error);
    }
  };

  /**
   * Deletes a specific comment from the post.
   * @param {string} commentId - The ID of the comment to delete.
   */
  const handleDeleteComment = async (commentId) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated); // Optimistic UI update
    try {
      await updateDoc(postRef, { comments: updated });
    } catch (error) {
      console.error("Error deleting comment:", error);
      // Revert optimistic update on error
      setComments(comments);
    }
  };

  /**
   * Renders the embedded content based on its type.
   * This function is called within the JSX.
   */
  const renderEmbed = () => {
    if (!embed) return null;

    let type, url;
    const parsed = parseEmbedUrl(embed.url);
    console.log("renderEmbed - Parsed embed:", parsed); // Log parsed embed
    if (parsed) {
      type = parsed.type;
      url = parsed.url;
    } else {
      console.warn("renderEmbed - Failed to parse embed URL:", embed.url); // Warn if parsing fails
      return null; // skip rendering if it can't be parsed
    }

    if (!type || !url) return null;

    if (type === 'youtube') {
      // The parseEmbedUrl now returns the direct embed URL for YouTube
      return (
        <div className="mt-4">
          <iframe
            className="w-full aspect-video rounded-lg"
            src={url} // Use the directly embeddable URL from parseEmbedUrl
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      );
    }

    if (type === 'vimeo') {
      // The parseEmbedUrl now returns the direct embed URL for Vimeo
      return (
        <div className="mt-4">
          <iframe
            className="w-full aspect-video rounded-lg"
            src={url} // Use the directly embeddable URL from parseEmbedUrl
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
      // Twitter embeds are handled by the twttr.widgets.load() script
      // We need to provide the blockquote element with the full tweet URL in the anchor tag
      console.log("renderEmbed - Rendering Twitter blockquote with URL:", url); // Log Twitter URL

      // Force twitter.com domain for embed to improve reliability
      const twitterDotComUrl = url.replace('x.com', 'twitter.com');
      console.log("renderEmbed - Using twitter.com URL for embed:", twitterDotComUrl);

      return (
        <div className="mt-4">
          {twitterEmbedFailed ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold mb-2">Could not load Twitter post.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Click here to view the post on X.com
              </a>
            </div>
          ) : (
            <div id={`tweet-embed-${postId}`}> {/* Added unique ID for targeted loading */}
              <blockquote className="twitter-tweet" data-dnt="true" data-theme="light">
                {/* The href must be the full, canonical tweet URL for the widget to work */}
                <a href={twitterDotComUrl}></a> {/* Use the forced twitter.com URL here */}
              </blockquote>
            </div>
          )}
        </div>
      );
    }

    if (type === 'tiktok') {
      return (
        <div className="mt-4">
          <blockquote className="tiktok-embed" cite={url} data-video-id="" style={{ maxWidth: '605px', margin: '0 auto' }}>
            <a href={url}></a>
          </blockquote>
        </div>
      );
    }

    if (type === 'instagram') {
      // Instagram embeds are handled by the instgrm.Embeds.process() script
      console.log("renderEmbed - Rendering Instagram blockquote with URL:", url);
      return (
        <div className="mt-4">
          {instagramEmbedFailed ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold mb-2">Could not load Instagram post.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Click here to view the post on Instagram
              </a>
            </div>
          ) : (
            // Instagram's embed script expects a blockquote with specific attributes
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{ width: '100%', margin: '0 auto' }}
            >
              {/* The content inside the blockquote is usually just a link to the post */}
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

    // Fallback to generic clickable link
    return (
      <div className="mt-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
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
            <div data-vjs-player className="relative">
              <video
                ref={videoRef}
                className="video-js rounded-lg w-full max-h-[80vh] sm:max-h-[500px]"
                playsInline
              >
                <source src={videoSource} type={videoType} />
              </video>
              {showPlayOverlay && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-20 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    togglePlay();
                  }}
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
                      // Ensure votes array exists before pushing
                      updatedOptions[idx].votes = [...(updatedOptions[idx].votes || []), Date.now()];

                      try {
                        await updateDoc(postRef, {
                          [`poll.options`]: updatedOptions,
                        });

                        localStorage.setItem(`voted-${postId}`, '1');
                        setHasVoted(true);
                        setPollData(prev => ({
                          ...prev,
                          options: updatedOptions,
                        }));
                      } catch (error) {
                        console.error("Error voting on poll:", error);
                        // Revert optimistic update if there's an error
                        setPollData(prev => ({
                          ...prev,
                          options: pollData.options, // Revert to original options
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
