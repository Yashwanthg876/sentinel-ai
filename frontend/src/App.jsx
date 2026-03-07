import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ShieldCheck, Send, AlertTriangle, Paperclip, X, Image as ImageIcon } from "lucide-react";
import "./App.css";

function App() {
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, filePreview]);

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

      // Format the Evidence Analysis response
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
        severity_level: data.risk_level
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

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.text })
      });

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.answer || data.response || "No response generated.",
        issue_type: data.issue_type,
        severity_level: data.severity_level,
        confidence: data.confidence
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
      </div>

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

                {msg.sender === "bot" && msg.issue_type && msg.issue_type !== "Unknown" && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="meta-pill">
                      Category: {msg.issue_type}
                    </span>
                    {msg.severity_level && msg.severity_level !== "Unknown" && (
                      <span className={`meta-pill severity ${msg.severity_level.toLowerCase()}`}>
                        Risk: {msg.severity_level}
                      </span>
                    )}
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
    </div>
  );
}

export default App;
