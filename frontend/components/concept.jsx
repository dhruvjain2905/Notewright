import React, { useState } from 'react';
import { useApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingScreen, { LoadingSpinner } from './LoadingScreen';

// Mock user data (same as dashboard)
const mockUser = {
  name: "User",
  plan: "Early User",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_L0NSQAGb3C8fgfMtO3D5h6Xh3XCvDWGGMFyBFvAr9LDcDvaG9nkiWKiqTLvXI6FwsMny_FmQt2SsGA8qkcqphHsHC02np94Khlzjf_zgeMs9hgumeH8gNMNPh0pTGJfmOHmzrlDxZo5n4pv8Iv1VQeEp3NphGqZSVAokApu-Xdx5Yl7dbe0YIV74_6U-7s0Bf1nUyfk4m8fEs3DcH7HnC1Iq_HASIOzKpuLRn1WoIng8lafqgNRxcVAVTMH7GCc4QlN5Ezz1DZw"
};

// Sidebar Component (from dashboard)
const Sidebar = ({ user }) => {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", active: false , link: "/home"},
    { icon: "add_circle", label: "New Concept", active: true , link : "/new"},
    { icon: "settings", label: "Settings", active: false, link: "/settings" },
    //{ icon: "folder_open", label: "My Library", active: false, link: "/viewer"},
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
        <span className="font-serif font-bold text-[#2D2A26]">Notewright</span>
      </div>
      <button className="text-[#2D2A26]">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
  );
};

// Quick Suggestion Button Component
const SuggestionButton = ({ icon, iconColor, text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-[#6E6B65] bg-white hover:bg-gray-50 hover:text-[#2D2A26] border border-[#EBEBE8] hover:border-[#6E6B65] rounded-full transition-all shadow-sm"
    >
      <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>{icon}</span>
      {text}
    </button>
  );
};

// Main Create Concept Page
const CreateConceptPage = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 1000;
  const { makeRequest } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = React.useRef(null);
  const MAX_TOTAL_PAGES = 10;

  const handleQuestionChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setQuestion(value);
      setCharCount(value.length);
    }
  };

  const handleGenerate = async () => {
    if (!question.trim()) return;

    console.log('Generating explanation for:', question);
    console.log('With files:', uploadedFiles);
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('prompt', question);
      
      // Add all uploaded files
      uploadedFiles.forEach((fileData, index) => {
        formData.append('files', fileData.file);
      });

      const data = await makeRequest("generate-article", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
        headers: {}
      });
      
      // Navigate to the viewer page with the article ID
      if (data.id) {
        navigate(`/viewer?id=${data.id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to generate article.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    setQuestion(suggestionText);
    setCharCount(suggestionText.length);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setValidationError(null);
    const newFiles = [];
    let newPageCount = totalPageCount;

    for (const file of files) {
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isPDF = fileType === 'application/pdf';

      if (!isImage && !isPDF) {
        setValidationError(`File "${file.name}" is not a valid image or PDF`);
        continue;
      }

      let pageCount = 1; // Images count as 1 page
      
      if (isPDF) {
        // For PDFs, we'll use a library to count pages
        try {
          pageCount = await countPDFPages(file);
        } catch (err) {
          console.error('Error counting PDF pages:', err);
          setValidationError(`Could not read PDF "${file.name}"`);
          continue;
        }
      }

      if (newPageCount + pageCount > MAX_TOTAL_PAGES) {
        setValidationError(
          `Adding "${file.name}" would exceed the ${MAX_TOTAL_PAGES} page limit. Currently at ${newPageCount} pages.`
        );
        break;
      }

      newFiles.push({
        file,
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        pageCount,
        preview: isImage ? URL.createObjectURL(file) : null
      });
      newPageCount += pageCount;
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setTotalPageCount(newPageCount);
    }

    // Reset the input
    e.target.value = '';
  };

  const countPDFPages = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          // Simple PDF page count using regex to count /Type /Page occurrences
          const matches = data.match(/\/Type[\s]*\/Page[^s]/g);
          resolve(matches ? matches.length : 1);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeFile = (index) => {
    const fileToRemove = uploadedFiles[index];
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setTotalPageCount(prev => prev - fileToRemove.pageCount);
    setValidationError(null);
    
    // Clean up preview URL if it's an image
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  return (
    <>
      {/* Full-screen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#F9F9F7] z-50 flex items-center justify-center">
          <LoadingScreen 
            messages={[
              "Analyzing documents...",
              "Understanding your question...",
              "Generating visual explanations..."
            ]}
          />
        </div>
      )}
      
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

          .bg-math-paper {
            background-size: 24px 24px;
            background-image:
              linear-gradient(to right, rgba(45, 42, 38, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(45, 42, 38, 0.04) 1px, transparent 1px);
            mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
            -webkit-mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
          }
        `}
      </style>
      
      <div className="flex h-screen w-full overflow-hidden bg-[#F9F9F7]">
        <Sidebar user={mockUser} />
        
        {/* Background Grid Effect - only on main content area */}
        <div className="fixed inset-0 left-0 md:left-72 pointer-events-none z-0">
          <div className="absolute inset-0 bg-math-paper"></div>
        </div>
        
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
          <MobileHeader />
          
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl flex flex-col gap-10">
              
              {/* Header Section */}
              <div className="text-center space-y-5">
                
                
                <h1 className="font-serif text-5xl md:text-6xl text-[#2D2A26] font-medium tracking-tight leading-tight">
                  What shall we <br/>
                  <span className="italic text-[#3B82F6]">create</span> today?
                </h1>
                
                <p className="text-lg text-[#6E6B65] max-w-lg mx-auto font-light leading-relaxed">
                  Turn any topic into visual notes complete with animations, diagrams, and clear explanations.
                </p>
              </div>

              {/* Input Card */}
              <div className="group relative bg-white rounded-xl shadow-[0_20px_40px_-5px_rgba(45,42,38,0.06),0_10px_15px_-3px_rgba(45,42,38,0.03)] border border-[#EBEBE8] p-1 hover:shadow-[0_20px_40px_-5px_rgba(45,42,38,0.08),0_10px_15px_-3px_rgba(45,42,38,0.05)] transition-shadow duration-300">
                <div className="relative bg-white rounded-lg p-6 sm:p-8">
                  <div className="flex flex-col gap-4">
                    
                    {/* Label and Actions */}
                    <div className="flex justify-between items-center">
                      <label 
                        className="text-sm font-semibold text-[#6E6B65] uppercase tracking-wider flex items-center gap-2" 
                        htmlFor="question-input"
                      >
                        <span className="material-symbols-outlined text-[#3B82F6] text-lg">edit</span>
                        Input Question
                      </label>
                      
                      <div className="flex items-center gap-1">
                        <div className="relative group/tooltip">
                          <button 
                            onClick={handleImageUpload}
                            className="p-2 text-[#6E6B65] hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[28px]">upload_file</span>
                          </button>
                          {/* Custom Tooltip */}
                          <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none z-10">
                            <div className="bg-[#2D2A26] text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">upload</span>
                                <span>Upload file (PDF or Image)</span>
                              </div>
                              {/* Arrow */}
                              <div className="absolute -top-1 right-4 w-2 h-2 bg-[#2D2A26] transform rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      id="question-input"
                      value={question}
                      onChange={handleQuestionChange}
                      className="w-full bg-transparent border-0 p-0 text-[#2D2A26] placeholder:text-[#D6D6D3] text-xl md:text-2xl font-serif min-h-[140px] resize-none focus:ring-0 focus:outline-none transition-colors leading-relaxed"
                      placeholder="Type your question here, e.g., 'Explain the probability problem in the uploaded PDF in simple terms'..."
                    />

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Uploaded Files Display */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-semibold text-[#6E6B65] uppercase tracking-wider">
                          Uploaded Files ({totalPageCount}/{MAX_TOTAL_PAGES} pages)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {uploadedFiles.map((fileData, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg group hover:bg-blue-100 transition-colors"
                            >
                              {fileData.type === 'image' && fileData.preview && (
                                <img
                                  src={fileData.preview}
                                  alt={fileData.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              )}
                              <span className="material-symbols-outlined text-[16px] text-[#3B82F6]">
                                {fileData.type === 'pdf' ? 'picture_as_pdf' : 'image'}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-sm text-[#2D2A26] font-medium max-w-[150px] truncate">
                                  {fileData.name}
                                </span>
                                <span className="text-xs text-[#6E6B65]">
                                  {fileData.pageCount} {fileData.pageCount === 1 ? 'page' : 'pages'}
                                </span>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="ml-2 p-1 text-[#6E6B65] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Remove file"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Error */}
                    {validationError && (
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-700">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                        <span className="text-xs">{validationError}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#EBEBE8] mt-2">

                      <div className={`text-xs font-mono ${charCount > maxChars * 0.9 ? 'text-amber-500' : 'text-[#D6D6D3]'}`}>
                        {charCount}/{maxChars}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button and Actions */}
              <div className="flex flex-col items-center gap-8 w-full">
                <button
                  onClick={handleGenerate}
                  disabled={!question.trim() || isLoading}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white transition-all duration-300 bg-[#2D2A26] rounded-full hover:bg-black hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D2A26] w-full sm:w-auto min-w-[240px] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="material-symbols-outlined mr-2 group-hover:rotate-12 transition-transform">school</span>
                  Generate Notes
                </button>

                {/* Quick Suggestions */}
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                  <SuggestionButton
                    icon="science"
                    iconColor="text-purple-500"
                    text="Quantum Entanglement"
                    onClick={() => handleSuggestionClick("Explain quantum entanglement in simple terms")}
                  />
                  <SuggestionButton
                    icon="calculate"
                    iconColor="text-emerald-500"
                    text="Solve for X"
                    onClick={() => handleSuggestionClick("Solve the equation: 2x² + 5x - 3 = 0")}
                  />
                  <SuggestionButton
                    icon="summarize"
                    iconColor="text-amber-500"
                    text="Summarize Theorem"
                    onClick={() => handleSuggestionClick("Summarize the Pythagorean theorem and its applications")}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="w-full max-w-2xl px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="text-center pb-8">
                <p className="text-sm text-[#6E6B65] flex items-center justify-center gap-2 font-light">
                  <span className="material-symbols-outlined text-lg text-amber-500">lightbulb</span>
                  <span>Pro tip: Upload PDFs or images (max 10 pages total) for visual analysis.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateConceptPage;