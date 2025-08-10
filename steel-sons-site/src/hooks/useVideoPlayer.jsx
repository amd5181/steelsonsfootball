import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

/**
 * Custom hook to manage the lifecycle of a video.js player.
 * @param {object} playerRef - A ref to the video.js player instance.
 * @param {object} videoRef - A ref to the video DOM element.
 * @param {string} mediaUrl - The URL of the video file.
 * @param {string} mediaType - The type of media ('video' or 'image').
 * @returns {object} An object containing player state and controls.
 */
const useVideoPlayer = (playerRef, videoRef, mediaUrl, mediaType) => {
  const [videoSource, setVideoSource] = useState(null);
  const [videoType, setVideoType] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const [aspect, setAspect] = useState(16 / 9);
  const [showPoster, setShowPoster] = useState(true);

  // Parse media URL and set source details
  useEffect(() => {
    if (mediaType !== 'video' || !mediaUrl) {
      setVideoSource(null);
      setVideoType(null);
      setPosterUrl(null);
      return;
    }

    const afterUpload = mediaUrl.split('/upload/')[1];
    if (!afterUpload) {
      setPosterUrl(null);
      setVideoSource(mediaUrl);
      setVideoType('video/mp4');
      return;
    }

    const basePath = afterUpload.replace(/\.(mp4|mov)$/i, '');
    const hlsUrl = `https://res.cloudinary.com/dsvpfi9te/video/upload/sp_auto/${basePath}.m3u8`;
    const poster = `https://res.cloudinary.com/dsvpfi9te/video/upload/so_0/${basePath}.jpg`;

    setPosterUrl(poster);
    setVideoSource(hlsUrl);
    setVideoType('application/x-mpegURL');
  }, [mediaUrl, mediaType]);

  // Handle player initialization and cleanup
  useEffect(() => {
    if (!videoRef.current || !videoSource) return;

    if (!playerRef.current) {
      const player = videojs(videoRef.current, {
        controls: false,
        autoplay: false,
        preload: 'metadata',
        responsive: true,
        fluid: true,
        loop: true,
        muted: true,
        poster: posterUrl || undefined,
      });

      player.src({ src: videoSource, type: videoType });

      player.on('play', () => {
        setShowPlayOverlay(false);
        setShowPoster(false);
        player.muted(false); // Unmute on play
      });
      player.on('pause', () => setShowPlayOverlay(true));
      
      // Unmute on first playback
      player.one('playing', () => {
        try { player.muted(false); } catch {}
        setShowPoster(false);
      });

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

      const handleError = async () => {
        const err = player.error();
        console.warn('Video.js error:', err);
        try {
          if (player.currentType() === 'video/mp4') return;
          if (mediaUrl) {
            player.src({ src: mediaUrl, type: 'video/mp4' });
            if (posterUrl) player.poster(posterUrl);
            await player.play().catch(() => {});
          }
        } catch {}
      };
      player.on('error', handleError);

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoRef, videoSource, videoType, posterUrl, mediaUrl, playerRef]);

  /**
   * Toggles play/pause of the video.
   */
  const handleVideoInteraction = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;

    if (player.paused()) {
      try {
        await player.play();
        setShowPlayOverlay(false);
      } catch (err) {
        console.warn('Play was rejected by the browser.', err);
        // Fallback to direct MP4 source if HLS fails to play
        try {
          if (player.currentType() !== 'video/mp4' && mediaUrl) {
            player.src({ src: mediaUrl, type: 'video/mp4' });
            if (posterUrl) player.poster(posterUrl);
            await player.play().catch(() => {});
            setShowPlayOverlay(false);
          }
        } catch (err2) {
          console.error('Fallback play failed:', err2);
          setShowPlayOverlay(true);
        }
      }
    } else {
      player.pause();
      setShowPlayOverlay(true);
    }
  }, [playerRef, mediaUrl, posterUrl]);

  return {
    showPlayOverlay,
    aspect,
    showPoster,
    posterUrl,
    handleVideoInteraction,
    setAspect,
    setShowPoster,
  };
};

export default useVideoPlayer;
