import React, { useState, useRef, useEffect } from "react";
import { FiFileText, FiUpload, FiDownload, FiCheckCircle, FiTrash2, FiPlus, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";

export default function ComplaintAssistant() {
    const { token, apiBaseUrl } = useAppContext();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        platform: "",
        accountUsername: "",
        description: "",
        incidentDate: "",
        issueType: "Cybercrime",
        severity: "Medium"
    });

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [caseId, setCaseId] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setDownloadUrl(null);

        try {
            // 1. Create Case
            const caseResponse = await fetch(`${apiBaseUrl}/cases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    issue_type: formData.issueType,
                    severity: formData.severity,
                    description: formData.description,
                    platform: formData.platform,
                    account_username: formData.accountUsername,
                    incident_date: formData.incidentDate
                })
            });

            if (!caseResponse.ok) throw new Error("Failed to create case");
            const caseData = await caseResponse.json();
            const newCaseId = caseData.case_id;
            setCaseId(newCaseId);

            // 2. Upload Evidence
            for (const file of uploadedFiles) {
                const evidenceFormData = new FormData();
                evidenceFormData.append("file", file);

                const evidenceResponse = await fetch(`${apiBaseUrl}/cases/${newCaseId}/evidence`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: evidenceFormData
                });

                if (!evidenceResponse.ok) {
                    console.error(`Failed to upload ${file.name}`);
                }
            }

            // 3. Generate Complaint
            setIsGenerating(true);
            const complaintResponse = await fetch(`${apiBaseUrl}/cases/${newCaseId}/generate-complaint`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!complaintResponse.ok) throw new Error("Failed to generate complaint");
            const complaintData = await complaintResponse.json();
            setDownloadUrl(complaintData.download_url);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!downloadUrl) return;

        try {
            const response = await fetch(`${apiBaseUrl}${downloadUrl}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Complaint_${caseId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setError("Failed to download: " + err.message);
        }
    };

    return (
        <div className="p-10 overflow-y-auto h-full scrollbar-thin max-w-4xl mx-auto">
            <header className="mb-10 text-center">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
                        <FiFileText size={40} className="text-primary" />
                    </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Complaint Assistant</h2>
                <p className="text-slate-400 mt-2">Generate a professional cybercrime complaint report in minutes.</p>
            </header>

            <div className="bg-bgPanel border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-sky-400/50"></div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <FiCheckCircle className="text-primary" /> Incident Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Platform</label>
                                <input
                                    type="text"
                                    name="platform"
                                    value={formData.platform}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Instagram, WhatsApp, X"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-primary focus:ring-1 ring-primary/50 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Account Username</label>
                                <input
                                    type="text"
                                    name="accountUsername"
                                    value={formData.accountUsername}
                                    onChange={handleInputChange}
                                    placeholder="@user_handle"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-primary focus:ring-1 ring-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Issue Type</label>
                                <select
                                    name="issueType"
                                    value={formData.issueType}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-primary focus:ring-1 ring-primary/50 outline-none transition-all"
                                >
                                    <option value="Cybercrime">Cybercrime</option>
                                    <option value="Cyberbullying">Cyberbullying</option>
                                    <option value="Financial Fraud">Financial Fraud</option>
                                    <option value="ID Theft">ID Theft</option>
                                    <option value="Harassment">Harassment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Incident Date</label>
                                <input
                                    type="date"
                                    name="incidentDate"
                                    value={formData.incidentDate}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-primary focus:ring-1 ring-primary/50 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Incident Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe exactly what happened in detail..."
                                rows="4"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-primary focus:ring-1 ring-primary/50 outline-none transition-all resize-none"
                                required
                            ></textarea>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <FiUpload className="text-primary" /> Evidence Upload
                        </h3>
                        <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-primary/50 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                multiple
                                hidden
                                accept="image/*,.pdf,.txt"
                            />
                            <div className="flex flex-col items-center">
                                <div className="p-3 bg-slate-800 rounded-full mb-3">
                                    <FiPlus size={24} className="text-slate-400" />
                                </div>
                                <p className="text-slate-300 font-medium">Click to upload evidence</p>
                                <p className="text-slate-500 text-xs mt-1">Screenshots, logs, or transaction receipts (PDF, Images)</p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {uploadedFiles.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300">
                                            <span className="truncate max-w-[80%]">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400 transition-colors">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    <footer className="pt-6 border-t border-slate-700/50 flex flex-col items-center gap-4">
                        {error && <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>}

                        {!downloadUrl ? (
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 bg-primary text-slate-900 rounded-2xl font-bold text-lg hover:bg-sky-400 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                        <span>{isGenerating ? "Generating PDF..." : "Processing..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <FiFileText size={22} />
                                        <span>Generate Official Complaint</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                type="button"
                                onClick={handleDownload}
                                className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg hover:bg-green-400 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
                            >
                                <FiDownload size={22} />
                                <span>Download Complaint PDF</span>
                            </motion.button>
                        )}

                        {downloadUrl && (
                            <p className="text-slate-400 text-xs">Case successfully recorded with ID: <span className="text-primary font-mono">{caseId}</span></p>
                        )}
                    </footer>
                </form>
            </div>
        </div>
    );
}
