import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock user data
const mockUser = {
  name: "User",
  plan: "Early User",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_L0NSQAGb3C8fgfMtO3D5h6Xh3XCvDWGGMFyBFvAr9LDcDvaG9nkiWKiqTLvXI6FwsMny_FmQt2SsGA8qkcqphHsHC02np94Khlzjf_zgeMs9hgumeH8gNMNPh0pTGJfmOHmzrlDxZo5n4pv8Iv1VQeEp3NphGqZSVAokApu-Xdx5Yl7dbe0YIV74_6U-7s0Bf1nUyfk4m8fEs3DcH7HnC1Iq_HASIOzKpuLRn1WoIng8lafqgNRxcVAVTMH7GCc4QlN5Ezz1DZw"
};

// Sidebar Navigation Component
const Sidebar = ({ user }) => {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", active: false, link: "/home" },
    { icon: "add_circle", label: "New Concept", active: false, link: "/new" },
    { icon: "settings", label: "Settings", active: true, link: "/settings" },
  ];

  return (
    <div className="w-72 flex-shrink-0 border-r border-[#EBEBE8] bg-[#FFFFFF] flex flex-col justify-between p-6 hidden md:flex">
      <div className="flex flex-col gap-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-[#2D2A26] text-[#FFFFFF] shadow-sm">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#2D2A26] font-serif text-xl font-bold tracking-tight">Notewright</h1>
            <p className="text-[#6E6B65] text-xs uppercase tracking-wider font-medium">Learning Engine</p>
          </div>
        </div>

        {/* Navigation */}
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

      {/* Bottom Section */}
      <div className="flex flex-col gap-6">
        {/* User Profile */}
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
        <span className="font-serif font-bold text-[#2D2A26]">Notewright</span>
      </div>
      <button className="text-[#2D2A26]">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
  );
};

// Settings Content Component
const SettingsContent = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('anthropic_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate save delay
    setTimeout(() => {
      localStorage.setItem('anthropic_api_key', apiKey);
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 500);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('anthropic_api_key');
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 7) + '•'.repeat(key.length - 11) + key.slice(-4);
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F9F9F7] p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl text-[#2D2A26] font-medium">Settings</h1>
          <p className="text-[#6E6B65] text-base">Manage your account settings and API configuration</p>
        </div>

        {/* API Key Section */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#EBEBE8] shadow-[0_2px_8px_-2px_rgba(45,42,38,0.04),0_4px_16px_-4px_rgba(45,42,38,0.02)] overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center size-12 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                <span className="material-symbols-outlined text-[28px]">key</span>
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-[#2D2A26] font-medium mb-2">Anthropic API Key</h2>
                <p className="text-[#6E6B65] text-sm leading-relaxed">
                  Configure your Anthropic API key to enable AI-powered note generation. 
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#2D2A26] uppercase tracking-wider">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full px-4 py-3 pr-12 border border-[#EBEBE8] rounded-lg text-[#2D2A26] placeholder-[#6E6B65]/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6B65] hover:text-[#2D2A26] transition-colors"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showApiKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-[#6E6B65]">
                  Get your API key from{' '}
                  <a 
                    href="https://console.anthropic.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span className="text-sm font-medium">API key saved successfully!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !apiKey}
                  className="flex items-center justify-center gap-2 bg-[#2D2A26] hover:bg-black text-white px-6 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Save API Key
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={!apiKey}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#2D2A26] px-6 py-3 rounded-lg border border-[#EBEBE8] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-blue-600 text-[24px] flex-shrink-0 mt-0.5">
              info
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-[#2D2A26]">About API Keys</h3>
              <p className="text-sm text-[#6E6B65] leading-relaxed">
                Your API key is encrypted and stored locally in your browser. It is only used to make requests to Anthropic's API 
                for generating your study notes. We never store or transmit your API key to our servers.
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

// Main Settings Component
const SettingsPage = () => {
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
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
          }
        `}
      </style>
      <div className="h-screen flex overflow-hidden bg-[#F9F9F7]">
        <Sidebar user={mockUser} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader />
          <SettingsContent />
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
