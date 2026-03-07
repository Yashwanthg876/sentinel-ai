import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ShieldCheck, Send, AlertTriangle } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello. I am **SentinelAI**, your Cyber Incident Assistance system. Please describe the issue you are facing (e.g., 'My Instagram was hacked', 'I clicked a strange link in an email').",
      issue_type: null,
      severity_level: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: userMessage.text })
      });

      const data = await response.json();

      // data contains answer, issue_type, severity_level, confidence
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
        { sender: "bot", text: "⚠️ **Connection Error**\nUnable to reach the SentinelAI backend. Please ensure the server is running." }
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

                {/* Issue Category Detection Pills */}
                {msg.sender === "bot" && msg.issue_type && msg.issue_type !== "Unknown" && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="meta-pill">
                      Category: {msg.issue_type}
                    </span>
                    {msg.severity_level && msg.severity_level !== "Unknown" && (
                      <span className="meta-pill severity">
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

        <div className="input-container">
          <input
            type="text"
            className="input-box"
            placeholder="Describe your cyber issue..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
