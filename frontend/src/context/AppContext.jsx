import { createContext, useContext, useState, useEffect } from "react";
import { fetchCases, createCase as apiCreateCase, uploadEvidence as apiUploadEvidence, sendMessage as apiSendMessage } from "../api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authEmail, setAuthEmail] = useState(localStorage.getItem("user_email") || "");
    const [authRole, setAuthRole] = useState(localStorage.getItem("user_role") || "public_user");
    const [cases, setCases] = useState([]);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "System Online. **SentinelAI** Cyber Incident Assistance initialized. How can I assist you today?",
            issue_type: null,
            severity_level: null,
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) {
            loadCases();
        } else {
            setCases([]);
        }
    }, [token]);

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_role");
        setMessages([{ sender: "bot", text: "Logged out. System reset.", issue_type: null }]);
    };

    const loadCases = async () => {
        try {
            const data = await fetchCases(token);
            setCases(data);
        } catch (e) {
            if (e.message === "Unauthorized") handleLogout();
        }
    };

    const createCase = async (issueType, severity, description) => {
        try {
            await apiCreateCase(token, issueType, severity, description);
            await loadCases();
            alert("Case registered successfully.");
        } catch (e) {
            if (e.message === "Unauthorized") handleLogout();
            else alert("Error tracking case.");
        }
    };

    const uploadEvidence = async (file, language) => {
        setIsLoading(true);
        try {
            const data = await apiUploadEvidence(token, file, language);
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            if (error.message === "Unauthorized") handleLogout();
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (text, language, agent, history, responseLength) => {
        setIsLoading(true);
        try {
            const data = await apiSendMessage(token, text, language, agent, history, responseLength);
            return data;
        } catch (error) {
            if (error.message === "Unauthorized") handleLogout();
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Derive Right Panel context state from recent messages
    const lastBotMsg = [...messages].reverse().find(m => m.sender === "bot" && m.issue_type);
    const currentRisk = lastBotMsg?.severity_level || "Standby";
    const currentIssue = lastBotMsg?.issue_type || "Awaiting Data";
    const rawBotText = lastBotMsg?.text || "";
    const evidenceChecklist = Array.from(rawBotText.matchAll(/(?:Evidence|Upload|Provide|Collect|Needed).*?[:\n]-*\s*([^\n]+)/gi)).map(m => m[1]) || [];

    return (
        <AppContext.Provider
            value={{
                token, setToken,
                authEmail, setAuthEmail,
                authRole, setAuthRole,
                cases, loadCases, createCase,
                messages, setMessages,
                isLoading, setIsLoading,
                uploadEvidence, sendMessage,
                handleLogout,
                currentRisk, currentIssue, evidenceChecklist
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
