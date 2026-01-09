
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Data types for future backend integration
const mockUser = {
  name: "User",
  plan: "Early User",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_L0NSQAGb3C8fgfMtO3D5h6Xh3XCvDWGGMFyBFvAr9LDcDvaG9nkiWKiqTLvXI6FwsMny_FmQt2SsGA8qkcqphHsHC02np94Khlzjf_zgeMs9hgumeH8gNMNPh0pTGJfmOHmzrlDxZo5n4pv8Iv1VQeEp3NphGqZSVAokApu-Xdx5Yl7dbe0YIV74_6U-7s0Bf1nUyfk4m8fEs3DcH7HnC1Iq_HASIOzKpuLRn1WoIng8lafqgNRxcVAVTMH7GCc4QlN5Ezz1DZw"
};

const mockStats = {
  generationsUsed: 0,
  generationsTotal: 50,
  refillDays: 0
};

// Sidebar Navigation Component
const Sidebar = ({ user }) => {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", active: true , link: "/home"},
    { icon: "add_circle", label: "New Concept", active: false , link : "/new"},
    //{ icon: "folder_open", label: "My Library", active: false, link: "/viewer"},
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

// Stats Card Component
const StatsCard = ({ stats, onViewHistory }) => {

  
  return (
    <div className="md:col-span-2 bg-[#FFFFFF] rounded-xl border border-[#EBEBE8] p-8 shadow-[0_2px_8px_-2px_rgba(45,42,38,0.04),0_4px_16px_-4px_rgba(45,42,38,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 relative overflow-hidden group hover:border-[#D6D6D3] transition-colors">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col gap-2 z-10 ml-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[#3B82F6] text-lg">bolt</span>
          <span className="text-xs font-semibold tracking-widest text-[#6E6B65] uppercase">Recent Activity</span>
        </div>
        <div className="flex items-end gap-4">
          <span className="font-serif text-6xl text-[#2D2A26] font-medium tracking-tight">{stats.generationsUsed}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 mb-2">
            Total Notes
          </span>
        </div>
        <p className="text-[#6E6B65] text-sm mt-1">
          Last created: <span className="text-[#2D2A26] font-medium">{stats.refillDays} days ago</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full sm:w-auto z-10">
        <a
          href = "/new"
          className="flex items-center justify-center gap-2 bg-[#2D2A26] hover:bg-black text-white px-6 py-3.5 rounded-lg shadow-sm transition-all w-full sm:w-auto font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Notes
        </a>

      </div>
    </div>
  );
};

// Quote Card Component
const QuoteCard = () => {
  return (
    <div className="hidden md:flex flex-col justify-center h-full gap-4 p-8 border-l border-[#EBEBE8] bg-[#FFFFFF]/50 rounded-r-xl">
      <span className="material-symbols-outlined text-[#6E6B65]/30 text-4xl">format_quote</span>
      <p className="font-serif text-[#2D2A26] italic text-lg leading-relaxed">
        "If I can't picture it. I can't understand it."
      </p>
      <p className="text-sm text-[#6E6B65] font-medium uppercase tracking-wide">— Albert Einstein</p>
    </div>
  );
};

// Concept Row Component
const ConceptRow = ({ concept, onClick }) => {
  // Use consistent blue color for all articles
  const iconColorClass = 'bg-blue-50 text-blue-600 border-blue-100';

  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return date.toLocaleDateString();
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick?.(concept);
      }}
      className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50/80 transition-colors"
    >
      <div className="col-span-1 md:col-span-6 flex items-start gap-4">
        <div className={`hidden sm:flex items-center justify-center size-10 rounded-full ${iconColorClass} flex-shrink-0 mt-0.5`}>
          <span className="material-symbols-outlined text-[20px]">school</span>
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#2D2A26] group-hover:text-[#3B82F6] transition-colors">
            {concept.title}
          </h3>
          <p className="text-sm text-[#6E6B65] line-clamp-1 mt-1 font-light">{concept.subtitle || concept.description}</p>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2 flex items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          {concept.subject}
        </span>
      </div>
      <div className="col-span-1 md:col-span-3 text-sm text-[#6E6B65] font-medium">
        {formatDate(concept.date_created || concept.createdAt)}
      </div>
      <div className="hidden md:flex col-span-1 justify-end">
        <span className="material-symbols-outlined text-[#6E6B65]/50 group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all">
          arrow_forward
        </span>
      </div>
    </a>
  );
};

// Concepts List Component
const ConceptsList = ({ concepts, onConceptClick, onSearch, onViewAll, showAll, totalCount, searchQuery }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-[#2D2A26] font-medium">Recent Notes</h2>
          <p className="text-[#6E6B65] mt-1 text-sm">Review your previously generated study materials.</p>
        </div>
        <div className="relative group w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-0 text-[#6E6B65] group-focus-within:text-[#2D2A26] transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="w-full bg-transparent border-b border-[#EBEBE8] text-[#2D2A26] placeholder-[#6E6B65]/60 py-2 pl-8 pr-0 focus:outline-none focus:border-[#3B82F6] transition-all text-sm font-medium"
            placeholder="Search your library..."
            type="text"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {concepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-[#FFFFFF] rounded-xl border border-[#EBEBE8] shadow-[0_2px_8px_-2px_rgba(45,42,38,0.04),0_4px_16px_-4px_rgba(45,42,38,0.02)]">
          <span className="material-symbols-outlined text-[#6E6B65] text-5xl">search_off</span>
          <p className="text-[#6E6B65]">
            {searchQuery ? 'No articles found matching your search.' : 'No articles yet. Create your first concept to get started!'}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#EBEBE8] shadow-[0_2px_8px_-2px_rgba(45,42,38,0.04),0_4px_16px_-4px_rgba(45,42,38,0.02)] overflow-hidden divide-y divide-[#EBEBE8]">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 text-xs font-bold text-[#6E6B65] uppercase tracking-wider">
              <div className="col-span-6">Topic</div>
              <div className="col-span-2">Subject</div>
              <div className="col-span-3">Created</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows */}
            {concepts.map((concept) => (
              <ConceptRow key={concept.id} concept={concept} onClick={onConceptClick} />
            ))}
          </div>

          {/* View All Button - Only show if there are more than 5 concepts */}
          {totalCount > 5 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={onViewAll}
                className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#EBEBE8] hover:border-[#6E6B65] text-[#2D2A26] text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                {showAll ? 'Show less' : `View all generated concepts (${totalCount})`}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showAll ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState([]);
  const [filteredConcepts, setFilteredConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Calculate dynamic stats based on articles
  const calculateStats = (articles) => {
    if (articles.length === 0) {
      return {
        generationsUsed: 0,
        generationsTotal: 50,
        refillDays: 0
      };
    }

    // Find the most recent article
    const latestArticle = articles[0]; // Already reversed, so first is latest
    const latestDate = new Date(latestArticle.date_created || latestArticle.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));

    return {
      generationsUsed: articles.length,
      generationsTotal: 50,
      refillDays: diffDays
    };
  };

  const [dynamicStats, setDynamicStats] = useState(mockStats);

  // Fetch articles from backend on mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/articles');
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        const data = await response.json();
        // Reverse the array to show latest articles first
        const reversedData = data.reverse();
        setConcepts(reversedData);
        setFilteredConcepts(reversedData);
        // Update stats with actual data
        setDynamicStats(calculateStats(reversedData));
      } catch (err) {
        setError(err.message);
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleCreateConcept = () => {
    console.log('Create concept clicked');
    // Future: navigate to create concept page or open modal
  };

  const handleViewHistory = () => {
    console.log('View history clicked');
    // Future: navigate to history page
  };

  const handleConceptClick = (concept) => {
    console.log('Concept clicked:', concept);
    // Navigate to viewer page with article ID
    navigate(`/viewer?id=${concept.id}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredConcepts(concepts);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = concepts.filter((concept) => {
      return (
        concept.title?.toLowerCase().includes(lowercaseQuery) ||
        concept.description?.toLowerCase().includes(lowercaseQuery) ||
        concept.subtitle?.toLowerCase().includes(lowercaseQuery) ||
        concept.subject?.toLowerCase().includes(lowercaseQuery)
      );
    });

    setFilteredConcepts(filtered);
    // Reset showAll when searching
    setShowAll(false);
  };

  const handleViewAll = () => {
    setShowAll(!showAll);
  };

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
      <div className="flex h-screen w-full overflow-hidden bg-[#F9F9F7]">
        <Sidebar user={mockUser} />
        
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#F9F9F7]">
          <MobileHeader />
          
          <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-16 flex flex-col gap-12">
            {/* Welcome Section */}
            <div className="flex flex-col gap-4 border-b border-[#EBEBE8] pb-8">
              <h1 className="font-serif text-4xl md:text-5xl text-[#2D2A26] font-medium leading-tight">
                Welcome back, {mockUser.name.split(' ')[0]}.
              </h1>
              <p className="text-[#6E6B65] text-lg font-light max-w-2xl leading-relaxed">
                Your canvas awaits. You have fresh generations available to help you transform any topic into rich visual notes.
              </p>
            </div>

            {/* Stats and Quote Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              <StatsCard
                stats={dynamicStats}
                onCreateConcept={handleCreateConcept}
                onViewHistory={handleViewHistory}
              />
              <QuoteCard />
            </div>

            {/* Concepts List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-[#6E6B65]">Loading articles...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-red-600">Error: {error}</div>
              </div>
            ) : (
              <ConceptsList
                concepts={showAll ? filteredConcepts : filteredConcepts.slice(0, 5)}
                onConceptClick={handleConceptClick}
                onSearch={handleSearch}
                onViewAll={handleViewAll}
                showAll={showAll}
                totalCount={filteredConcepts.length}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;