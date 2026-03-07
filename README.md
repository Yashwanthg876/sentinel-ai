# SentinelAI

SentinelAI is an AI-powered Cyber Incident Assistance Platform.

Its goal is to help people who face cyber issues (hacking, fraud, fake profiles, abuse, scams) by giving clear step-by-step guidance (SOPs) on what they should do.

Instead of searching the internet, users can simply ask:
> "My Instagram account was hacked."

SentinelAI instantly provides:
- Immediate actions
- Evidence to collect
- Reporting steps
- Prevention tips

So the user goes from confusion to a clear procedure.

---

## 🧠 Core Problem We Are Solving

When people face cybercrime they usually ask:
- What should I do first?
- Where should I report?
- What proof should I collect?
- What legal steps exist?

But current solutions are:
- ❌ scattered across websites
- ❌ hard to understand
- ❌ not conversational
- ❌ not personalized

SentinelAI solves this by combining AI + verified SOP knowledge in a Retrieval-Augmented Generation (RAG) system.

---

## ⚙️ Technical Stack & Architecture

Our project is built as a full-stack AI system. It combines a frontend interface, a backend API, and an AI intelligence layer.

### 1️⃣ Frontend Layer (User Interface)
**Purpose:** Allows users to interact with SentinelAI through a chat interface.
**Technologies used:**
- **React** – JavaScript library for building the user interface.
- **Vite** – Fast frontend build tool and development server.
- **CSS** – Styling the cybersecurity-themed dashboard interface.
- **Fetch API** – Sends async requests from frontend to backend.

### 2️⃣ Backend Layer (API Server)
**Purpose:** Processes user requests and runs the AI pipeline.
**Technology used:**
- **FastAPI (Python)** – Chosen because it is very fast, supports async, has easy API documentation, and is widely used in AI systems.

### 3️⃣ Retrieval Layer (Semantic Search)
This is where SentinelAI finds the correct SOP.
**Technologies used:**
- **SentenceTransformers** – Converts text into embeddings (numerical vectors).
- **FAISS (Facebook AI Similarity Search)** – Fast vector database to find similar cyber incident SOPs.

### 4️⃣ Intelligent Retrieval Layer
We added extra logic to make retrieval smarter and prevent hallucination.
**Features implemented:**
- Top-K semantic retrieval
- Ranking by similarity
- Confidence scoring
- Clarification fallback

### 5️⃣ Generation Layer (AI Response)
**Technology used:**
- **Llama 3 via Ollama** – Runs a local Large Language Model (LLM).
**Purpose:** Turn SOP data into human-readable guidance and produce highly structured markdown responses.

### 6️⃣ Data Layer (Knowledge Base)
Our system relies on a structured SOP dataset (`sop_dataset.json`). It currently maps various issue categories (Financial Fraud, Malware, Phishing, Fake Profiles) with specific action steps and legal references.

### 7️⃣ Observability Layer (Logging)
We implemented internal query logging for auditing and performance tuning.
**Each request stores:** timestamp, user query, matched SOP, and confidence score. This helps improve the system later.

---

## 📈 Roadmap

- ✅ **Phase 1:** Core RAG pipeline (MVP Engine)
- ✅ **Phase 2:** Product Experience (UI Dashboard, Category Detection, Rich Markdown)
- ✅ **Phase 3:** Smart Features (Evidence Analyzer / Screenshot Processing, Dynamic Severity Scoring, Case Tracking)
- ✅ **Phase 4:** Advanced AI (Multi-Agent framework, Multilingual Support, Voice Interaction)
- 📅 **Phase 5:** Platform & SaaS (Institutional Dashboards for schools/organizations)