import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

// Mock user data
const mockUser = {
  name: "User",
  plan: "Early User",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_L0NSQAGb3C8fgfMtO3D5h6Xh3XCvDWGGMFyBFvAr9LDcDvaG9nkiWKiqTLvXI6FwsMny_FmQt2SsGA8qkcqphHsHC02np94Khlzjf_zgeMs9hgumeH8gNMNPh0pTGJfmOHmzrlDxZo5n4pv8Iv1VQeEp3NphGqZSVAokApu-Xdx5Yl7dbe0YIV74_6U-7s0Bf1nUyfk4m8fEs3DcH7HnC1Iq_HASIOzKpuLRn1WoIng8lafqgNRxcVAVTMH7GCc4QlN5Ezz1DZw"
};

// Custom Video Player Component
const CustomVideoPlayer = ({ src, className = "" }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current.parentElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-auto bg-black"
        src={src}
        preload="metadata"
        onClick={togglePlayPause}
      >
        Your browser does not support the video tag.
      </video>

      {/* Center Play Button - Only shows when video is paused/not started */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300">
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-white/90 hover:bg-white hover:scale-110 transition-all duration-200 shadow-2xl"
            aria-label="Play video"
          >
            <span className="material-symbols-outlined text-[#2D2A26] text-[48px] ml-1">
              play_arrow
            </span>
          </button>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 relative group/progress"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"></div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-white/80 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="material-symbols-outlined text-[28px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Volume Controls */}
            <div
              className="flex items-center gap-2 relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>

              {/* Volume Slider */}
              <div className={`overflow-hidden transition-all duration-300 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-medium tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Download video"
            >
              <span className="material-symbols-outlined text-[24px]">
                download
              </span>
            </button>
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Fullscreen"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ user }) => {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", active: false , link: "/home"},
    { icon: "add_circle", label: "New Concept", active: false , link : "/new"},
    { icon: "settings", label: "Settings", active: false, link: "/settings" },
    //{ icon: "folder_open", label: "My Library", active: true, link: "#"},
  ];

  return (
    <div className="w-72 flex-shrink-0 border-r border-[#EBEBE8] bg-[#FFFFFF] flex flex-col justify-between p-6 hidden md:flex">
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-[#2D2A26] text-[#FFFFFF] shadow-sm">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#2D2A26] font-serif text-xl font-bold tracking-tight">Notewright</h1>
            <p className="text-[#6E6B65] text-xs uppercase tracking-wider font-medium">Learning Engine</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <a
              key={index}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                item.active
                  ? 'bg-[#F9F9F7] border border-[#EBEBE8] text-[#2D2A26] font-medium shadow-sm'
                  : 'text-[#6E6B65] hover:text-[#2D2A26] hover:bg-[#F9F9F7]'
              }`}
              href={item.link}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        <div className="pt-6 border-t border-[#EBEBE8] flex items-center gap-3">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-[#F9F9F7] shadow-sm"
            style={{ backgroundImage: `url("${user.avatar}")` }}
          />
          <div className="flex flex-col">
            <p className="text-[#2D2A26] font-serif font-medium text-sm">{user.name}</p>
            <p className="text-[#6E6B65] text-xs">{user.plan}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Header Component
const MobileHeader = () => {
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b border-[#EBEBE8] bg-[#FFFFFF] sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#2D2A26]">school</span>
        <span className="font-serif font-bold text-[#2D2A26]">ConceptAI</span>
      </div>
      <button className="text-[#2D2A26]">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
  );
};

// Top Header with Download Button
const ContentHeader = ({ onDownload, onBack }) => {
  return (
    <div className="sticky top-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#EBEBE8]">
      <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="group flex items-center gap-1 text-sm text-[#6E6B65] hover:text-[#2D2A26] transition-colors px-2 py-1 rounded-md hover:bg-[#F9F9F7]"
            title="Generate new concept"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <span className="material-symbols-outlined text-[#2D2A26] opacity-80">description</span>
          <span className="font-serif text-lg font-medium text-[#2D2A26]">Generated Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm text-[#6E6B65] hover:text-[#2D2A26] transition-colors px-3 py-2 rounded-md hover:bg-[#F9F9F7]"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span className="font-medium hidden sm:inline">New Notes</span>
          </button>
          <button
            onClick={onDownload}
            className="group flex items-center gap-2 text-sm text-[#6E6B65] hover:text-[#2D2A26] transition-colors px-3 py-2 rounded-md hover:bg-[#F9F9F7]"
          >
            <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100">download</span>
            <span className="font-medium hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const formattingStyles = `
  /* Typography and base styles */
  .prose {
    color: #2D2A26;
    font-family: 'Lora', serif;
  }

  .prose p {
    margin-bottom: 1.5em;
    line-height: 1.8;
  }

  /* Headers */
  .prose h1, .prose h2, .prose h3, .prose h4 {
    font-family: 'Lora', serif;
    font-weight: 600;
    color: #2D2A26;
    margin-top: 2em;
    margin-bottom: 0.75em;
    line-height: 1.3;
  }

  .prose h1 { font-size: 2.25em; }
  .prose h2 { font-size: 1.875em; border-bottom: 2px solid #EBEBE8; padding-bottom: 0.5em; }
  .prose h3 { font-size: 1.5em; }
  .prose h4 { font-size: 1.25em; }

  /* Emphasis */
  .prose strong {
    font-weight: 600;
    color: #1a1816;
  }

  .prose em {
    font-style: italic;
    color: #3d3a36;
  }

  /* Lists */
  .prose ul, .prose ol {
    margin: 1.5em 0;
    padding-left: 1.75em;
  }

  .prose li {
    margin: 0.5em 0;
    line-height: 1.75;
  }

  .prose ul li {
    list-style-type: disc;
  }

  .prose ol li {
    list-style-type: decimal;
  }

  /* Code blocks and inline code */
  .prose code {
    background: #F9F9F7;
    border: 1px solid #EBEBE8;
    border-radius: 4px;
    padding: 0.2em 0.4em;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #c7254e;
  }

  .prose pre {
    background: #2D2A26;
    color: #F9F9F7;
    border-radius: 8px;
    padding: 1.5em;
    overflow-x: auto;
    margin: 1.5em 0;
    border: 1px solid #3d3a36;
  }

  .prose pre code {
    background: transparent;
    border: none;
    padding: 0;
    color: inherit;
    font-size: 0.95em;
  }

  /* Blockquotes (for definitions/key insights) */
  .prose blockquote {
    border-left: 4px solid #2D2A26;
    background: #F9F9F7;
    padding: 1em 1.5em;
    margin: 1.5em 0;
    font-style: italic;
    border-radius: 4px;
  }

  .prose blockquote p {
    margin: 0;
  }

  /* Math equations */
  .prose .math-display {
    overflow-x: auto;
    overflow-y: hidden;
    margin: 2em 0;
    padding: 1.5em;
    background: #FAFAF9;
    border-radius: 8px;
    border: 1px solid #EBEBE8;
    text-align: center;
  }

  .prose .math-inline {
    display: inline;
    margin: 0 0.15em;
  }

  /* KaTeX font size adjustments */
  .prose .katex {
    font-size: 1.1em;
  }

  .prose .math-display .katex {
    font-size: 1.3em;
  }

  /* Links */
  .prose a {
    color: #3B82F6;
    text-decoration: underline;
    text-decoration-color: rgba(59, 130, 246, 0.3);
    text-underline-offset: 2px;
    transition: all 0.2s;
  }

  .prose a:hover {
    color: #2563EB;
    text-decoration-color: rgba(37, 99, 235, 0.6);
  }

  /* Tables (if needed) */
  .prose table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
  }

  .prose th, .prose td {
    border: 1px solid #EBEBE8;
    padding: 0.75em;
    text-align: left;
  }

  .prose th {
    background: #F9F9F7;
    font-weight: 600;
  }

  /* Horizontal rules */
  .prose hr {
    border: none;
    border-top: 2px solid #EBEBE8;
    margin: 2em 0;
  }
`;

// Main Concept Viewer Component
const ConceptViewer = ({ generatedHTML, onBack }) => {
  const contentRef = useRef(null);
  const [isContentReady, setIsContentReady] = useState(false);

  const handleDownload = () => {
    console.log('Downloading concept...');
    
    // Create a complete standalone HTML document
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notewright - Generated Concept</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  
  <!-- KaTeX CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
    }

    .font-serif {
      font-family: 'Lora', serif;
    }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
    }

    ${formattingStyles}

    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #e5e5e5;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #d4d4d4;
    }
    ::selection {
      background: #e8e6e3;
      color: #000;
    }

    /* Custom Video Player Styles */
    .video-container {
      position: relative;
      width: 100%;
      background: black;
      border-radius: 8px;
      overflow: hidden;
      margin: 2em 0;
      cursor: pointer;
    }

    .video-container video {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
    }

    .video-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
      padding: 12px 16px 16px 16px;
      opacity: 0;
      transition: opacity 0.3s;
      cursor: default;
    }

    .video-container:hover .video-controls {
      opacity: 1;
    }

    .play-button-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      pointer-events: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .play-button-center:hover {
      background: white;
      transform: translate(-50%, -50%) scale(1.1);
    }

    .play-button-center.hidden {
      display: none;
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      cursor: pointer;
      margin-bottom: 8px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .progress-bar-inner {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      position: relative;
      transition: height 0.2s;
    }

    .progress-bar:hover .progress-bar-inner {
      height: 6px;
    }

    .progress-filled {
      height: 100%;
      background: white;
      border-radius: 2px;
      position: relative;
    }

    .progress-filled::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      background: white;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    }

    .video-container:hover .progress-filled::after {
      opacity: 1;
    }

    .controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .controls-left, .controls-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .control-button {
      color: white;
      cursor: pointer;
      transition: color 0.2s;
      background: none;
      border: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-button:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    .time-display {
      color: white;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.025em;
    }

    .volume-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .volume-slider {
      width: 80px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      appearance: none;
      cursor: pointer;
      transition: opacity 0.3s;
    }

    .volume-slider::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
    }

    .volume-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }
  </style>
</head>
<body>
  <div class="w-full max-w-[800px] mx-auto px-6 py-12 lg:py-16 bg-white min-h-screen">
    <header class="mb-12 text-center border-b border-gray-200 pb-8">
      <div class="flex items-center justify-center gap-3 mb-4">
        <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-[#2D2A26] text-white">
          <span class="material-symbols-outlined">school</span>
        </div>
        <h1 class="text-4xl font-serif font-bold text-[#2D2A26]">Notewright</h1>
      </div>
      <p class="text-[#6E6B65] text-sm">Generated Multimodal Study Material</p>
    </header>

    <main class="flex flex-col gap-12">
      ${generatedHTML}
    </main>

    <footer class="text-center py-12 text-gray-400 text-xs mt-8 border-t border-gray-200">
      <p>© 2024 Notewright. Generated content.</p>
    </footer>
  </div>

  <!-- KaTeX JavaScript -->
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>

  <script>
    // Initialize KaTeX rendering
    document.addEventListener('DOMContentLoaded', function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "\\\\[", right: "\\\\]", display: true},
          {left: "$", right: "$", display: false},
          {left: "\\\\(", right: "\\\\)", display: false}
        ],
        throwOnError: false,
        strict: false,
        trust: true,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });

      // Initialize custom video players
      const videoContainers = document.querySelectorAll('.custom-video-player');
      videoContainers.forEach(container => {
        const videoSrc = container.getAttribute('data-video-src');
        if (!videoSrc) return;

        // Create video player HTML
        const playerHTML = \`
          <div class="video-container">
            <video preload="metadata" onclick="togglePlayFromVideo(event, this)">
              <source src="\${videoSrc}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            
            <div class="play-button-center">
              <span class="material-symbols-outlined" style="font-size: 48px; color: #2D2A26; margin-left: 4px;">play_arrow</span>
            </div>

            <div class="video-controls" onclick="event.stopPropagation()">
              <div class="progress-bar" onclick="handleProgressClick(event, this)">
                <div class="progress-bar-inner">
                  <div class="progress-filled" style="width: 0%"></div>
                </div>
              </div>
              <div class="controls-row">
                <div class="controls-left">
                  <button class="control-button play-pause" onclick="togglePlay(this)">
                    <span class="material-symbols-outlined" style="font-size: 28px;">play_arrow</span>
                  </button>
                  <div class="volume-container">
                    <button class="control-button volume-btn" onclick="toggleMute(this)">
                      <span class="material-symbols-outlined" style="font-size: 24px;">volume_up</span>
                    </button>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1" onchange="handleVolumeChange(event, this)">
                  </div>
                  <div class="time-display">
                    <span class="current-time">0:00</span> / <span class="duration">0:00</span>
                  </div>
                </div>
                <div class="controls-right">
                  <button class="control-button download-btn" onclick="downloadVideo(this)" title="Download video">
                    <span class="material-symbols-outlined" style="font-size: 24px;">download</span>
                  </button>
                  <button class="control-button fullscreen-btn" onclick="toggleFullscreen(this)">
                    <span class="material-symbols-outlined" style="font-size: 24px;">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        \`;

        container.innerHTML = playerHTML;

        // Get video element and set up event listeners
        const video = container.querySelector('video');
        const playBtn = container.querySelector('.play-pause span');
        const playBtnCenter = container.querySelector('.play-button-center');
        const progressFilled = container.querySelector('.progress-filled');
        const currentTimeEl = container.querySelector('.current-time');
        const durationEl = container.querySelector('.duration');

        video.addEventListener('loadedmetadata', () => {
          durationEl.textContent = formatTime(video.duration);
        });

        video.addEventListener('timeupdate', () => {
          const progress = (video.currentTime / video.duration) * 100;
          progressFilled.style.width = progress + '%';
          currentTimeEl.textContent = formatTime(video.currentTime);
        });

        video.addEventListener('play', () => {
          playBtn.textContent = 'pause';
          playBtnCenter.classList.add('hidden');
        });

        video.addEventListener('pause', () => {
          playBtn.textContent = 'play_arrow';
          playBtnCenter.classList.remove('hidden');
        });

        video.addEventListener('ended', () => {
          playBtn.textContent = 'play_arrow';
          playBtnCenter.classList.remove('hidden');
        });
      });
    });

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function togglePlayFromVideo(event, video) {
      // Don't toggle if clicking on controls
      if (event.target.closest('.video-controls')) {
        return;
      }
      
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    function togglePlay(btn) {
      const container = btn.closest('.video-container');
      const video = container.querySelector('video');
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    function handleProgressClick(event, progressBar) {
      event.stopPropagation();
      const container = progressBar.closest('.video-container');
      const video = container.querySelector('video');
      const rect = progressBar.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    }

    function handleVolumeChange(event, slider) {
      const container = slider.closest('.video-container');
      const video = container.querySelector('video');
      const volumeBtn = container.querySelector('.volume-btn span');
      const volume = parseFloat(event.target.value);
      video.volume = volume;
      
      if (volume === 0) {
        volumeBtn.textContent = 'volume_off';
      } else if (volume < 0.5) {
        volumeBtn.textContent = 'volume_down';
      } else {
        volumeBtn.textContent = 'volume_up';
      }
    }

    function toggleMute(btn) {
      const container = btn.closest('.video-container');
      const video = container.querySelector('video');
      const volumeBtn = container.querySelector('.volume-btn span');
      const volumeSlider = container.querySelector('.volume-slider');
      
      if (video.muted) {
        video.muted = false;
        volumeBtn.textContent = video.volume < 0.5 ? 'volume_down' : 'volume_up';
      } else {
        video.muted = true;
        volumeBtn.textContent = 'volume_off';
      }
    }

    function toggleFullscreen(btn) {
      const container = btn.closest('.video-container');
      const icon = btn.querySelector('span');
      
      if (!document.fullscreenElement) {
        container.requestFullscreen();
        icon.textContent = 'fullscreen_exit';
      } else {
        document.exitFullscreen();
        icon.textContent = 'fullscreen';
      }
    }

    function downloadVideo(btn) {
      const container = btn.closest('.video-container');
      const video = container.querySelector('video');
      const videoSrc = video.querySelector('source').src;
      
      const a = document.createElement('a');
      a.href = videoSrc;
      a.download = 'video-' + Date.now() + '.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    document.addEventListener('fullscreenchange', () => {
      const fullscreenBtns = document.querySelectorAll('.fullscreen-btn span');
      fullscreenBtns.forEach(icon => {
        icon.textContent = document.fullscreenElement ? 'fullscreen_exit' : 'fullscreen';
      });
    });

    // Add download buttons to all images
    document.addEventListener('DOMContentLoaded', function() {
      const images = document.querySelectorAll('main img');
      images.forEach(img => {
        // Skip if it's already wrapped
        if (img.parentElement.classList.contains('image-with-download')) return;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'image-with-download';
        wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';
        
        // Wrap the image
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'image-download-btn';
        downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span>';
        downloadBtn.style.cssText = 'position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.95); border: none; border-radius: 6px; padding: 8px; cursor: pointer; opacity: 0; transition: opacity 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;';
        downloadBtn.title = 'Download image';
        
        downloadBtn.querySelector('span').style.cssText = 'font-size: 20px; color: #2D2A26;';

        // Show on hover
        wrapper.addEventListener('mouseenter', () => {
          downloadBtn.style.opacity = '1';
        });
        wrapper.addEventListener('mouseleave', () => {
          downloadBtn.style.opacity = '0';
        });

        // Download functionality
        downloadBtn.addEventListener('click', () => {
          const imgSrc = img.src;
          const a = document.createElement('a');
          a.href = imgSrc;
          a.download = 'image-' + Date.now() + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        wrapper.appendChild(downloadBtn);
      });
    });
  </script>
</body>
</html>`;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `concept-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Download initiated');
  };

  // Load KaTeX CSS immediately on mount
  useEffect(() => {
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
      console.log('[KaTeX] CSS loaded');
    }
  }, []);

  // Watch for DOM changes to know when content is ready
  useEffect(() => {
    if (!generatedHTML || !contentRef.current) return;

    console.log('[KaTeX] Setting up MutationObserver');
    setIsContentReady(false);

    // Use MutationObserver to detect when content is actually rendered
    const observer = new MutationObserver((mutations) => {
      if (contentRef.current && contentRef.current.children.length > 0) {
        console.log('[KaTeX] Content detected in DOM');
        setIsContentReady(true);
        observer.disconnect();
      }
    });

    observer.observe(contentRef.current, {
      childList: true,
      subtree: true
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      console.log('[KaTeX] Timeout - assuming content is ready');
      setIsContentReady(true);
      observer.disconnect();
    }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [generatedHTML]);

  // Process content once it's ready
  useEffect(() => {
    if (!isContentReady || !contentRef.current) return;

    console.log('[KaTeX] Content is ready, processing...');

    // Load a script and return a promise
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Load KaTeX scripts sequentially
    const loadKaTeX = async () => {
      if (window.katex && window.renderMathInElement) {
        console.log('[KaTeX] Already loaded');
        return;
      }

      console.log('[KaTeX] Loading scripts...');

      // Load KaTeX core first, then auto-render
      await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js');
      console.log('[KaTeX] Core loaded');
      await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js');
      console.log('[KaTeX] Auto-render loaded');
    };

    const processContent = async () => {
      // Load KaTeX scripts first
      try {
        await loadKaTeX();
        console.log('[KaTeX] Scripts loaded');
      } catch (error) {
        console.error('[KaTeX] Error loading scripts:', error);
        return;
      }

      // Initialize video players
      const videoContainers = contentRef.current.querySelectorAll('.custom-video-player');
      console.log('[Video] Found video containers:', videoContainers.length);
      videoContainers.forEach((container, index) => {
        if (!container.hasAttribute('data-initialized')) {
          const videoSrc = container.getAttribute('data-video-src');
          console.log(`[Video] Container ${index} has src:`, videoSrc ? 'yes (length: ' + videoSrc.length + ')' : 'no');
          if (videoSrc) {
            container.setAttribute('data-initialized', 'true');
            const root = ReactDOM.createRoot(container);
            root.render(<CustomVideoPlayer src={videoSrc} />);
            console.log(`[Video] Initialized player ${index}`);
          }
        }
      });

      // Render LaTeX equations
      try {
        if (window.renderMathInElement && contentRef.current) {
          console.log('[KaTeX] Rendering math elements...');
          window.renderMathInElement(contentRef.current, {
            delimiters: [
              // Display math delimiters
              {left: "$$", right: "$$", display: true},
              {left: "\\[", right: "\\]", display: true},
              // Inline math delimiters
              {left: "$", right: "$", display: false},
              {left: "\\(", right: "\\)", display: false}
            ],
            throwOnError: false,
            strict: false,
            trust: true,
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
          });
          console.log('[KaTeX] Rendering completed successfully');
        } else {
          console.error('[KaTeX] renderMathInElement not available or contentRef null');
        }
      } catch (error) {
        console.error('[KaTeX] Error rendering:', error);
      }

      // Add download buttons to images
      const images = contentRef.current.querySelectorAll('img');
      console.log('[Images] Found images:', images.length);
      images.forEach((img, index) => {
        // Skip if already wrapped
        if (img.parentElement.classList.contains('image-with-download')) return;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'image-with-download group/image relative inline-block w-full';
        
        // Wrap the image
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'absolute top-3 right-3 bg-white/95 hover:bg-white border-none rounded-md p-2 cursor-pointer opacity-0 group-hover/image:opacity-100 transition-opacity shadow-md flex items-center justify-center';
        downloadBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] text-[#2D2A26]">download</span>';
        downloadBtn.title = 'Download image';
        
        // Download functionality
        downloadBtn.addEventListener('click', () => {
          const imgSrc = img.src;
          const a = document.createElement('a');
          a.href = imgSrc;
          a.download = `image-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        wrapper.appendChild(downloadBtn);
        console.log(`[Images] Added download button to image ${index}`);
      });
    };

    processContent();
  }, [isContentReady]);

  // If no HTML is provided, show a message
  if (!generatedHTML) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F9F9F7]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#6E6B65] mb-4">description</span>
          <p className="text-xl text-[#2D2A26] font-serif">No content to display</p>
          <p className="text-sm text-[#6E6B65] mt-2">Please generate a concept first</p>
        </div>
      </div>
    );
  }

  return (
   <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

          body {
            font-family: 'Inter', sans-serif;
          }

          .font-serif {
            font-family: 'Lora', serif;
          }

          .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
          }

          ${formattingStyles}

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #e5e5e5;
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #d4d4d4;
          }
          ::selection {
            background: #e8e6e3;
            color: #000;
          }
        `}
      </style>

      <div className="flex h-screen w-full overflow-hidden bg-[#F9F9F7]">
        <Sidebar user={mockUser} />

        <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#FFFFFF]">
          <MobileHeader />
          <ContentHeader onDownload={handleDownload} onBack={onBack} />

          <div className="w-full max-w-[800px] mx-auto px-6 py-12 lg:py-16">
            <main
              ref={contentRef}
              className="flex flex-col gap-12"
              dangerouslySetInnerHTML={{ __html: generatedHTML }}
            />

            <footer className="text-center py-12 text-gray-300 text-xs mt-8">
              <p>© 2024 Notewright. Generated content.</p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

// Wrapper component that fetches article data and passes to ConceptViewer
const ArticleViewerWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const articleId = searchParams.get('id');

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError('No article ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/articles/${articleId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleBack = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F9F9F7]">
        <LoadingScreen 
          messages={[
            "Understanding Documents...",
            "Preparing visualizations...",
            "Almost ready..."
          ]}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F9F9F7]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <p className="text-xl text-[#2D2A26] font-serif mb-2">Error loading article</p>
          <p className="text-sm text-[#6E6B65] mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#2D2A26] text-white rounded-lg hover:bg-black transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <ConceptViewer generatedHTML={article?.content} onBack={handleBack} />;
};

export default ArticleViewerWrapper;