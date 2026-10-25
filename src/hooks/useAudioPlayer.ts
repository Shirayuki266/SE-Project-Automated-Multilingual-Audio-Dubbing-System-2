import { useState, useEffect, useRef, useCallback } from 'react';
import { POI, Language } from '../types';

export function useAudioPlayer(language: Language) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [currentPoi, setCurrentPoi] = useState<POI | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Unlock Web Audio Autoplay Policy (BR01-1)
  const unlockAudioContext = useCallback(async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // Play silent 0.1s buffer
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      setIsUnlocked(true);
      return true;
    } catch (e) {
      console.warn('Could not unlock AudioContext:', e);
      setIsUnlocked(true);
      return false;
    }
  }, []);

  // Play POI Audio
  const playPoi = useCallback((poi: POI, autoStart = true) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentPoi(poi);
    const trans = poi.translations[language] || poi.translations.vi;
    const url = trans?.audio_url;

    if (url) {
      if (audio.src !== window.location.origin + url && !audio.src.endsWith(url)) {
        audio.src = url;
        audio.load();
      }
      if (autoStart) {
        audio.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
        });
      }
    }
  }, [language]);

  // When language changes, update currently playing track
  useEffect(() => {
    if (currentPoi && audioRef.current) {
      const trans = currentPoi.translations[language] || currentPoi.translations.vi;
      if (trans?.audio_url) {
        const wasPlaying = isPlaying;
        audioRef.current.src = trans.audio_url;
        audioRef.current.load();
        if (wasPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }, [language, currentPoi]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const skipSeconds = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime + delta);
  }, [seek]);

  const changeRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  return {
    currentPoi,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isUnlocked,
    unlockAudioContext,
    playPoi,
    togglePlay,
    seek,
    skipSeconds,
    changeRate,
    stop,
    setCurrentPoi,
  };
}
