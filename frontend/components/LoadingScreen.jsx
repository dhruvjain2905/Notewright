import React from 'react';

/**
 * Enhanced Loading Screen Component
 * A beautiful, animated loading screen with cycling messages and quote
 */
const LoadingScreen = ({ 
  messages = [
    "Processing your question...",
    "Analyzing documents...",
    "Generating visuals..."
  ],
  quote = {
    text: "If I can't picture it. I can't understand it.",
    author: "Albert Einstein"
  }
}) => {
  return (
    <>
      <style>
        {`
          @keyframes cycleMessages {
            0% { opacity: 0; transform: translateY(10px); }
            5% { opacity: 1; transform: translateY(0); }
            28% { opacity: 1; transform: translateY(0); }
            33% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 0; transform: translateY(-10px); }
          }

          .text-cycle-item {
            position: absolute;
            width: 100%;
            left: 0;
            top: 0;
            opacity: 0;
            animation: cycleMessages 12s linear infinite;
          }

          .text-cycle-item:nth-child(1) { animation-delay: 0s; }
          .text-cycle-item:nth-child(2) { animation-delay: 4s; }
          .text-cycle-item:nth-child(3) { animation-delay: 8s; }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .animate-spin-slow {
            animation: spin-slow 2s linear infinite;
          }
        `}
      </style>

      <div className="max-w-md w-full px-6 text-center">
        {/* Logo Section with Float Animation */}
        <div className="mb-10 animate-float">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="bg-[#2D2A26] text-white p-2.5 rounded-xl shadow-lg">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <div className="text-left">
              <h1 className="font-serif text-2xl text-[#2D2A26] leading-none">Notewright</h1>
              <p className="text-xs tracking-widest uppercase text-[#6E6B65] font-medium mt-0.5">
                Learning Engine
              </p>
            </div>
          </div>
        </div>

        {/* Main Loading Card */}
        <div className="relative bg-white p-10 rounded-2xl shadow-sm border border-[#EBEBE8] flex flex-col items-center justify-center min-h-[320px]">
          {/* Spinner */}
          <div className="relative w-16 h-16 mb-8">
            {/* Background ring */}
            <div className="absolute inset-0 rounded-full border-4 border-[#F9F9F7]"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-[#2D2A26] border-t-transparent animate-spin-slow"></div>
          </div>

          {/* Cycling Messages */}
          <div className="space-y-4 w-full">
            <div className="h-16 flex items-center justify-center">
              <div className="relative w-full h-full">
                {messages.map((message, index) => (
                  <h2 
                    key={index}
                    className="text-xl font-serif text-[#2D2A26] text-cycle-item"
                  >
                    {message}
                  </h2>
                ))}
              </div>
            </div>
            <p className="text-sm text-[#6E6B65] max-w-xs mx-auto leading-relaxed">
              We're preparing personalized generations just for you. This will take a few minutes.
            </p>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mt-12 opacity-80 transition-opacity hover:opacity-100">
          <span className="text-6xl text-[#2D2A26]/10 font-serif leading-none absolute -mt-6 -ml-4">"</span>
          <p className="text-[#6E6B65] font-serif text-lg italic relative z-10 px-4">
            {quote.text}
          </p>
          <p className="text-xs font-semibold text-[#6E6B65] mt-3 tracking-wide uppercase">
            — {quote.author}
          </p>
        </div>
      </div>

      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#2D2A26]/20 to-transparent"></div>
    </>
  );
};

/**
 * Compact Loading Spinner (for inline use)
 * Used within forms or smaller contexts
 */
export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* Spinner Container */}
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F9F9F7] to-white shadow-inner"></div>

        {/* Spinning gradient border */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#3B82F6] animate-spin" 
          style={{ 
            maskImage: 'linear-gradient(transparent 40%, black)', 
            WebkitMaskImage: 'linear-gradient(transparent 40%, black)' 
          }}
        ></div>

        {/* Inner circle */}
        <div className="absolute inset-2 rounded-full bg-white shadow-sm"></div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#3B82F6] text-[28px] animate-pulse">
            auto_awesome
          </span>
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center gap-3 max-w-md text-center">
        <h3 className="font-serif text-2xl text-[#2D2A26] font-medium tracking-tight">
          Crafting your Notes
        </h3>
        <p className="text-[#6E6B65] leading-relaxed font-light">
          Our AI is analyzing your question and generating a comprehensive explanation with visual aids...
        </p>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5 mt-2">
          <div 
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce" 
            style={{ animationDelay: '0ms' }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce" 
            style={{ animationDelay: '150ms' }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce" 
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
