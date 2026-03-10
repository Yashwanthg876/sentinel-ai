import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiBell, FiUser, FiChevronLeft, FiChevronRight,
  FiHome, FiMessageSquare, FiBriefcase, FiClock, FiFileText, FiSettings,
  FiSend, FiPaperclip, FiMic, FiLogOut, FiCheckCircle, FiAlertTriangle, FiActivity, FiX, FiImage, FiShield
} from "react-icons/fi";

export default function App() {
  const [activeTab, setActiveTab] = useState("assistant");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "System Online. **SentinelAI** Cyber Incident Assistance initialized. How can I assist you today?",
      issue_type: null,
      severity_level: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [isListening, setIsListening] = useState(false);
  const [responseLength, setResponseLength] = useState("detailed");

  // Cases State
  const [cases, setCases] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, filePreview]);

  useEffect(() => {
    if (token) fetchCases();
  }, [token, activeTab]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.access_token);
        localStorage.setItem("token", data.access_token);
      } else {
        alert(data.detail || "Authentication Failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setCases([]);
    setMessages([{ sender: "bot", text: "Logged out. System reset.", issue_type: null }]);
  };

  const fetchCases = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/cases", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      } else if (response.status === 401) handleLogout();
    } catch (e) {
      console.error("Failed to fetch cases");
    }
  };

  const createCase = async (issueType, severity, description) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ issue_type: issueType, severity: severity, description: description })
      });
      if (!response.ok && response.status === 401) return handleLogout();
      const data = await response.json();
      fetchCases();
      alert(`Case ${data.case_id} registered successfully.`);
    } catch (e) {
      alert("Error tracking case.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Invalid image file.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadEvidence = async () => {
    if (!selectedFile || isLoading || !token) return;
    setMessages(prev => [...prev, { sender: "user", text: "🖼️ Uploaded Evidence", image: filePreview }]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("language", selectedLanguage);
    removeFile();

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-evidence", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok && response.status === 401) return handleLogout();
      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { sender: "bot", text: `⚠️ **Error Processing Evidence:**\n${data.error}` }]);
        setIsLoading(false);
        return;
      }

      const entitiesMd = data.extracted_entities?.length > 0 ? data.extracted_entities.map(e => `- \`${e}\``).join('\n') : "- None detected";
      const patternsMd = data.fraud_patterns?.length > 0 ? data.fraud_patterns.map(p => `- ${p}`).join('\n') : "- None detected";

      const botText = `### 🔍 Evidence Analysis Complete\n\n**Extracted Entities:**\n${entitiesMd}\n\n**Fraud Patterns:**\n${patternsMd}\n\n---\n**Suggested Next Steps:**\n${data.suggested_next_steps}`;

      setMessages(prev => [...prev, {
        sender: "bot",
        text: botText,
        issue_type: "Evidence Analysis",
        severity_level: data.risk_level,
        description: "Evidence Upload: " + (data.fraud_patterns?.[0] || "Suspicious content")
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ **Connection Error**" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support Speech Recognition.");

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === "en" ? "en-US" : selectedLanguage === "hi" ? "hi-IN" : selectedLanguage === "ta" ? "ta-IN" : "te-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const sendMessage = async () => {
    if (selectedFile) return await uploadEvidence();
    if (!input.trim() || isLoading) return;

    const currentUserInput = input;
    setMessages(prev => [...prev, { sender: "user", text: currentUserInput }]);
    setInput("");
    setIsLoading(true);

    try {
      const historyToSend = messages.filter(msg => msg.text && msg.sender).map(msg => ({ sender: msg.sender, text: msg.text }));
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question: currentUserInput, language: selectedLanguage, agent: selectedAgent, history: historyToSend, response_length: responseLength })
      });

      if (!response.ok && response.status === 401) return handleLogout();
      const data = await response.json();

      setMessages(prev => [...prev, {
        sender: "bot",
        text: data.answer || data.response || "No response generated.",
        issue_type: data.issue_type,
        severity_level: data.severity_level,
        confidence: data.confidence,
        description: currentUserInput
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ **Connection Error**" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-bgMain text-slate-100 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-bgPanel p-10 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center mb-8 relative z-10">
            <FiShield size={48} className="text-primary mb-3 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
            <h2 className="text-2xl font-black tracking-widest text-white">SENTINEL<span className="text-primary">AI</span></h2>
            <p className="text-slate-400 text-xs tracking-[0.2em] mt-1">SECURE ACCESS</p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5 relative z-10">
            <div className="relative group">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input type="email" placeholder="Operator Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="relative group">
              <FiActivity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input type="password" placeholder="Passcode" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <button type="submit" className="mt-2 text-[13px] bg-gradient-to-r from-sky-500 to-primary hover:from-sky-400 hover:to-sky-300 text-slate-900 font-bold tracking-widest uppercase py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:-translate-y-0.5">
              {authMode === "login" ? "Authenticate" : "Initialize"}
            </button>
          </form>

          <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full mt-6 text-[11px] font-medium tracking-wide text-slate-500 hover:text-white transition-colors relative z-10 uppercase">
            {authMode === "login" ? "Request new access credentials" : "Return to active authentication"}
          </button>
        </motion.div>
      </div>
    );
  }

  // Right Panel Derived State
  const lastBotMsg = [...messages].reverse().find(m => m.sender === "bot" && m.issue_type);
  const currentRisk = lastBotMsg?.severity_level || "Standby";
  const currentIssue = lastBotMsg?.issue_type || "Awaiting Data";

  const rawBotText = lastBotMsg?.text || "";
  const evidenceChecklist = Array.from(rawBotText.matchAll(/(?:Evidence|Upload|Provide|Collect|Needed).*?[:\n]-*\s*([^\n]+)/gi)).map(m => m[1]) || [];

  const riskColors = {
    "Critical": "text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    "High": "text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    "Medium": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
    "Low": "text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    "Standby": "text-slate-400 border-slate-700 bg-slate-800"
  };

  const navItems = [
    { id: 'dashboard', icon: <FiHome size={20} />, label: 'Dashboard' },
    { id: 'assistant', icon: <FiMessageSquare size={20} />, label: 'AI Assistant' },
    { id: 'cases', icon: <FiBriefcase size={20} />, label: 'My Cases' },
    { id: 'history', icon: <FiClock size={20} />, label: 'History' },
    { id: 'reports', icon: <FiFileText size={20} />, label: 'Reports' },
    { id: 'settings', icon: <FiSettings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-bgMain text-slate-100 overflow-hidden font-sans selection:bg-primary/30 antialiased">

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className={`border-r border-slate-700/50 bg-bgPanel flex flex-col transition-all duration-300 z-20 shadow-xl ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/50">
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
              <FiShield className="text-primary text-2xl drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
              <span className="font-bold text-lg tracking-widest text-white">SENTINEL<span className="text-primary">AI</span></span>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <FiShield className="text-primary text-2xl mx-auto drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-slate-400 hover:text-white absolute right-[-14px] top-6 bg-slate-700 border border-slate-600 rounded-full p-0.5 shadow-lg">
            {sidebarCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3.5 p-3 rounded-xl transition-all text-[14px] font-medium group
                ${activeTab === item.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' : 'text-slate-400 border border-transparent hover:text-slate-100 hover:bg-slate-800'}`}>
              <span className={`min-w-fit flex justify-center transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              {!sidebarCollapsed && <span className="tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
          <button onClick={handleLogout} className={`flex items-center gap-3.5 w-full p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <FiLogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium tracking-wide">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b1120]">

        {/* 1. TOP NAVIGATION BAR */}
        <header className="h-16 border-b border-slate-700/50 bg-bgPanel/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 w-[450px]">
            <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 w-full focus-within:border-primary focus-within:ring-1 ring-primary transition-all shadow-inner">
              <FiSearch className="text-slate-400" />
              <input type="text" placeholder="Search knowledge base, cases, SOPs..." className="bg-transparent border-none text-[13px] outline-none w-full placeholder-slate-500 text-slate-200 font-mono tracking-wide" />
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button className="hover:text-primary transition-colors relative">
              <FiBell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bgPanel"></span>
            </button>

            <div className="h-6 w-px bg-slate-700"></div>

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{authEmail.split('@')[0]}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lvl 3 Operator</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.4)] ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                {authEmail.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* 3 & 4 WORKSPACE AREA + CONTEXT PANEL */}
        <div className="flex-1 flex overflow-hidden">

          {/* 3. MAIN WORKSPACE */}
          <main className="flex-1 relative flex flex-col h-full z-0 min-w-0">
            {activeTab === 'dashboard' && (
              <div className="p-10 overflow-y-auto h-full scrollbar-thin">
                <h2 className="text-3xl font-light mb-10 text-white tracking-wide">Workspace <b className="font-bold border-b-2 border-primary pb-1">Dashboard</b></h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiBriefcase size={16} className="text-sky-400" /> Active Incidents</div>
                    <div className="text-4xl font-black text-white">{cases.filter(c => c.status !== 'Resolved').length || 0}</div>
                  </div>
                  <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiCheckCircle size={16} className="text-green-400" /> Resolved</div>
                    <div className="text-4xl font-black text-white">{cases.filter(c => c.status === 'Resolved').length || 0}</div>
                  </div>
                  <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiActivity size={16} className="text-indigo-400" /> System Status</div>
                    <div className="text-4xl font-black text-sky-400 font-mono tracking-tight flex items-center gap-2"><div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></div> 100%</div>
                  </div>
                </div>

                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-slate-700/50 pb-4 text-slate-300">Incident Timeline</h3>
                  {cases.length === 0 ? <p className="text-slate-500 text-sm font-mono mt-4">No recent activity detected.</p> :
                    <div className="flex flex-col gap-3">
                      {cases.slice(0, 5).map(c => (
                        <div key={c.case_id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-primary text-xs font-mono bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">{c.case_id}</span>
                            <div>
                              <div className="text-[15px] font-semibold text-slate-200">{c.issue_type}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-1">Status: {c.status}</div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{new Date(c.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="p-10 overflow-y-auto h-full scrollbar-thin">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-wide"><FiBriefcase className="text-primary" /> Recorded Incidents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cases.map(c => (
                    <div key={c.case_id} className="bg-bgPanel border border-slate-700 rounded-2xl p-6 hover:border-primary/50 transition-colors shadow-lg hover:shadow-[0_0_15px_rgba(56,189,248,0.1)] flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-600">{c.case_id}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${riskColors[c.severity] || riskColors['Standby']}`}>{c.severity}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-white">{c.issue_type}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed flex-1">"{c.description}"</p>
                      <div className="mt-5 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                        <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5"><FiCheckCircle className="text-primary" /> {c.status}</span>
                        <span className="text-[11px] font-mono text-slate-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assistant' && (
              <div className="flex flex-col h-full relative">
                <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[bottom_1px_center] z-0 pointer-events-none"></div>

                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0b1120] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-[92px] left-0 right-0 h-10 bg-gradient-to-t from-[#0b1120] to-transparent z-10 pointer-events-none"></div>

                <div className="flex-1 overflow-y-auto scrollbar-thin p-8 flex flex-col gap-6 z-0">
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-5 text-[15px] leading-relaxed shadow-lg ${msg.sender === 'user'
                            ? 'bg-gradient-to-br from-indigo-500/20 to-primary/10 border border-primary/30 text-white rounded-br-sm backdrop-blur-sm'
                            : 'bg-bgPanel/80 backdrop-blur-md border border-slate-700 text-slate-200 rounded-bl-sm'
                          }`}>
                          <div className="flex items-center gap-2 mb-3 text-[11px] font-bold tracking-widest uppercase opacity-70">
                            {msg.sender === 'bot' ? <FiShield className="text-primary" /> : <FiUser className="text-primary" />}
                            {msg.sender === 'bot' ? 'SENTINEL-AI' : 'OPERATOR'}
                          </div>
                          <div className="prose prose-invert prose-p:my-2 prose-pre:bg-[#0f172a] prose-pre:border prose-pre:border-slate-700 prose-pre:text-sm prose-li:my-1 prose-headings:text-primary max-w-none prose-a:text-sky-400 font-medium">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                          {msg.image && <img src={msg.image} alt="Evidence" className="mt-4 rounded-lg border border-slate-600 max-w-sm w-full shadow-md" />}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start w-full">
                        <div className="bg-bgPanel/80 backdrop-blur-md border border-slate-700 rounded-2xl rounded-bl-sm p-5 flex gap-3 items-center text-primary text-sm shadow-lg w-[200px]">
                          <span className="font-mono text-[11px] uppercase tracking-widest font-bold">ANALYZING</span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* THE CHAT INPUT BAR */}
                <div className="shrink-0 p-6 bg-bgMain/80 backdrop-blur-md border-t border-slate-700 z-10 w-full relative">
                  {filePreview && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-14 left-6 flex items-center gap-3 bg-slate-800 border border-slate-600 px-4 py-2 rounded-xl shadow-lg">
                      <FiImage className="text-primary" /> <span className="text-xs font-medium text-slate-200">Evidence ready</span>
                      <button onClick={removeFile} className="text-slate-400 hover:text-red-400 ml-2 bg-slate-700 rounded-full p-1"><FiX size={12} /></button>
                    </motion.div>
                  )}
                  <div className="flex items-center gap-3 bg-bgPanel border border-slate-600 rounded-2xl p-2.5 focus-within:border-primary focus-within:ring-1 ring-primary/50 transition-all shadow-xl max-w-5xl mx-auto">
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="image/*" />
                    <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors">
                      <FiPaperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Input query parameters or paste evidence data..."
                      className="flex-1 bg-transparent border-none outline-none text-[15px] px-3 placeholder-slate-500 font-mono tracking-tight"
                      disabled={isLoading || selectedFile}
                    />

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-transparent text-[11px] text-slate-400 border-none outline-none font-bold uppercase tracking-widest cursor-pointer hover:text-slate-200">
                      <option className="bg-bgPanel text-slate-200" value="en">ENG</option>
                      <option className="bg-bgPanel text-slate-200" value="hi">HIN</option>
                      <option className="bg-bgPanel text-slate-200" value="ta">TAM</option>
                      <option className="bg-bgPanel text-slate-200" value="te">TEL</option>
                    </select>

                    <button className={`p-2.5 rounded-xl transition-all ${isListening ? 'text-red-400 bg-red-400/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} onClick={startListening}>
                      <FiMic size={20} />
                    </button>
                    <button onClick={sendMessage} disabled={(!input && !selectedFile) || isLoading}
                      className="p-3 bg-primary text-slate-900 rounded-xl hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_10px_rgba(56,189,248,0.3)] hover:shadow-[0_4px_15px_rgba(56,189,248,0.5)]">
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(activeTab !== 'dashboard' && activeTab !== 'cases' && activeTab !== 'assistant') && (
              <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm uppercase flex-col gap-5">
                <div className="relative">
                  <FiSettings size={64} className="opacity-20 animate-[spin_10s_linear_infinite]" />
                  <FiSettings size={32} className="opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_8s_linear_infinite_reverse]" />
                </div>
                <span className="tracking-[0.3em] font-bold">MODULE CALIBRATING</span>
              </div>
            )}
          </main>

          {/* 4. CONTEXT PANEL (Right Sidebar) */}
          <aside className="w-[320px] bg-bgPanel/95 backdrop-blur-xl border-l border-slate-700/80 flex flex-col shrink-0 overflow-y-auto scrollbar-thin relative z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] hidden lg:flex">

            <div className="p-6 border-b border-slate-700/50 bg-[#162032]">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiAlertTriangle size={14} className="text-yellow-500" /> Threat Context</h3>

              <div className={`flex flex-col gap-1 p-4 rounded-xl border font-bold text-xs uppercase tracking-widest ${riskColors[currentRisk]}`}>
                <span className="opacity-60 text-[10px]">THREAT LEVEL</span>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${currentRisk !== 'Standby' ? 'bg-current shadow-[0_0_8px_currentColor] animate-pulse' : 'bg-slate-500'}`}></div>
                  {currentRisk}
                </div>
              </div>

              <div className="mt-4 bg-[#0f172a] border border-slate-700 p-4 rounded-xl font-mono text-[13px] text-slate-200 border-l-4 border-l-primary shadow-inner">
                <span className="block text-[10px] text-slate-500 mb-1 opacity-70">CLASSIFICATION</span>
                {currentIssue}
              </div>
            </div>

            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiActivity size={14} className="text-primary" /> Resolution Track</h3>
              <div className="h-1.5 w-full bg-[#0f172a] rounded-full overflow-hidden mb-4 border border-slate-700/50">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-primary w-[35%] shadow-[0_0_10px_rgba(56,189,248,0.8)] rounded-full"></div>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                {currentIssue === 'Awaiting Data' ? 'Awaiting incident log parsing...' : 'Guidance active. Awaiting operator input/evidence.'}
              </p>
            </div>

            <div className="p-6 border-b border-slate-700/50 flex-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiFileText size={14} className="text-sky-400" /> Context Required</h3>
              <ul className="flex flex-col gap-3">
                {evidenceChecklist.length > 0 ? evidenceChecklist.map((item, i) => (
                  <motion.li initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i}
                    className="bg-slate-800/40 p-3 rounded-xl border border-slate-600 text-[12px] text-slate-300 flex items-start gap-3 shadow-sm hover:border-primary/50 transition-colors">
                    <span className="mt-0.5 min-w-[16px] flex justify-center text-primary"><FiCheckCircle size={14} /></span>
                    <span className="leading-snug">{item}</span>
                  </motion.li>
                )) : (
                  <li className="p-6 border border-dashed border-slate-600 rounded-xl text-center flex flex-col items-center gap-2 text-slate-500">
                    <FiCheckCircle size={20} className="className-20 opacity-30" />
                    <span className="text-xs font-medium">No prerequisites detected.</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="p-6 bg-slate-900/30">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Action Panel</h3>
              <button
                disabled={currentIssue === "Awaiting Data" || currentIssue === "Unknown"}
                onClick={() => createCase(currentIssue, currentRisk, input || "Tracked from incident module.")}
                className="w-full flex justify-center items-center gap-2 bg-primary/10 text-primary border border-primary/30 py-3.5 rounded-xl text-[11px] font-black tracking-widest hover:bg-primary hover:text-slate-900 transition-all disabled:opacity-30 disabled:pointer-events-none mb-3 shadow-md hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] uppercase"
              >
                <FiBriefcase size={16} /> Log as Case
              </button>
              <button className="w-full flex justify-center items-center gap-2 bg-slate-800 text-slate-300 border border-slate-600 py-3.5 rounded-xl text-[11px] font-bold tracking-widest hover:bg-slate-700 transition-all shadow-sm uppercase">
                Download Report
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
