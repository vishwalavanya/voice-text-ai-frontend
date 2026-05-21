Voice AI Clinic Frontend

A modern AI-powered voice-based clinic appointment booking frontend built using React, Vite, TypeScript, Zustand, Tailwind CSS, and Framer Motion.

Live Project URL:

Voice AI Clinic Frontend Live Demo
Features
🎤 Real-time Voice Interaction
🤖 AI Assistant Responses
🌍 Multi-language Support
📅 Appointment Booking System
🔊 AI Audio Playback
⚡ WebSocket Real-time Communication
🧠 Session Memory Handling
📱 Responsive UI Design
✨ Smooth Framer Motion Animations
🗂 Zustand State Management
🎨 Tailwind CSS Styling
🔁 Automatic Reconnection Handling
📡 Live Voice Streaming
Tech Stack
Frontend
React.js
TypeScript
Vite
Zustand
Tailwind CSS
Framer Motion
WebSocket
Project Structure
frontend/
│
├── src/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── pages/
│   ├── styles/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
└── README.md
Installation
Clone Repository
git clone https://github.com/vishwalavanya/voice-text-ai-frontend.git
Move Into Project
cd voice-text-ai-frontend
Install Dependencies
npm install
Run Development Server
npm run dev

Frontend runs on:

http://localhost:5173
Production Build
npm run build
Preview Production Build
npm run preview
Environment Variables

Create:

.env

Example:

VITE_BACKEND_URL=https://your-backend-url.com
VITE_WEBSOCKET_URL=wss://your-websocket-url.com
Important Scripts
Development
"dev": "node ./node_modules/vite/bin/vite.js"
Production Build
"build": "node ./node_modules/vite/bin/vite.js build"
Preview
"preview": "node ./node_modules/vite/bin/vite.js preview"

These scripts avoid Linux permission-denied issues during Vercel deployment.

Netlify Deployment Settings
Framework Preset
Vite
Build Command
npm run build
Output Directory
dist
Install Command
npm install
Node.js Version
20.x
Important Deployment Fixes
Fix: vite permission denied

Use:

"build": "node ./node_modules/vite/bin/vite.js build"

instead of:

"build": "vite build"
.npmrc Configuration

Create:

.npmrc

Add:

unsafe-perm=true
fund=false
audit=false
GitHub Push Commands
git add .
git commit -m "frontend deployment update"
git push origin main
Netlify Deployment

Live URL:

Netlify Deployment
Browser Testing

Recommended Browser:

Google Chrome

Download:


Google Chrome Official Website

Test Features:

Voice microphone access
AI response playback
WebSocket connectivity
Appointment booking flow
Mobile responsiveness
