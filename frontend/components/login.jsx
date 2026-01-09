import React, { useState } from 'react';

// Logo Component
const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-[#2D2A26] rounded-lg flex items-center justify-center text-white shadow-sm">
      <span className="material-symbols-outlined">school</span>
    </div>
    <div>
      <h1 className="text-[#2D2A26] font-serif text-xl font-bold tracking-tight">Notewright</h1>
      <p className="text-[#6E6B65] text-xs uppercase tracking-wider font-medium">Learning Engine</p>
    </div>
  </div>
);

// Navbar Component
const Navbar = () => (
  <nav className="w-full bg-white border-b border-[#EBEBE8] px-8 py-4 flex items-center justify-between shadow-sm">
    <Logo />
    <div className="flex items-center gap-4">
      <a href="#" className="text-sm text-[#6E6B65] hover:text-[#2D2A26] transition-colors">Home</a>
      <a href="#" className="text-sm font-medium text-[#2D2A26] hover:underline">Sign up</a>
    </div>
  </nav>
);

// Input Field Component
const InputField = ({ label, id, type = "text", placeholder, className = "", value, onChange }) => (
  <div className={className}>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6B65] mb-2" htmlFor={id}>
      {label}
    </label>
    <input
      className="w-full bg-[#F9F9F7] border border-[#EBEBE8] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#6E6B65] focus:border-transparent outline-none transition-all placeholder:text-[#D6D6D3] text-[#2D2A26]"
      id={id}
      name={id}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
    />
  </div>
);

// Feature Badge Component
const FeatureBadge = ({ icon, text, color }) => (
  <div className="px-4 py-2 bg-white rounded-full border border-[#EBEBE8] flex items-center gap-2 shadow-sm text-sm text-[#6E6B65]">
    <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icon}
    </svg>
    <span>{text}</span>
  </div>
);

// Login Form Component
const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('Login successful!');
  };

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <div className="space-y-5">
      <InputField
        label="Email Address"
        id="email"
        type="email"
        placeholder="name@example.com"
        value={formData.email}
        onChange={handleInputChange('email')}
      />
      
      <InputField
        label="Password"
        id="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleInputChange('password')}
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <input
            className="rounded border-[#EBEBE8] text-[#2D2A26] focus:ring-[#6E6B65]"
            id="remember"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
          />
          <label className="text-xs text-[#6E6B65]" htmlFor="remember">
            Remember me
          </label>
        </div>
        <a className="text-xs text-[#2D2A26] hover:underline font-medium" href="#">
          Forgot password?
        </a>
      </div>

      <button
        className="w-full bg-[#2D2A26] hover:bg-black text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 hover:scale-[1.02] mt-2 flex justify-center items-center gap-2"
        onClick={handleSubmit}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Log in
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#EBEBE8]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-[#6E6B65] tracking-wider font-medium">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#EBEBE8] rounded-lg hover:bg-[#F9F9F7] transition-colors text-sm font-medium text-[#2D2A26]">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#EBEBE8] rounded-lg hover:bg-[#F9F9F7] transition-colors text-sm font-medium text-[#2D2A26]">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          GitHub
        </button>
      </div>
    </div>
  );
};

// Left Panel Component
const LeftPanel = () => (
  <div className="w-full lg:w-1/2 flex flex-col bg-white relative z-10 border-r border-[#EBEBE8] shadow-xl overflow-y-auto">
    <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight mb-3 text-[#2D2A26] leading-tight">
            Welcome back
          </h2>
          <p className="text-[#6E6B65] font-light text-base leading-relaxed">
            Log in to continue your learning journey.
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center border-t border-[#EBEBE8] pt-6">
          <p className="text-sm text-[#6E6B65]">
            Don't have an account? 
            <a className="font-semibold text-[#2D2A26] hover:underline ml-1" href="#">Sign up</a>
          </p>
        </div>
      </div>
    </div>
    
    <div className="text-xs text-[#6E6B65] text-center pb-6 px-8">
      © 2026 Notewright Inc.
    </div>
  </div>
);

// Right Panel Component
const RightPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 relative bg-[#F9F9F7] items-center justify-center p-12 overflow-hidden">
    {/* Grid Pattern Background */}
    <div 
      className="absolute inset-0 opacity-60"
      style={{
        backgroundSize: '24px 24px',
        backgroundImage: 'linear-gradient(to right, rgba(45, 42, 38, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 42, 38, 0.04) 1px, transparent 1px)',
        maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)'
      }}
    />
    
    {/* Ambient Blobs */}
    <div className="absolute top-20 right-20 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50"></div>
    <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-100 rounded-full blur-2xl opacity-40"></div>
    
    <div className="relative z-10 max-w-md">
      <h2 className="font-serif text-5xl md:text-6xl text-[#2D2A26] leading-tight mb-8 font-medium tracking-tight">
        Your thoughts, <br/>
        <span className="italic text-[#3B82F6]">visualized.</span>
      </h2>
      
      {/* Quote Card */}
      <div className="bg-white p-8 rounded-xl shadow-[0_20px_40px_-5px_rgba(45,42,38,0.06),0_10px_15px_-3px_rgba(45,42,38,0.03)] border border-[#EBEBE8]">
        <span className="text-4xl text-[#EBEBE8] font-serif leading-none">"</span>
        <p className="font-serif text-lg text-[#2D2A26] mb-6 italic relative -top-4 leading-relaxed">
          The soul never thinks without a picture.
        </p>
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-[#EBEBE8]"></div>
          <p className="text-xs font-bold tracking-widest text-[#6E6B65] uppercase">Aristotle</p>
        </div>
      </div>
      
      {/* Feature Badges */}
      <div className="flex gap-3 mt-12 flex-wrap">
        <FeatureBadge
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />}
          text="AI Generation"
          color="text-purple-500"
        />
        <FeatureBadge
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />}
          text="Math Support"
          color="text-emerald-500"
        />
        <FeatureBadge
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />}
          text="Organized"
          color="text-amber-500"
        />
      </div>
    </div>
  </div>
);

// Main App Component
export default function NotewrightLogin() {
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
        `}
      </style>
      <div className="bg-[#F9F9F7] text-[#2D2A26] font-sans h-screen flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel />
          <RightPanel />
        </div>
      </div>
    </>
  );
}
