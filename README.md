# Interview AI — Master Your Technical Interviews with AI

Interview AI is a cutting-edge, zero-cost, and secure mock interview platform designed to help developers master technical interviews. Built with Next.js, Supabase, and powered by Google Gemini, it provides a realistic, real-time interview experience directly in your browser.

![Interview AI Dashboard](https://raw.githubusercontent.com/drunkee-space/interview-ai/main/public/preview-dashboard.png)

## 🚀 Key Features

- **Real-Time AI Interviewer**: Engage in dynamic, voice-enabled technical discussions. The AI adapts its questioning based on your previous answers.
- **Automated Technical Evaluation**: Get immediate, detailed feedback on your technical accuracy, communication clarity, and conceptual depth.
- **Zero-Cost In-Browser Execution**: Execute Python, SQL, and JavaScript code snippets securely using WebAssembly (Pyodide & sql.js) — no expensive backend runners required.
- **Progressive Learning Engine**: The interview difficulty scales dynamically. If you're doing well, the AI goes deeper; if you're struggling, it simplifies concepts to help you learn.
- **Adaptive Analytics Dashboard**: View comprehensive reports of your performance, including score trends, identified strengths, and a personalized improvement plan.
- **Network Resilience Monitor**: Real-time health checks ensure your connection stays stable during high-stakes mock sessions.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend/DB**: Supabase (PostgreSQL, Auth, RLS)
- **AI/LLM**: Google Gemini (via `@google/genai`)
- **Code Execution**: Pyodide (Python WASM), sql.js (SQLite WASM), Sandboxed IFrames (JS/TS)
- **Styling**: Vanilla CSS + Tailwind CSS for a premium, modern aesthetic

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/drunkee-space/interview-ai.git
   cd interview-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**:
   Run the SQL scripts provided in the `supabase/migrations` (or the provided fix scripts) in your Supabase SQL Editor to initialize the required tables and RLS policies.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🔐 Security & Architecture

- **Sandboxed Execution**: Code submitted by candidates is executed in isolated environments to protect users and the system.
- **Authenticated Data Flow**: All interview data is protected by strict Row-Level Security (RLS) policies, ensuring candidates only see their own sessions.
- **Edge Performance**: Leveraging Next.js Edge Runtime and client-side WASM for near-instant responses and $0 hosting overhead for execution.

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ by the Interview AI Team*
