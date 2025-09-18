import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeOff, X, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrailerPlayerProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

export default function TrailerPlayer({ videoUrl, title, onClose }: TrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detecção de mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0)
      );
    };
    
    checkMobile();
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && hasStarted) {
        setShowControls(false);
      }
    }, isMobile ? 4000 : 3000);
  }, [isPlaying, hasStarted, isMobile]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setHasStarted(true);
      resetControlsTimeout();
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [resetControlsTimeout]);

  // Touch and mouse events  
  const handleInteraction = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleTouchToggle = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setShowControls(!showControls);
    resetControlsTimeout();
  }, [showControls, resetControlsTimeout]);

  useEffect(() => {
    const element = playerRef.current;
    if (!element) return;

    if (isMobile) {
      element.addEventListener('touchstart', handleTouchToggle, { passive: false });
    } else {
      element.addEventListener('mousemove', handleInteraction);
    }
    
    return () => {
      if (isMobile) {
        element.removeEventListener('touchstart', handleTouchToggle);
      } else {
        element.removeEventListener('mousemove', handleInteraction);
      }
    };
  }, [isMobile, handleTouchToggle, handleInteraction]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
        setHasStarted(true);
        resetControlsTimeout();
      }
    } catch (error) {
      console.warn('Erro ao reproduzir trailer:', error);
    }
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, currentTime - 10);
  };

  const handleProgressClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0]?.clientX || e.nativeEvent.changedTouches[0]?.clientX || 0;
    } else {
      clientX = e.nativeEvent.clientX;
    }
    
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    videoRef.current.currentTime = (percentage / 100) * duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={playerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      data-testid="trailer-player"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={isMobile ? togglePlay : undefined}
        onTouchStart={isMobile ? (e) => e.stopPropagation() : undefined}
        playsInline={true}
        preload="metadata"
        crossOrigin="anonymous"
        data-testid="trailer-video"
      />

      {/* Buffering Spinner */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {(showControls || !hasStarted) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg truncate">{title} - Trailer</h3>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 shrink-0 ml-4"
                data-testid="trailer-close-button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Center Play Button (when not started or paused) */}
            {(!hasStarted || !isPlaying) && !isBuffering && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Button
                  onClick={togglePlay}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all ${
                    isMobile ? 'p-8' : 'p-6'
                  }`}
                  data-testid="trailer-center-play-button"
                >
                  <Play className={`text-white ${isMobile ? 'w-16 h-16' : 'w-12 h-12'}`} fill="white" />
                </Button>
              </motion.div>
            )}

            {/* Bottom Controls */}
            {hasStarted && (
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div 
                  className={`relative w-full bg-white/30 rounded-full mb-4 cursor-pointer ${
                    isMobile ? 'h-3 py-1 -my-1' : 'h-1'
                  }`}
                  onClick={handleProgressClick}
                  onTouchEnd={handleProgressClick}
                  data-testid="trailer-progress-bar"
                >
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-full transition-all ${
                      isMobile ? 'h-1' : 'h-full'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 bg-primary rounded-full ${
                      isMobile ? 'w-4 h-4' : 'w-3 h-3'
                    }`}
                    style={{ left: `calc(${progressPercentage}% - ${isMobile ? '8px' : '6px'})` }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                    <Button
                      onClick={togglePlay}
                      onTouchStart={(e) => e.stopPropagation()}
                      variant="ghost"
                      size={isMobile ? "default" : "sm"}
                      className={`text-white hover:bg-white/20 ${
                        isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                      }`}
                      data-testid="trailer-play-pause-button"
                    >
                      {isPlaying ? 
                        <Pause className={isMobile ? "w-6 h-6" : "w-5 h-5"} /> : 
                        <Play className={isMobile ? "w-6 h-6" : "w-5 h-5"} />
                      }
                    </Button>

                    <Button
                      onClick={skipBackward}
                      onTouchStart={(e) => e.stopPropagation()}
                      variant="ghost"
                      size={isMobile ? "default" : "sm"}
                      className={`text-white hover:bg-white/20 ${
                        isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                      }`}
                      data-testid="trailer-skip-backward-button"
                    >
                      <RotateCcw className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                    </Button>

                    <Button
                      onClick={skipForward}
                      onTouchStart={(e) => e.stopPropagation()}
                      variant="ghost"
                      size={isMobile ? "default" : "sm"}
                      className={`text-white hover:bg-white/20 ${
                        isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                      }`}
                      data-testid="trailer-skip-forward-button"
                    >
                      <RotateCw className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                    </Button>

                    <span className={`text-white/80 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Button
                      onClick={toggleMute}
                      onTouchStart={(e) => e.stopPropagation()}
                      variant="ghost"
                      size={isMobile ? "default" : "sm"}
                      className={`text-white hover:bg-white/20 ${
                        isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                      }`}
                      data-testid="trailer-mute-button"
                    >
                      {isMuted ? 
                        <VolumeOff className={isMobile ? "w-5 h-5" : "w-4 h-4"} /> : 
                        <Volume2 className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                      }
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}