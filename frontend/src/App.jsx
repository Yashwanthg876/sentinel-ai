import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ShieldCheck, Send, AlertTriangle, Paperclip, X, Image as ImageIcon, Briefcase, MessageSquare, ClipboardList, CheckCircle } from "lucide-react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'tracker'

  // Chat States
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello. I am **SentinelAI**, your Cyber Incident Assistance system. You can describe your issue, or **upload a screenshot** of a suspicious text message, email, or profile for analysis.",
      issue_type: null,
      severity_level: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Cases State
  const [cases, setCases] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, filePreview, activeTab]);

  useEffect(() => {
    if (activeTab === "tracker") {
      fetchCases();
    }
  }, [activeTab]);

  const fetchCases = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/cases");
      const data = await response.json();
      setCases(data);
    } catch (e) {
      console.error("Failed to fetch cases");
    }
  };

  const createCase = async (issueType, severity, description) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_type: issueType,
          severity: severity,
          description: description
        })
      });
      const data = await response.json();
      alert(`Case ${data.case_id} has been created and is now being tracked!`);
      setActiveTab("tracker");
    } catch (e) {
      alert("Error tracking case.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadEvidence = async () => {
    if (!selectedFile || isLoading) return;

    const userMessage = {
      sender: "user",
      text: "🖼️ Uploaded Evidence",
      image: filePreview
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("language", selectedLanguage);

    removeFile();

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-evidence", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { sender: "bot", text: `⚠️ **Error Processing Evidence:**\n${data.error}` }]);
        setIsLoading(false);
        return;
      }

      const entitiesMd = data.extracted_entities && data.extracted_entities.length > 0
        ? data.extracted_entities.map(e => `- \`${e}\``).join('\n')
        : "- None detected";

      const patternsMd = data.fraud_patterns && data.fraud_patterns.length > 0
        ? data.fraud_patterns.map(p => `- ${p}`).join('\n')
        : "- None detected";

      const botText = `
### 🔍 Evidence Analysis Complete

**Extracted Entities (URLs, Phones, Emails):**
${entitiesMd}

**Detected Fraud Patterns:**
${patternsMd}

---
**Suggested Next Steps:**
${data.suggested_next_steps}
      `;

      setMessages((prev) => [...prev, {
        sender: "bot",
        text: botText,
        issue_type: "Evidence Analysis",
        severity_level: data.risk_level,
        description: "Evidence Upload: " + (data.fraud_patterns?.[0] || "Suspicious content")
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ **Connection Error**\nUnable to reach the SentinelAI backend." }]);
    } finally {
      setIsLoading(false);
    }
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
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.text,
          language: selectedLanguage
        })
      });

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.answer || data.response || "No response generated.",
        issue_type: data.issue_type,
        severity_level: data.severity_level,
        confidence: data.confidence,
        description: currentUserInput
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ **Connection Error**\nUnable to reach the SentinelAI backend." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">
          <ShieldCheck size={36} color="var(--primary)" />
          SentinelAI
        </h1>
        <p className="subtitle">Cyber Incident Assistance Platform</p>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={16} /> Incident Chat
          </button>
          <button
            className={`tab ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveTab("tracker")}
          >
            <Briefcase size={16} /> Tracked Cases
          </button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === "chat" ? (
          <div className="chat-container">
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div className="message-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>

                    {msg.image && (
                      <div className="message-image-container">
                        <img src={msg.image} alt="Uploaded evidence" className="message-image" />
                      </div>
                    )}

                    {msg.sender === "bot" && msg.issue_type && msg.issue_type !== "Unknown" && msg.issue_type !== "Clarification Required" && (
                      <div className="bot-actions-panel">
                        <div className="metadata-pills">
                          <span className="meta-pill">
                            Category: {msg.issue_type}
                          </span>
                          {msg.severity_level && msg.severity_level !== "Unknown" && (
                            <span className={`meta-pill severity ${msg.severity_level.toLowerCase()}`}>
                              Risk: {msg.severity_level}
                            </span>
                          )}
                        </div>
                        <button
                          className="track-case-btn"
                          onClick={() => createCase(msg.issue_type, msg.severity_level || "Unknown", msg.description || "Cyber Issue Reported")}
                        >
                          <ClipboardList size={14} /> Track this Case
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message-wrapper bot">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Upload Preview Container */}
            {filePreview && (
              <div className="file-preview-container">
                <div className="file-preview-box">
                  <ImageIcon size={20} className="file-icon" />
                  <span className="file-name">{selectedFile.name}</span>
                  <button className="remove-file-btn" onClick={removeFile}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="input-container">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <button
                className="attach-button"
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading}
                title="Upload Screenshot"
              >
                <Paperclip size={20} />
              </button>

              <select
                className="language-selector"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isLoading}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>

              <input
                type="text"
                className="input-box"
                placeholder={selectedFile ? "Press send to analyze evidence..." : "Describe your cyber issue..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading || selectedFile !== null}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={(!input.trim() && !selectedFile) || isLoading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="tracker-container">
            <h2>Your Tracked Cases</h2>
            {cases.length === 0 ? (
              <div className="empty-cases">
                <Briefcase size={48} color="var(--border)" />
                <p>You have no tracked cases. Report an incident in the chat to start tracking.</p>
              </div>
            ) : (
              <div className="cases-list">
                {cases.map((c) => (
                  <div key={c.case_id} className="case-card">
                    <div className="case-header">
                      <h3>{c.case_id}</h3>
                      <span className="case-date">{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="case-description">"{c.description}"</p>
                    <div className="case-meta">
                      <span className="meta-pill">Category: {c.issue_type}</span>
                      <span className={`meta-pill severity ${c.severity.toLowerCase()}`}>Risk: {c.severity}</span>
                      <span className="status-pill"><CheckCircle size={14} /> {c.status}</span>
                    </div>

                    <div className="case-timeline">
                      <h4>Timeline</h4>
                      {c.updates.map((upd, idx) => (
                        <div key={idx} className="timeline-item">
                          <span className="timeline-date">{new Date(upd.timestamp).toLocaleString()}</span>
                          <span className="timeline-note">{upd.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
