import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw,
  Settings, List, ChevronLeft, ChevronRight, SkipForward,
  Volume1, VolumeOff, Minimize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";

interface StreamPlayerProps {
  content: Content;
  videoUrl: string;
  onClose?: () => void;
  episodes?: Episode[];
  currentEpisode?: number;
  onEpisodeChange?: (episode: number) => void;
  seasons?: number[];
  currentSeason?: number;
  onSeasonChange?: (season: number) => void;
}

interface Episode {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
  description: string;
}

export default function StreamPlayer({ 
  content, 
  videoUrl, 
  onClose,
  episodes = [],
  currentEpisode = 1,
  onEpisodeChange,
  seasons = [1],
  currentSeason = 1,
  onSeasonChange
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasIntro, setHasIntro] = useState(true); // Simular abertura
  const [introEnd, setIntroEnd] = useState(90); // 90 segundos de abertura
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controle de visibilidade dos controles
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    // No mobile, deixar controles visíveis por mais tempo
    const timeout = isMobile ? 5000 : 3000;
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isMobile) setShowControls(false);
    }, timeout);
  };

  // Event listeners para o vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

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
  }, []);

  // Mouse movement e touch handler
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    const handleTouch = () => {
      setHasUserInteracted(true);
      setShowControls(!showControls);
    };
    
    if (playerRef.current) {
      // Eventos de mouse para desktop
      playerRef.current.addEventListener('mousemove', handleMouseMove);
      
      // Eventos de touch para mobile
      if (isMobile) {
        playerRef.current.addEventListener('touchstart', handleTouch, { passive: true });
        playerRef.current.addEventListener('touchend', handleTouch, { passive: true });
      }
      
      return () => {
        if (playerRef.current) {
          playerRef.current.removeEventListener('mousemove', handleMouseMove);
          playerRef.current.removeEventListener('touchstart', handleTouch);
          playerRef.current.removeEventListener('touchend', handleTouch);
        }
      };
    }
  }, [isPlaying, isMobile, showControls]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    setHasUserInteracted(true);
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // No mobile, pode ser necessário uma interação do usuário primeiro
        await videoRef.current.play();
      }
    } catch (error) {
      console.warn('Erro ao reproduzir vídeo:', error);
      // Fallback: mostrar controles para tentar novamente
      setShowControls(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    } else if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, currentTime - 10);
  };

  const skipIntro = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = introEnd;
  };

  const seekTo = (percentage: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = (percentage / 100) * duration;
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    
    try {
      if (!isFullscreen) {
        // Diferentes métodos de fullscreen para compatibilidade
        const element = playerRef.current;
        
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari/iOS
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        } else if (isMobile && videoRef.current) {
          // Fallback para mobile: fullscreen no vídeo
          if ((videoRef.current as any).webkitEnterFullscreen) {
            (videoRef.current as any).webkitEnterFullscreen();
          }
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Erro ao alternar fullscreen:', error);
      // Em dispositivos móveis, às vezes o fullscreen falha silenciosamente
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
  const showSkipIntro = hasIntro && currentTime < introEnd && currentTime > 5;

  const VolumeIcon = isMuted || volume === 0 ? VolumeOff : 
                   volume < 0.3 ? Volume1 : 
                   volume < 0.7 ? Volume2 : Volume2;

  return (
    <div 
      ref={playerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onLoadStart={() => setIsBuffering(true)}
        onClick={isMobile ? togglePlay : undefined}
        onTouchStart={isMobile ? () => setHasUserInteracted(true) : undefined}
        playsInline={true}
        preload="metadata"
        crossOrigin="anonymous"
        data-testid="stream-video"
        style={{
          // Garantir que o vídeo seja clicável no mobile
          pointerEvents: isMobile ? 'auto' : 'none'
        }}
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

      {/* Skip Intro Button - Movido para centro direita para evitar conflito com settings */}
      <AnimatePresence>
        {showSkipIntro && showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-1/2 -translate-y-1/2 right-6 z-20"
          >
            <Button
              onClick={skipIntro}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/30 text-white transition-all duration-200"
              data-testid="skip-intro-button"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Pular Abertura
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode Menu */}
      <AnimatePresence>
        {showEpisodeMenu && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-background/95 backdrop-blur-sm border-l border-border p-4 overflow-y-auto"
            data-testid="episode-menu"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Episódios</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEpisodeMenu(false)}
                data-testid="close-episode-menu"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Season Selector */}
            {seasons.length > 1 && (
              <div className="mb-4">
                <select
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border"
                  value={currentSeason}
                  onChange={(e) => onSeasonChange?.(Number(e.target.value))}
                  data-testid="season-selector-player"
                >
                  {seasons.map(season => (
                    <option key={season} value={season}>
                      Temporada {season}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Episodes List */}
            <div className="space-y-2">
              {episodes.map((episode, index) => (
                <motion.div
                  key={episode.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index + 1 === currentEpisode 
                      ? 'bg-primary/20 border border-primary/50' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => onEpisodeChange?.(index + 1)}
                  whileHover={{ scale: 1.02 }}
                  data-testid={`episode-item-${episode.id}`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-12 rounded bg-muted flex-shrink-0">
                      <img 
                        src={episode.thumbnail} 
                        alt={episode.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{episode.title}</h4>
                      <p className="text-xs text-muted-foreground">{episode.duration}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"
          >
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                  data-testid="close-player"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h3 className="text-white font-bold text-lg">{content.title}</h3>
                  {content.type !== 'movie' && (
                    <p className="text-white/80 text-sm">
                      T{currentSeason} • E{currentEpisode}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(content.type === 'series' || content.type === 'anime') && episodes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEpisodeMenu(!showEpisodeMenu)}
                    className="text-white hover:bg-white/20"
                    data-testid="toggle-episode-menu"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:bg-white/20"
                  data-testid="toggle-settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Center Play Button (when paused) */}
            {(!isPlaying && !isBuffering) || (isMobile && !hasUserInteracted) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Button
                  onClick={togglePlay}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setHasUserInteracted(true);
                  }}
                  className={`bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all ${
                    isMobile ? 'p-8 scale-110' : 'p-6'
                  }`}
                  data-testid="center-play-button"
                >
                  <Play className={`text-white ${isMobile ? 'w-16 h-16' : 'w-12 h-12'}`} fill="white" />
                </Button>
              </motion.div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Progress Bar */}
              <div 
                ref={progressRef}
                className={`relative w-full bg-white/20 rounded-full mb-4 cursor-pointer group ${
                  isMobile ? 'h-4 py-2 -my-2' : 'h-2'
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                  seekTo(percentage);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.changedTouches[0];
                  const percentage = ((touch.clientX - rect.left) / rect.width) * 100;
                  seekTo(percentage);
                }}
                data-testid="progress-bar"
              >
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-full transition-all ${
                    isMobile ? 'h-2' : 'h-full'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 bg-primary rounded-full transition-opacity ${
                    isMobile ? 'w-6 h-6 opacity-100' : 'w-4 h-4 opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ left: `calc(${progressPercentage}% - ${isMobile ? '12px' : '8px'})` }}
                />
              </div>

              {/* Control Buttons */}
              <div className={`flex items-center justify-between ${isMobile ? 'gap-2' : ''}`}>
                <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                  <Button
                    onClick={togglePlay}
                    onTouchStart={(e) => e.stopPropagation()}
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    className={`text-white hover:bg-white/20 ${
                      isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                    }`}
                    data-testid="play-pause-button"
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
                    data-testid="skip-backward-button"
                  >
                    <RotateCcw className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                    {!isMobile && <span className="ml-1 text-xs">10s</span>}
                  </Button>

                  <Button
                    onClick={skipForward}
                    onTouchStart={(e) => e.stopPropagation()}
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    className={`text-white hover:bg-white/20 ${
                      isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                    }`}
                    data-testid="skip-forward-button"
                  >
                    <RotateCw className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                    {!isMobile && <span className="ml-1 text-xs">10s</span>}
                  </Button>

                  {/* Volume Control - Melhorado com slider interativo */}
                  {!isMobile && (
                    <div className="flex items-center gap-2 group relative">
                      <Button
                        onClick={toggleMute}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        data-testid="mute-button"
                      >
                        <VolumeIcon className="w-4 h-4" />
                      </Button>
                      
                      <div 
                        className={`w-20 h-1 bg-white/20 rounded-full cursor-pointer transition-all duration-200 relative ${
                          showVolumeSlider ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percentage = (e.clientX - rect.left) / rect.width;
                          handleVolumeChange(Math.max(0, Math.min(1, percentage)));
                        }}
                      >
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${volume * 100}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity"
                          style={{ 
                            left: `calc(${volume * 100}% - 6px)`,
                            opacity: showVolumeSlider ? 1 : 0
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <span className={`text-white/80 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Volume button for mobile */}
                  {isMobile && (
                    <Button
                      onClick={toggleMute}
                      onTouchStart={(e) => e.stopPropagation()}
                      variant="ghost"
                      size="default"
                      className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px] p-3"
                      data-testid="mute-button-mobile"
                    >
                      <VolumeIcon className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={toggleFullscreen}
                    onTouchStart={(e) => e.stopPropagation()}
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    className={`text-white hover:bg-white/20 ${
                      isMobile ? 'min-h-[44px] min-w-[44px] p-3' : ''
                    }`}
                    data-testid="fullscreen-button"
                  >
                    {isFullscreen ? 
                      <Minimize className={isMobile ? "w-5 h-5" : "w-4 h-4"} /> : 
                      <Maximize className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                    }
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Menu */}
      <AnimatePresence>
        {showSettings && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 right-6 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 min-w-48"
            data-testid="settings-menu"
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Velocidade</label>
                <select
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border text-sm"
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                  }}
                  data-testid="playback-rate-selector"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>Normal</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Qualidade</label>
                <select
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border text-sm"
                  value={quality}
                  onChange={(e) => {
                    setQuality(e.target.value);
                    // Simular mudança de qualidade (em produção, mudaria a fonte do vídeo)
                    console.log('Qualidade alterada para:', e.target.value);
                  }}
                  data-testid="quality-selector"
                >
                  <option value="auto">Automática</option>
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { Episode };