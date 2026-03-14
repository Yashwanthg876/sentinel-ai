import { useState, useEffect, useRef } from "react";
import { ShieldCheck, User, Shield, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import "./Login.css";

const API = "http://127.0.0.1:8000";

/**
 * Login page for SentinelAI.
 *
 * Supports two authentication methods:
 *  1. Google Sign-In (primary CTA)
 *  2. Email + Password (secondary, collapsible)
 *
 * Props:
 *  onLogin(token: string, user: { email, name }) — called on success
 */
export default function Login({ onLogin }) {
    const [mode, setMode] = useState("login");       // 'login' | 'register'
    const [showEmail, setShowEmail] = useState(false); // toggle email form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const googleBtnRef = useRef(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

    // ── Google Identity Services initialization ────────────────────────────────
    useEffect(() => {
        if (!googleClientId) return;

        const initGoogle = () => {
            if (!window.google) return;
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential,
                ux_mode: "popup",
                auto_select: false,
            });

            if (googleBtnRef.current) {
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    type: "standard",
                    theme: "filled_black",
                    size: "large",
                    text: "signin_with",
                    shape: "pill",
                    logo_alignment: "left",
                    width: 340,
                });
            }
        };

        // GSI script may still be loading when React mounts — poll until ready
        if (window.google) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 200);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [googleClientId]);

    // ── Google credential callback ─────────────────────────────────────────────
    const handleGoogleCredential = async (response) => {
        setError("");
        setGoogleLoading(true);
        try {
            const res = await fetch(`${API}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.credential }),
            });
            const data = await res.json();
            if (res.ok) {
                persistAndLogin(data);
            } else {
                setError(data.detail || "Google authentication failed.");
            }
        } catch {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Email / password submit ────────────────────────────────────────────────
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
            const res = await fetch(`${API}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                persistAndLogin(data);
            } else {
                setError(data.detail || "Authentication failed.");
            }
        } catch {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const persistAndLogin = (data) => {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_name", data.user.name || data.user.email);
        localStorage.setItem("user_role", data.user.role || "public_user");
        onLogin(data.access_token, data.user);
    };

    return (
        <div className="login-page">
            {/* Ambient glow blobs */}
            <div className="login-blob blob-1" />
            <div className="login-blob blob-2" />

            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-shield">
                        <ShieldCheck size={36} strokeWidth={1.8} />
                    </div>
                    <h1>SentinelAI</h1>
                    <p>Secure Cyber Incident Assistance</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="login-error-banner">
                        <AlertCircle size={15} />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Google Sign-In ── */}
                <div className="google-section">
                    {googleClientId ? (
                        <>
                            {googleLoading ? (
                                <div className="google-loading">
                                    <div className="g-spinner" />
                                    <span>Verifying with Google…</span>
                                </div>
                            ) : (
                                /* GSI renders its own styled button here */
                                <div ref={googleBtnRef} className="google-btn-host" />
                            )}
                        </>
                    ) : (
                        /* Show a static placeholder when GOOGLE_CLIENT_ID is not set */
                        <div className="google-unconfigured">
                            <AlertCircle size={14} />
                            <span>
                                Google Sign-In not configured.{" "}
                                <a href="#email-auth" onClick={() => setShowEmail(true)}>
                                    Use email instead
                                </a>
                            </span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="login-divider">
                    <span>or</span>
                </div>

                {/* ── Email toggle ── */}
                {!showEmail ? (
                    <button
                        className="email-toggle-btn"
                        onClick={() => { setShowEmail(true); setError(""); }}
                        id="email-auth"
                    >
                        Continue with Email
                    </button>
                ) : (
                    <div className="email-form-wrap">
                        {/* Mode tabs */}
                        <div className="email-mode-tabs">
                            <button
                                className={`email-tab ${mode === "login" ? "active" : ""}`}
                                onClick={() => { setMode("login"); setError(""); }}
                            >Sign In</button>
                            <button
                                className={`email-tab ${mode === "register" ? "active" : ""}`}
                                onClick={() => { setMode("register"); setError(""); }}
                            >Create Account</button>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="email-form">
                            {/* Email */}
                            <div className="field-group">
                                <label>Email Address</label>
                                <div className="field-wrap">
                                    <User size={15} className="field-icon" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="field-group">
                                <label>Password</label>
                                <div className="field-wrap">
                                    <Shield size={15} className="field-icon" />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    />
                                    <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="email-submit-btn" disabled={loading}>
                                {loading
                                    ? <><span className="btn-dot-spinner" /> Authenticating…</>
                                    : mode === "login" ? "Sign In" : "Create Account"
                                }
                            </button>
                        </form>
                    </div>
                )}

                {/* Trust badges */}
                <div className="login-trust">
                    <div className="trust-badge"><CheckCircle size={12} /><span>JWT Secured</span></div>
                    <div className="trust-badge"><CheckCircle size={12} /><span>BCrypt Protected</span></div>
                    <div className="trust-badge"><CheckCircle size={12} /><span>Google Verified</span></div>
                </div>
            </div>
        </div>
    );
}
