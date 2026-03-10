import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Send, Paperclip, X, Image as ImageIcon,
  Briefcase, MessageSquare, ClipboardList, CheckCircle, Mic,
  Home, Clock, User, Activity, ShieldAlert, FileText, ChevronRight, LogOut
} from "lucide-react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

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
      } else {
        if (response.status === 401) handleLogout();
      }
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
        body: JSON.stringify({
          issue_type: issueType,
          severity: severity,
          description: description
        })
      });
      if (!response.ok) {
        if (response.status === 401) handleLogout();
        return;
      }
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
    const userMessage = { sender: "user", text: "🖼️ Uploaded Evidence", image: filePreview };
    setMessages((prev) => [...prev, userMessage]);
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
        setMessages((prev) => [...prev, { sender: "bot", text: `⚠️ **Error Processing Evidence:**\n${data.error}` }]);
        setIsLoading(false);
        return;
      }

      const entitiesMd = data.extracted_entities?.length > 0 ? data.extracted_entities.map(e => `- \`${e}\``).join('\n') : "- None detected";
      const patternsMd = data.fraud_patterns?.length > 0 ? data.fraud_patterns.map(p => `- ${p}`).join('\n') : "- None detected";

      const botText = `### 🔍 Evidence Analysis Complete\n\n**Extracted Entities:**\n${entitiesMd}\n\n**Fraud Patterns:**\n${patternsMd}\n\n---\n**Suggested Next Steps:**\n${data.suggested_next_steps}`;

      setMessages((prev) => [...prev, {
        sender: "bot",
        text: botText,
        issue_type: "Evidence Analysis",
        severity_level: data.risk_level,
        description: "Evidence Upload: " + (data.fraud_patterns?.[0] || "Suspicious content")
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ **Connection Error**" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }
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
    if (selectedFile) {
      await uploadEvidence();
      return;
    }
    if (!input.trim() || isLoading) return;

    const currentUserInput = input;
    const userMessage = { sender: "user", text: currentUserInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const historyToSend = messages.filter(msg => msg.text && msg.sender).map(msg => ({ sender: msg.sender, text: msg.text }));
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          question: currentUserInput,
          language: selectedLanguage,
          agent: selectedAgent,
          history: historyToSend,
          response_length: responseLength
        })
      });

      if (!response.ok && response.status === 401) return handleLogout();
      const data = await response.json();

      setMessages((prev) => [...prev, {
        sender: "bot",
        text: data.answer || data.response || "No response generated.",
        issue_type: data.issue_type,
        severity_level: data.severity_level,
        confidence: data.confidence,
        description: currentUserInput
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ **Connection Error**" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="auth-box"
        >
          <div className="auth-header">
            <ShieldCheck size={36} className="auth-icon" />
            <h2>SENTINEL<span>AI</span></h2>
            <p className="auth-subtitle">Secure Access Portal</p>
          </div>
          <form onSubmit={handleAuth} className="auth-form">
            <input type="email" placeholder="Operator Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            <input type="password" placeholder="Passcode" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            <button type="submit" className="auth-submit">
              {authMode === "login" ? "AUTHENTICATE" : "INITIALIZE ACCOUNT"}
            </button>
          </form>
          <button className="auth-switch" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? "Request Access (Register)" : "Return to Login"}
          </button>
        </motion.div>
      </div>
    );
  }

  // Right Panel Info (derived from messages)
  const lastBotMsg = [...messages].reverse().find(m => m.sender === "bot" && m.issue_type);
  const currentRisk = lastBotMsg?.severity_level || "Standby";
  const currentIssue = lastBotMsg?.issue_type || "Awaiting Data";

  // Extract Steps for Right Panel via regex magic if possible
  const rawBotText = lastBotMsg?.text || "";
  const evidenceChecklist = Array.from(rawBotText.matchAll(/(?:Evidence|Upload|Provide|Collect).*?[:\n]-*\s*([^\n]+)/gi)).map(m => m[1]) || ["No specific evidence requested yet."];
  const reportingSteps = Array.from(rawBotText.matchAll(/(?:Report|Contact).*?[:\n]-*\s*([^\n]+)/gi)).map(m => m[1]) || ["Awaiting incident details."];

  return (
    <div className="command-center">

      {/* LEFT SIDEBAR */}
      <nav className="cc-sidebar">
        <div className="cc-brand">
          <ShieldAlert size={28} className="cc-logo" />
          <div className="cc-brand-text">
            <h1>SENTINEL<span>AI</span></h1>
            <span className="cc-version">v5.0.0 Command</span>
          </div>
        </div>

        <div className="cc-nav-links">
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <Home size={18} /> <span>Home Console</span>
          </button>
          <button className={`nav-item ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
            <Briefcase size={18} /> <span>My Cases</span>
          </button>
          <button className="nav-item">
            <Clock size={18} /> <span>Incident History</span>
          </button>
          <button className="nav-item">
            <User size={18} /> <span>Operator Profile</span>
          </button>
        </div>

        <div className="cc-user-zone">
          <div className="operator-info">
            <div className="op-avatar"><Activity size={16} /></div>
            <div className="op-details">
              <span className="op-id">OP-{authEmail.split('@')[0].toUpperCase()}</span>
              <span className="op-status">Active Session</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Terminate Session">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT PANEL */}
      <main className="cc-main-panel">

        {activeTab === "chat" ? (
          <div className="cc-chat-container">
            <header className="chat-header">
              <div className="chat-title">
                <h2>Active Incident Response</h2>
                <span className="live-pill"><span className="dot"></span> LIVE</span>
              </div>
              <div className="agent-selector">
                <button className={`agent-tab ${selectedAgent === 'general' ? 'active' : ''}`} onClick={() => setSelectedAgent('general')}>
                  Workflow Engine
                </button>
                <button className={`agent-tab ${selectedAgent === 'legal' ? 'active' : ''}`} onClick={() => setSelectedAgent('legal')}>
                  Legal Routing
                </button>
                <button className={`agent-tab ${selectedAgent === 'reporting' ? 'active' : ''}`} onClick={() => setSelectedAgent('reporting')}>
                  Platform Sync
                </button>
              </div>
            </header>

            <div className="chat-feed">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`message-row ${msg.sender}`}
                  >
                    <div className="message-bubble">
                      <div className="message-sender">
                        {msg.sender === 'bot' ? 'SYSTEM' : 'OPERATOR'}
                        <span className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="message-content md-content">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        {msg.image && <img src={msg.image} alt="Upload" className="message-attachment" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="message-row bot"
                  >
                    <div className="message-bubble typing">
                      <div className="typing-dots"><span></span><span></span><span></span></div>
                      <span className="typing-text">Processing heuristics...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {filePreview && (
              <div className="attachment-preview">
                <ImageIcon size={16} /> Attached Evidence
                <button onClick={removeFile}><X size={14} /></button>
              </div>
            )}

            <div className="chat-input-area">
              <div className="input-toolbar">
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>
                  <option value="en">ENG</option>
                  <option value="hi">HIN</option>
                  <option value="ta">TAM</option>
                  <option value="te">TEL</option>
                </select>
                <select value={responseLength} onChange={e => setResponseLength(e.target.value)}>
                  <option value="detailed">Verbose</option>
                  <option value="brief">Brief</option>
                </select>
              </div>
              <div className="input-wrapper">
                <input
                  type="file" ref={fileInputRef} style={{ display: 'none' }}
                  onChange={handleFileSelect} accept="image/*"
                />
                <button className="icon-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={18} /></button>
                <input
                  type="text"
                  className="terminal-input"
                  placeholder="Enter parameters or describe incident anomaly..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading || selectedFile}
                />
                <button className={`icon-btn ${isListening ? 'active' : ''}`} onClick={startListening}><Mic size={18} /></button>
                <button className="execute-btn" onClick={sendMessage} disabled={(!input && !selectedFile) || isLoading}>
                  EXECUTE <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cc-cases-container">
            <header className="cases-header">
              <h2>Monitored Incidents</h2>
              <p>Active and past security cases registered to your operator ID.</p>
            </header>
            <div className="cases-grid">
              {cases.length === 0 ? (
                <div className="no-cases">
                  <FileText size={48} />
                  <p>No active incidents in your portfolio.</p>
                </div>
              ) : cases.map((c) => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={c.case_id} className="case-card">
                  <div className="case-card-header">
                    <span className="case-id">{c.case_id}</span>
                    <span className={`case-risk ${c.severity?.toLowerCase()}`}>{c.severity}</span>
                  </div>
                  <h3>{c.issue_type}</h3>
                  <p className="case-desc">"{c.description}"</p>
                  <div className="case-footer">
                    <span className="case-status"><CheckCircle size={14} /> {c.status}</span>
                    <span className="case-date">{new Date(c.timestamp).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* RIGHT INFORMATION PANEL */}
      <aside className="cc-right-panel">
        <div className="panel-section threat-header">
          <h3>Threat Context</h3>
          <div className={`threat-indicator ${currentRisk.toLowerCase()}`}>
            <span className="ping-dot"></span>
            RISK: {currentRisk.toUpperCase()}
          </div>
          <div className="issue-category">CATEGORY: {currentIssue}</div>
        </div>

        <div className="panel-section workflow-status">
          <h4><Activity size={16} /> Current Workflow Step</h4>
          <div className="progress-bar"><div className="progress-fill"></div></div>
          {currentIssue !== "Awaiting Data" && currentIssue !== "Unknown" ? (
            <p className="workflow-desc">Guidance mode active. Awaiting operator input/evidence collection.</p>
          ) : (
            <p className="workflow-desc">Awaiting incident parameters.</p>
          )}
        </div>

        <div className="panel-section evidence-list">
          <h4><ClipboardList size={16} /> Evidence Checklist</h4>
          <ul>
            {evidenceChecklist.length > 0 && currentIssue !== "Awaiting Data" && currentIssue !== "Unknown" ? (
              evidenceChecklist.slice(0, 3).map((item, i) => <li key={i}><CheckCircle size={14} /> {item.substring(0, 40)}...</li>)
            ) : (
              <li className="placeholder-text">SOP evidence requirements will appear here.</li>
            )}
          </ul>
        </div>

        <div className="panel-section actions">
          <h4>Quick Actions</h4>
          <button
            className="action-btn"
            disabled={currentIssue === "Awaiting Data" || currentIssue === "Unknown"}
            onClick={() => createCase(currentIssue, currentRisk, input || "Tracked from Workflow")}
          >
            <ShieldAlert size={14} /> Log Case to DB
          </button>
          <button className="action-btn secondary"><FileText size={14} /> Generate PDF Report</button>
        </div>
      </aside>

    </div>
  );
}

export default App;
