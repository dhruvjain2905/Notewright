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

// Sign Up Form Component
const SignUpForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    anthropicKey: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const handleSubmit = () => {
    if (!formData.agreedToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Form submitted:', formData);
    alert('Account created successfully!');
  };

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <div className="space-y-5">
      <InputField
        label="Full Name"
        id="name"
        placeholder="e.g. John Smith"
        value={formData.name}
        onChange={handleInputChange('name')}
      />
      
      <InputField
        label="Email Address"
        id="email"
        type="email"
        placeholder="name@example.com"
        value={formData.email}
        onChange={handleInputChange('email')}
      />
      
      <div>
        <InputField
          label="Anthropic API Key"
          id="anthropicKey"
          type="password"
          placeholder="sk-ant-api03-..."
          value={formData.anthropicKey}
          onChange={handleInputChange('anthropicKey')}
        />
        <div className="mt-1.5 text-xs text-[#6E6B65]">
          Don't have one? <a 
            href="https://console.anthropic.com/settings/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#3B82F6] hover:text-[#2563EB] underline transition-colors"
          >
            How do I get one?
          </a>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-5">
        <InputField
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          className="w-full"
          value={formData.password}
          onChange={handleInputChange('password')}
        />
        <InputField
          label="Confirm"
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          className="w-full"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          className="rounded border-[#EBEBE8] text-[#2D2A26] focus:ring-[#6E6B65]"
          id="terms"
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})}
        />
        <label className="text-xs text-[#6E6B65]" htmlFor="terms">
          I agree to the <a className="underline hover:text-[#2D2A26] transition-colors" href="#">Terms of Service</a> and <a className="underline hover:text-[#2D2A26] transition-colors" href="#">Privacy Policy</a>.
        </label>
      </div>

      <button
        className="w-full bg-[#2D2A26] hover:bg-black text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 hover:scale-[1.02] mt-2 flex justify-center items-center gap-2"
        onClick={handleSubmit}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Create Account
      </button>
    </div>
  );
};

// Navbar Component
const Navbar = () => (
  <nav className="w-full bg-white border-b border-[#EBEBE8] px-8 py-4 flex items-center justify-between shadow-sm">
    <Logo />
    <div className="flex items-center gap-4">
      <a href="#" className="text-sm text-[#6E6B65] hover:text-[#2D2A26] transition-colors">Home</a>
      <a href="#" className="text-sm font-medium text-[#2D2A26] hover:underline">Log in</a>
    </div>
  </nav>
);

// Left Panel Component
const LeftPanel = () => (
  <div className="w-full lg:w-1/2 flex flex-col bg-white relative z-10 border-r border-[#EBEBE8] shadow-xl overflow-y-auto">
    <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight mb-3 text-[#2D2A26] leading-tight">
            Join the canvas
          </h2>
          <p className="text-[#6E6B65] font-light text-base leading-relaxed">
            Start transforming complex topics into beautiful visual notes today.
          </p>
        </div>
        
        <SignUpForm />
        
        <div className="mt-6 text-center border-t border-[#EBEBE8] pt-6">
          <p className="text-sm text-[#6E6B65]">
            Already have an account? 
            <a className="font-semibold text-[#2D2A26] hover:underline ml-1" href="#">Log in</a>
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
export default function NotewrightSignUp() {
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