# 🧠 Pensieve (Frontend)

Pensieve is a privacy-first, ML-powered reflective journaling application designed to help users gain deeper insights into their cognitive patterns while maintaining absolute data sovereignty.

This repository contains the **Frontend UI**, built with React and Vite, and is optimized for deployment on **GitHub Pages**.

## ✨ Key Features

- **🔐 Zero-Knowledge Encryption**: Journal entries are encrypted client-side using Argon2 and AES-GCM before ever touching the network.
- **🎨 Ethereal UI**: A premium, "glassmorphism" aesthetic with dynamic 3D elements powered by **Three.js**.
- **🤖 Penn AI Interface**: A fluid, context-aware interface for interacting with your "Personal Learning Assistant."
- **📊 Cognitive Insights**: Beautiful data visualizations for emotional trends and psychological concepts.
- **📱 Responsive Design**: Fully optimized for desktop and mobile journaling.

## 🚀 Tech Stack

- **Core**: React 18 + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion + GSAP
- **3D Graphics**: Three.js + React Three Fiber
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth

## 🛠️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Chaudharyyyyy/pensieve-fe.git
   cd pensieve-fe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root and add your Supabase and API credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=your_hosted_fastapi_backend_url
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This project is configured to automatically deploy to **GitHub Pages** via GitHub Actions.

- **Trigger**: Any push to the `main` branch.
- **Hosting**: Deployed to the `gh-pages` branch.
- **Customization**: Update the `base` path in `vite.config.ts` if you change the repository name.

## 🤝 Contribution

This is a Project Based Learning (PBL) initiative. Contributions focusing on privacy features, better encryption patterns, or localized ML visualizations are welcome!

---

*Pensieve - Your mind, beautifully reflected.*
