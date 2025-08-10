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

// Time in milliseconds for the guest delete window (15 minutes)
const GUEST_DELETE_WINDOW = 15 * 60 * 1000;

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [twitterEmbedFailed, setTwitterEmbedFailed] = useState(false);
  const [instagramEmbedFailed, setInstagramEmbedFailed] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const adminDropdownRef = useRef(null);

  const postRef = doc(db, 'posts', postId);

  // Effect to close dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminDropdownRef]);

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
    }, (error) => {
      console.error("Error fetching post data:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId, onUpdate]);

  useEffect(() => {
    if (mediaType === 'video' && mediaUrl) {
      const basePath = mediaUrl.split('/upload/')[1]?.replace(/\.(mp4|mov)$/i, '');
      const hlsUrl = `https://res.cloudinary.com/dsvpfi9te/video/upload/sp_auto/${basePath}.m3u8`;
      const poster = `https://res.cloudinary.com/dsvpfi9te/video/upload/so_0/${basePath}.jpg`;

      setPosterUrl(poster);

      fetch(hlsUrl, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            setVideoSource(hlsUrl);
            setVideoType('application/x-mpegURL');
          } else {
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

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player !== player) {
      currentPlayingPlayerInfo.player.pause();
      currentPlayingPlayerInfo.setShowOverlay(true);
      currentPlayingPlayerInfo.player.muted(true);
    }

    if (player.paused()) {
      player.play().then(() => {
        player.muted(false);
        player.poster(''); // Only remove poster on successful play
        setShowPlayOverlay(false);
        currentPlayingPlayerInfo = { player, setShowOverlay: setShowPlayOverlay };
      }).catch(err => {
        console.error('Video play error:', err);
        // On error, restore the poster and show the overlay
        player.poster(posterUrl);
        setShowPlayOverlay(true);
        currentPlayingPlayerInfo = null;
      });
    } else {
      player.pause();
      setShowPlayOverlay(true);
      player.muted(true);
      player.poster(posterUrl); // Restore poster on pause
      currentPlayingPlayerInfo = null;
    }
  }, [posterUrl]);

  useEffect(() => {
    // Check if the component has a video, a ref, and a valid source
    if (mediaType === 'video' && videoRef.current && videoSource) {
      // If the player doesn't exist, create it.
      if (!playerRef.current) {
        playerRef.current = videojs(videoRef.current, {
          controls: false,
          autoplay: false,
          preload: 'auto',
          responsive: true,
          fill: true,
          loop: true,
          muted: true,
          poster: posterUrl,
        });

        // Add event listeners for play/pause and interaction
        const player = playerRef.current;
        const videoElement = player.el().querySelector('video');

        const handleInteraction = (e) => {
          e.preventDefault();
          e.stopPropagation();
          togglePlay();
        };

        if (videoElement) {
          videoElement.addEventListener('click', handleInteraction);
          videoElement.addEventListener('touchend', handleInteraction);
        }

        player.on('play', () => setShowPlayOverlay(false));
        player.on('pause', () => setShowPlayOverlay(true));
        setShowPlayOverlay(true);

      } else {
        // If the player already exists, simply update its source
        playerRef.current.src({
          src: videoSource,
          type: videoType,
        });
        playerRef.current.poster(posterUrl);
      }
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        // Remove event listeners before disposing
        const player = playerRef.current;
        const videoElement = player.el().querySelector('video');
        if (videoElement) {
          videoElement.removeEventListener('click', () => {});
          videoElement.removeEventListener('touchend', () => {});
        }
        player.dispose(); // Dispose of the player
        playerRef.current = null;
      }
      // Clean up global state if this was the playing video
      if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player === playerRef.current) {
        currentPlayingPlayerInfo = null;
      }
    };
  }, [videoSource, videoType, mediaType, posterUrl, togglePlay]);

  useEffect(() => {
    if (embed?.type === 'twitter') {
      const loadTwitterWidgets = () => {
        if (window.twttr && window.twttr.widgets) {
          const targetElement = document.getElementById(`tweet-embed-${postId}`);
          setTimeout(() => {
            if (targetElement) {
              window.twttr.widgets.load(targetElement)
                .then((el) => {
                  setTwitterEmbedFailed(false);
                })
                .catch((err) => {
                  console.error("Error loading Twitter widget for postId:", postId, err);
                  setTwitterEmbedFailed(true);
                });
            } else {
              setTwitterEmbedFailed(true);
            }
          }, 100);
        } else {
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
          setTwitterEmbedFailed(true);
        };
      } else {
        loadTwitterWidgets();
      }
    }
  }, [embed, postId]);

  useEffect(() => {
    if (embed?.type === 'instagram') {
      const loadInstagramWidgets = () => {
        if (window.instgrm && window.instgrm.Embeds) {
          setTimeout(() => {
            try {
              window.instgrm.Embeds.process();
              setInstagramEmbedFailed(false);
            } catch (err) {
              console.error("Error processing Instagram widget for postId:", postId, err);
              setInstagramEmbedFailed(true);
            }
          }, 100);
        } else {
          setInstagramEmbedFailed(true);
        }
      };

      if (typeof window.instgrm === 'undefined') {
        const script = document.createElement('script');
        script.setAttribute('src', 'https://www.instagram.com/embed.js');
        script.setAttribute('async', '');
        script.setAttribute('charset', 'utf-8');
        document.body.appendChild(script);
        script.onload = () => {
          loadInstagramWidgets();
        };
        script.onerror = (e) => {
          setInstagramEmbedFailed(true);
        };
      } else {
        loadInstagramWidgets();
      }
    }
  }, [embed, postId]);

  const handleReaction = async (emoji) => {
    try {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: increment(1),
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) - 1 }));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      text: newComment.trim(),
      createdAt: Date.now(),
      id: crypto.randomUUID(),
    };

    const updated = [...comments, comment];
    setComments(updated);
    setNewComment('');

    try {
      await updateDoc(postRef, {
        comments: updated,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      setComments(comments);
    }
  };

  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    try {
      await deleteDoc(postRef);
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleResetReactions = async () => {
    try {
      await updateDoc(postRef, { reactions: EMOJI_SET });
      setReactions(EMOJI_SET);
    } catch (error) {
      console.error("Error resetting reactions:", error);
    }
    setShowAdminDropdown(false); // Close the dropdown after action
  };

  const handleDeleteComment = async (commentId) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    try {
      await updateDoc(postRef, { comments: updated });
    } catch (error) {
      console.error("Error deleting comment:", error);
      setComments(comments);
    }
  };

  // Determine if the post can be deleted by a non-admin.
  const isWithinTimeWindow = (Date.now() - createdAt) <= GUEST_DELETE_WINDOW;
  const canDelete = access === 'admin' || isWithinTimeWindow;

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
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
          <blockquote className="tiktok-embed" cite={url} data-video-id="" style={{ maxWidth: '605px', margin: '0 auto' }}>
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
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
          <video src={url} controls className="w-full rounded-lg max-h-[700px]" playsInline />
        </div>
      );
    }

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

      <div className="flex justify-between items-start mb-2">
        <div className="text-sm uppercase font-bold tracking-wide text-rose-500">
          {name}
        </div>

        <div className="flex items-center gap-2">
          {createdAt && (
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {formatDate(createdAt)}
            </div>
          )}

          {/* Delete button, visible for a 15-minute window or for admins */}
          {canDelete && (
            <button
              onClick={handleDeletePost}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete post"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" x2="10" y1="11" y2="17"></line>
                <line x1="14" x2="14" y1="11" y2="17"></line>
              </svg>
            </button>
          )}

          {/* Admin-only dropdown */}
          {access === 'admin' && (
            <div className="relative" ref={adminDropdownRef}>
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Admin actions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </button>
              {showAdminDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <button
                      onClick={handleResetReactions}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Clear Reactions
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line mt-2">{text}</p>

      {mediaUrl && (
        <div className="mt-4 rounded-lg overflow-hidden relative">
          {mediaType === 'video' && videoSource ? (
            <div
              className={`relative w-full transition-[max-height] duration-300 ease-out
                ${showPlayOverlay ? 'max-h-[85svh]' : 'max-h-[85svh]'} md:max-h-[700px]`}
            >
              <div
                className={`relative w-full transition-[height] duration-300 ease-out
                  ${showPlayOverlay ? 'h-[52svh]' : 'h-[88svh]'} md:h-[700px]`}
              >
                <div data-vjs-player className="absolute inset-0">
                  <video
                    ref={videoRef}
                    className="video-js vjs-fill rounded-lg"
                    style={{ objectFit: 'contain' }}
                    playsInline
                  >
                    <source src={videoSource} type={videoType} />
                  </video>
                </div>

                {showPlayOverlay && (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePlay();
                    }}
                    aria-label="Play video"
                  >
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 84 84" aria-hidden="true">
                      <polygon points="32,24 64,42 32,60" />
                    </svg>
                  </button>
                )}
              </div>
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

      {renderEmbed()}

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
                        setPollData(prev => ({
                          ...prev,
                          options: updatedOptions,
                        }));
                      } catch (error) {
                        console.error("Error voting on poll:", error);
                        setPollData(prev => ({
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
