const API = "http://127.0.0.1:8000";

const handleResponse = async (response) => {
    if (response.status === 401) throw new Error("Unauthorized");
    return response.json();
};

export const fetchCases = async (token) => {
    const response = await fetch(`${API}/cases`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const createCase = async (token, issueType, severity, description) => {
    const response = await fetch(`${API}/cases`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ issue_type: issueType, severity: severity, description: description })
    });
    return handleResponse(response);
};

export const uploadEvidence = async (token, file, language) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    const response = await fetch(`${API}/analyze-evidence`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
    });
    return handleResponse(response);
};

export const sendMessage = async (token, question, language, agent, history, responseLength) => {
    const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question, language, agent, history, response_length: responseLength })
    });
    return handleResponse(response);
};
