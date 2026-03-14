import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiShield, FiPaperclip, FiMic, FiSend, FiImage, FiX } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function Assistant() {
    const { messages, setMessages, isLoading, uploadEvidence, sendMessage } = useAppContext();

    const [input, setInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [isListening, setIsListening] = useState(false);

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

    const handleSend = async () => {
        if (selectedFile) {
            setMessages(prev => [...prev, { sender: "user", text: "🖼️ Uploaded Evidence", image: filePreview }]);
            const file = selectedFile;
            removeFile(); // optimistic clear
            try {
                const data = await uploadEvidence(file, selectedLanguage);
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
            } catch (err) {
                setMessages(prev => [...prev, { sender: "bot", text: `⚠️ **Error Processing Evidence:**\n${err.message}` }]);
            }
            return;
        }

        if (!input.trim() || isLoading) return;

        const currentUserInput = input;
        setMessages(prev => [...prev, { sender: "user", text: currentUserInput }]);
        setInput("");

        try {
            const historyToSend = messages.filter(msg => msg.text && msg.sender).map(msg => ({ sender: msg.sender, text: msg.text }));
            const data = await sendMessage(currentUserInput, selectedLanguage, "general", historyToSend, "detailed");

            setMessages(prev => [...prev, {
                sender: "bot",
                text: data.answer || data.response || "No response generated.",
                issue_type: data.issue_type,
                severity_level: data.severity_level,
                confidence: data.confidence,
                description: currentUserInput
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: "bot", text: "⚠️ **Connection Error**" }]);
        }
    };

    return (
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
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
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

                    <button className={`p-2.5 rounded-xl transition-all ${isListening ? 'text-red-400 bg-red-400/10 shadow-[0_0_10px_rgba(,,,)]' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} onClick={startListening}>
                        <FiMic size={20} />
                    </button>
                    <button onClick={handleSend} disabled={(!input && !selectedFile) || isLoading}
                        className="p-3 bg-primary text-slate-900 rounded-xl hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_10px_rgba(,,,)] hover:shadow-[0_4px_15px_rgba(,,,)]">
                        <FiSend size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
