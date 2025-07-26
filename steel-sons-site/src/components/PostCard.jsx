// ... [all your existing imports]
import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

let currentPlayingPlayerInfo = null;
const EMOJI_SET = { '❤️': 0, '😂': 0, '🔥': 0, '👎': 0 };

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

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

  const postRef = doc(db, 'posts', postId);

  useEffect(() => {
    const fetchPostData = async () => {
      const snap = await getDoc(postRef);
      if (snap.exists()) {
        const data = snap.data();
        setPostType(data.type || 'general');

        if (data.type === 'trade') {
          setTradeData({
            giving: data.giving || '',
            seeking: data.seeking || '',
            notes: data.notes || '',
          });
        }

        if (data.type === 'poll') {
          setPollData(data.poll);
          const voted = localStorage.getItem(`voted-${postId}`);
          setHasVoted(!!voted);
        }

        const fromFirestore = data.reactions || {};
        const mergedReactions = { ...EMOJI_SET, ...fromFirestore };
        setReactions(mergedReactions);
        setComments(data.comments || []);
        setEmbed(data.embed || null); // ✅ get embed block
      }
    };
    fetchPostData();
  }, [postId]);

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
        .catch(() => {
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
        player.poster('');
        setShowPlayOverlay(false);
        currentPlayingPlayerInfo = { player, setShowOverlay: setShowPlayOverlay };
      }).catch(err => {
        console.error('Video play error:', err);
        setShowPlayOverlay(true);
      });
    } else {
      player.pause();
      setShowPlayOverlay(true);
      player.muted(true);
      currentPlayingPlayerInfo = null;
    }
  }, []);

  useEffect(() => {
    if (mediaType === 'video' && videoRef.current && videoSource) {
      if (!playerRef.current) {
        playerRef.current = videojs(videoRef.current, {
          controls: false,
          autoplay: false,
          preload: 'auto',
          responsive: true,
          fluid: true,
          loop: true,
          muted: true,
          poster: posterUrl,
        });

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
        if (playerRef.current.currentSrc() !== videoSource) {
          playerRef.current.src({ src: videoSource, type: videoType });
          playerRef.current.poster(posterUrl);
          setShowPlayOverlay(true);
        }
      }
    }

    return () => {
      if (playerRef.current) {
        const player = playerRef.current;
        const videoElement = player.el().querySelector('video');
        if (videoElement) {
          const handleInteraction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          };
          videoElement.removeEventListener('click', handleInteraction);
          videoElement.removeEventListener('touchend', handleInteraction);
        }
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (currentPlayingPlayerInfo && currentPlayingPlayerInfo.player === playerRef.current) {
        currentPlayingPlayerInfo = null;
      }
    };
  }, [videoSource, videoType, mediaType, posterUrl, togglePlay]);

  const handleReaction = async (emoji) => {
    setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    await updateDoc(postRef, {
      [`reactions.${emoji}`]: increment(1),
    });
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

    await updateDoc(postRef, {
      comments: updated,
    });
  };

  const handleDeletePost = async () => {
    if (confirm('Delete this post?')) {
      await deleteDoc(postRef);
      onUpdate?.();
    }
  };

  const handleResetReactions = async () => {
    await updateDoc(postRef, { reactions: EMOJI_SET });
    setReactions(EMOJI_SET);
  };

  const handleDeleteComment = async (commentId) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    await updateDoc(postRef, { comments: updated });
  };

  const renderEmbed = () => {
    if (!embed?.type || !embed?.url) return null;

    if (embed.type === 'youtube') {
      const videoId = new URL(embed.url).searchParams.get('v');
      return (
        <div className="mt-4">
          <iframe
            className="w-full aspect-video rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      );
    }

    if (embed.type === 'giphy') {
      return (
        <div className="mt-4">
          <iframe
            src={embed.url}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
          />
        </div>
      );
    }

    if (embed.type === 'twitter') {
      return (
        <div className="mt-4">
          <blockquote className="twitter-tweet">
            <a href={embed.url}></a>
          </blockquote>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border-l-8 border-rose-400 relative">
      {access === 'admin' && (
        <div className="absolute top-3 right-3">
          <details className="relative">
            <summary className="cursor-pointer text-xl text-gray-400 hover:text-rose-500">⋮</summary>
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-md rounded-md p-2 text-sm z-50 space-y-2">
              <button onClick={handleDeletePost} className="w-full text-left text-red-600 hover:underline">🗑 Delete Post</button>
              <button onClick={handleResetReactions} className="w-full text-left hover:underline">♻ Reset Reactions</button>
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
                className="video-js rounded-lg max-h-[500px] w-full"
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
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 84 84"><polygon points="32,24 64,42 32,60" /></svg>
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

      {/* Embed block */}
      {embed?.url && (
        <div className="mt-4">
          {embed.type === 'youtube' && (
            <iframe
              className="w-full aspect-video rounded-lg"
              src={`https://www.youtube.com/embed/${extractYouTubeID(embed.url)}`}
              frameBorder="0"
              allowFullScreen
            />
          )}
          {embed.type === 'vimeo' && (
            <iframe
              className="w-full aspect-video rounded-lg"
              src={`https://player.vimeo.com/video/${extractVimeoID(embed.url)}`}
              frameBorder="0"
              allowFullScreen
            />
          )}
          {embed.type === 'giphy' && (
            <iframe
              src={embed.url}
              className="w-full h-64 rounded-lg"
              allowFullScreen
            />
          )}
          {embed.type === 'twitter' && (
            <blockquote className="twitter-tweet">
              <a href={embed.url}></a>
            </blockquote>
          )}
          {embed.type === 'image' && (
            <img
              src={embed.url}
              alt="Embedded"
              className="w-full rounded-lg object-cover"
            />
          )}
          {embed.type === 'video' && (
            <video
              src={embed.url}
              controls
              className="w-full rounded-lg max-h-[500px]"
              playsInline
            />
          )}
          {embed.type === 'unknown' && (
            <a href={embed.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              View Embedded Link
            </a>
          )}
        </div>
      )}


      {renderEmbed()}
      setPostType(data.type || 'general');

      if (data.type === 'trade') {
        setTradeData({
          giving: data.giving || '',
          seeking: data.seeking || '',
          notes: data.notes || '',
        });
      }

      if (data.type === 'poll') {
        setPollData(data.poll);
        const voted = localStorage.getItem(`voted-${postId}`);
        setHasVoted(!!voted);
      }
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
                      const updated = [...pollData.options];
                      updated[idx].votes = [...(updated[idx].votes || []), Date.now()];

                      await updateDoc(postRef, {
                        [`poll.options`]: updated,
                      });

                      localStorage.setItem(`voted-${postId}`, '1');
                      setHasVoted(true);
                      setPollData(prev => ({
                        ...prev,
                        options: updated,
                      }));
                    }}
                    className="w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded"
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
            className="flex-1 border rounded-lg px-3 py-1 text-sm"
          />
          <button type="submit" className="text-rose-500 font-semibold text-sm">
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
