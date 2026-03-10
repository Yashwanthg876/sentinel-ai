import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  ShieldCheck, Send, Paperclip, X, Image as ImageIcon,
  Briefcase, MessageSquare, ClipboardList, CheckCircle,
  Mic, LayoutDashboard, LogOut,
  TrendingUp, Users, FileText, Activity, ChevronRight,
  Clock, AlertCircle
} from "lucide-react";
import Login from "./pages/Login";
import "./App.css";

const API = "http://127.0.0.1:8000";

// ─── Helper ──────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}



// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ borderTopColor: accent }}>
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────
function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, rRes] = await Promise.all([
          fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/admin/recent-cases`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (sRes.ok) setStats(await sRes.json());
        else setError("Could not load stats. Backend may not be running.");
        if (rRes.ok) setRecent(await rRes.json());
      } catch {
        setError("Cannot connect to backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner large" />
      <p>Loading dashboard data…</p>
    </div>
  );

  if (error) return (
    <div className="admin-error">
      <AlertCircle size={32} />
      <p>{error}</p>
    </div>
  );

  const severityColor = { low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444" };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2><LayoutDashboard size={20} /> Admin Dashboard</h2>
        <p className="admin-sub">System-wide analytics & monitoring</p>
      </div>

      {/* KPI Row */}
      <div className="stat-grid">
        <StatCard icon={<Users size={20} />} label="Total Users" value={stats?.total_users} accent="#38bdf8" />
        <StatCard icon={<FileText size={20} />} label="Total Cases" value={stats?.total_cases} accent="#a78bfa" />
        <StatCard icon={<Activity size={20} />} label="Total Queries" value={stats?.query_stats?.total_queries} accent="#34d399" />
        <StatCard icon={<AlertCircle size={20} />} label="Low-Confidence Triggers" value={stats?.query_stats?.low_confidence_triggers} accent="#f97316" />
      </div>

      <div className="admin-grid">
        {/* Top Incident Types */}
        <div className="admin-panel">
          <h3><TrendingUp size={16} /> Top Incident Types</h3>
          {stats?.top_issues?.length === 0 && <p className="muted">No data yet</p>}
          {stats?.top_issues?.map((item, i) => (
            <div key={i} className="issue-bar-row">
              <span className="issue-bar-label">{item.issue_type}</span>
              <div className="issue-bar-track">
                <div
                  className="issue-bar-fill"
                  style={{ width: `${Math.min(100, (item.count / (stats.total_cases || 1)) * 100)}%` }}
                />
              </div>
              <span className="issue-bar-count">{item.count}</span>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        <div className="admin-panel">
          <h3><CheckCircle size={16} /> Case Status Breakdown</h3>
          {Object.entries(stats?.status_breakdown ?? {}).map(([status, count]) => (
            <div key={status} className="status-row">
              <span className="status-dot" style={{ background: status === "Closed" ? "#22c55e" : status === "In Progress" ? "#eab308" : "#38bdf8" }} />
              <span className="status-row-label">{status}</span>
              <span className="status-row-count">{count}</span>
            </div>
          ))}
          {Object.keys(stats?.status_breakdown ?? {}).length === 0 && <p className="muted">No cases yet</p>}
        </div>

        {/* Severity */}
        <div className="admin-panel">
          <h3><AlertCircle size={16} /> Severity Distribution</h3>
          {Object.entries(stats?.severity_breakdown ?? {}).map(([sev, count]) => (
            <div key={sev} className="status-row">
              <span className="status-dot" style={{ background: severityColor[sev.toLowerCase()] || "#94a3b8" }} />
              <span className="status-row-label" style={{ textTransform: "capitalize" }}>{sev}</span>
              <span className="status-row-count">{count}</span>
            </div>
          ))}
          {Object.keys(stats?.severity_breakdown ?? {}).length === 0 && <p className="muted">No cases yet</p>}
        </div>

        {/* Daily cases */}
        <div className="admin-panel">
          <h3><Clock size={16} /> Cases — Last 7 Days</h3>
          {stats?.daily_cases?.length === 0 && <p className="muted">No cases in this period</p>}
          {stats?.daily_cases?.map((d, i) => (
            <div key={i} className="day-row">
              <span className="day-label">{d.date}</span>
              <div className="issue-bar-track">
                <div className="issue-bar-fill" style={{ width: `${Math.min(100, d.count * 20)}%`, background: "#38bdf8" }} />
              </div>
              <span className="issue-bar-count">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="admin-panel wide">
        <h3><FileText size={16} /> Recent Cases (All Users)</h3>
        {recent.length === 0 ? <p className="muted">No cases filed yet.</p> : (
          <div className="recent-table-wrap">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Filed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr key={i}>
                    <td className="case-id-cell"><code>{c.case_id}</code></td>
                    <td>{c.issue_type}</td>
                    <td>
                      <span className={`meta-pill severity ${c.severity.toLowerCase()}`}>{c.severity}</span>
                    </td>
                    <td>
                      <span className="status-pill"><CheckCircle size={12} /> {c.status}</span>
                    </td>
                    <td className="muted">{fmtDate(c.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => ({
    email: localStorage.getItem("user_email") || "",
    name: localStorage.getItem("user_name") || "",
  }));
  const [activeTab, setActiveTab] = useState("chat");

  // Chat
  const [messages, setMessages] = useState([{
    sender: "bot",
    text: "Hello! I'm **SentinelAI**, your Cyber Incident Assistant. Describe your issue or upload a screenshot for analysis.",
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [isListening, setIsListening] = useState(false);
  const [responseLength, setResponseLength] = useState("detailed");

  // Cases
  const [cases, setCases] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === "chat") messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeTab]);

  useEffect(() => {
    if (activeTab === "tracker") fetchCases();
  }, [activeTab]);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const handleLogin = (tok, usr) => {
    setToken(tok);
    setUser(usr);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    setCases([]);
    setMessages([{ sender: "bot", text: "Logged out successfully.", timestamp: new Date().toISOString() }]);
  };

  const fetchCases = async () => {
    try {
      const res = await fetch(`${API}/cases`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCases(await res.json());
      else if (res.status === 401) handleLogout();
    } catch { /* silent */ }
  };

  const createCase = async (issueType, severity, description) => {
    try {
      const res = await fetch(`${API}/cases`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ issue_type: issueType, severity, description }),
      });
      if (!res.ok) { if (res.status === 401) handleLogout(); return; }
      const data = await res.json();
      alert(`✅ Case ${data.case_id} has been created and is now being tracked!`);
      setActiveTab("tracker");
    } catch { alert("Error creating case."); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please upload a valid image file."); return; }
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
    setMessages(prev => [...prev, { sender: "user", text: "🖼️ Uploaded Evidence for Analysis", image: filePreview, timestamp: new Date().toISOString() }]);
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("language", selectedLanguage);
    removeFile();
    try {
      const res = await fetch(`${API}/analyze-evidence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok && res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { sender: "bot", text: `⚠️ **Error:** ${data.error}`, timestamp: new Date().toISOString() }]);
        return;
      }
      const entitiesMd = data.extracted_entities?.length ? data.extracted_entities.map(e => `- \`${e}\``).join("\n") : "- None detected";
      const patternsMd = data.fraud_patterns?.length ? data.fraud_patterns.map(p => `- ${p}`).join("\n") : "- None detected";
      const botText = `### 🔍 Evidence Analysis Complete\n\n**Extracted Entities (URLs, Phones, Emails):**\n${entitiesMd}\n\n**Detected Fraud Patterns:**\n${patternsMd}\n\n---\n**Suggested Next Steps:**\n${data.suggested_next_steps}`;
      setMessages(prev => [...prev, { sender: "bot", text: botText, issue_type: "Evidence Analysis", severity_level: data.risk_level, description: "Evidence Upload: " + (data.fraud_patterns?.[0] || "Suspicious content"), timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ **Connection Error** — Unable to reach the backend.", timestamp: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Your browser does not support Speech Recognition. Please use Chrome."); return; }
    const recognition = new SR();
    recognition.lang = selectedLanguage === "hi" ? "hi-IN" : selectedLanguage === "ta" ? "ta-IN" : selectedLanguage === "te" ? "te-IN" : "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const sendMessage = async () => {
    if (selectedFile) { await uploadEvidence(); return; }
    if (!input.trim() || isLoading) return;
    const userText = input;
    const userMsg = { sender: "user", text: userText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyToSend = messages.filter(m => m.text && m.sender).map(m => ({ sender: m.sender, text: m.text }));
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ question: userText, language: selectedLanguage, agent: selectedAgent, history: historyToSend, response_length: responseLength }),
      });
      if (!res.ok && res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setMessages(prev => [...prev, {
        sender: "bot",
        text: data.answer || data.response || "No response generated.",
        issue_type: data.issue_type,
        severity_level: data.severity_level,
        confidence: data.confidence,
        description: userText,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ **Connection Error** — Unable to reach the SentinelAI backend.", timestamp: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShieldCheck size={28} className="sidebar-logo-icon" />
          <span>SentinelAI</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "chat", icon: <MessageSquare size={18} />, label: "Incident Chat" },
            { id: "tracker", icon: <Briefcase size={18} />, label: "Case Tracker" },
            { id: "admin", icon: <LayoutDashboard size={18} />, label: "Admin Dashboard" },
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && <ChevronRight size={14} className="nav-chevron" />}
            </button>
          ))}
        </nav>


        <div className="sidebar-user">
          <div className="user-avatar">
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-email">{user?.name || user?.email || "User"}</span>
            <span className="user-role">{user?.name ? user.email : "Registered User"}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activeTab === "chat" && (
          <div className="chat-panel">
            {/* Agent Selector */}
            <div className="agent-bar">
              {[
                { id: "general", emoji: "🤖", label: "Workflow Engine" },
                { id: "legal", emoji: "⚖️", label: "Legal Advisor" },
                { id: "reporting", emoji: "📝", label: "Platform Reporting" },
              ].map(a => (
                <button
                  key={a.id}
                  className={`agent-chip ${selectedAgent === a.id ? "active" : ""}`}
                  onClick={() => setSelectedAgent(a.id)}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="messages-area">
              {messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.sender}`}>
                  {msg.sender === "bot" && (
                    <div className="msg-avatar bot-avatar">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                  <div className="msg-bubble-wrap">
                    <div className={`msg-bubble ${msg.sender}`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.image && (
                        <div className="msg-img-wrap">
                          <img src={msg.image} alt="Evidence" className="msg-img" />
                        </div>
                      )}
                    </div>

                    {msg.timestamp && (
                      <div className={`msg-time ${msg.sender}`}>{fmtTime(msg.timestamp)}</div>
                    )}

                    {msg.sender === "bot" && msg.issue_type && !["Unknown", "Clarification Required", "Follow-up"].includes(msg.issue_type) && (
                      <div className="msg-actions">
                        <div className="meta-pills">
                          <span className="meta-pill">📁 {msg.issue_type}</span>
                          {msg.severity_level && msg.severity_level !== "Unknown" && (
                            <span className={`meta-pill severity ${msg.severity_level.toLowerCase()}`}>
                              🔴 Risk: {msg.severity_level}
                            </span>
                          )}
                          {msg.confidence && (
                            <span className="meta-pill confidence">
                              🎯 Confidence: {(1 - Math.min(msg.confidence, 2) / 2 * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <button
                          className="track-btn"
                          onClick={() => createCase(msg.issue_type, msg.severity_level || "Unknown", msg.description || "Cyber Issue")}
                        >
                          <ClipboardList size={13} /> Track this Case
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="msg-row bot">
                  <div className="msg-avatar bot-avatar"><ShieldCheck size={14} /></div>
                  <div className="msg-bubble bot typing-bubble">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {filePreview && (
              <div className="file-preview-bar">
                <ImageIcon size={16} />
                <span>{selectedFile?.name}</span>
                <button className="remove-file" onClick={removeFile}><X size={14} /></button>
              </div>
            )}

            {/* Input bar */}
            <div className="input-bar">
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />
              <button className="icon-btn" onClick={() => fileInputRef.current.click()} disabled={isLoading} title="Upload evidence screenshot">
                <Paperclip size={18} />
              </button>

              <select className="select-ctrl" value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} disabled={isLoading}>
                <option value="en">🌐 English</option>
                <option value="hi">🇮🇳 Hindi</option>
                <option value="ta">🇮🇳 Tamil</option>
                <option value="te">🇮🇳 Telugu</option>
              </select>

              <select className="select-ctrl" value={responseLength} onChange={e => setResponseLength(e.target.value)} disabled={isLoading}>
                <option value="detailed">📋 Detailed</option>
                <option value="brief">⚡ Brief</option>
              </select>

              <input
                type="text"
                className="chat-input"
                placeholder={selectedFile ? "Press Send to analyze evidence…" : isListening ? "🎤 Listening…" : "Describe your cyber incident…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                disabled={isLoading || !!selectedFile}
              />

              <button className={`icon-btn mic-btn ${isListening ? "listening" : ""}`} onClick={startListening} disabled={isLoading || !!selectedFile} title="Voice input">
                <Mic size={18} />
              </button>

              <button className="send-btn" onClick={sendMessage} disabled={(!input.trim() && !selectedFile) || isLoading}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="tracker-panel">
            <div className="panel-header">
              <h2><Briefcase size={20} /> Your Tracked Cases</h2>
              <button className="refresh-btn" onClick={fetchCases}>↻ Refresh</button>
            </div>

            {cases.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={52} className="empty-icon" />
                <p>No tracked cases yet.</p>
                <small>Chat with SentinelAI and click "Track this Case" to file an incident.</small>
              </div>
            ) : (
              <div className="cases-grid">
                {cases.map(c => (
                  <div key={c.case_id} className="case-card">
                    <div className="case-card-header">
                      <div>
                        <code className="case-id">{c.case_id}</code>
                        <p className="case-desc">"{c.description}"</p>
                      </div>
                      <span className="case-date">{fmtDate(c.timestamp)}</span>
                    </div>
                    <div className="case-pills">
                      <span className="meta-pill">📁 {c.issue_type}</span>
                      <span className={`meta-pill severity ${c.severity.toLowerCase()}`}>🔴 {c.severity}</span>
                      <span className="status-pill"><CheckCircle size={12} /> {c.status}</span>
                    </div>
                    {c.updates?.length > 0 && (
                      <div className="case-timeline">
                        <p className="timeline-heading">Timeline</p>
                        {c.updates.map((u, idx) => (
                          <div key={idx} className="timeline-entry">
                            <Clock size={11} className="tl-clock" />
                            <span className="tl-time">{fmtTime(u.timestamp)}</span>
                            <span className="tl-note">{u.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" && (
          <div className="admin-wrap">
            <AdminDashboard token={token} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
