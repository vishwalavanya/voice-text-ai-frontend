# Real-Time Multilingual Voice AI Frontend

Production-grade React + TypeScript + Vite frontend for clinical appointment booking with real-time voice streaming.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- Native WebSocket API
- MediaRecorder + Web Audio API

## Backend Endpoints

- API Base URL: `https://voice-text-ai.onrender.com`
- WebSocket URL: `wss://voice-text-ai.onrender.com/ws/audio`

## Folder Structure

```txt
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── appointments.ts
│   │   ├── config.ts
│   │   └── websocket.ts
│   ├── components/
│   │   ├── appointment/
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── BookingStatus.tsx
│   │   │   └── DoctorCard.tsx
│   │   ├── chat/
│   │   │   ├── AIMessage.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── UserMessage.tsx
│   │   ├── dashboard/
│   │   │   ├── LanguageIndicator.tsx
│   │   │   ├── LatencyPanel.tsx
│   │   │   ├── SessionMemory.tsx
│   │   │   └── SystemStatus.tsx
│   │   └── voice/
│   │       ├── AIWaveAnimation.tsx
│   │       ├── AudioVisualizer.tsx
│   │       ├── MicrophoneButton.tsx
│   │       └── VoiceStatus.tsx
│   ├── hooks/
│   │   ├── useAudioPlayer.ts
│   │   ├── useMicrophone.ts
│   │   ├── useVoiceStreaming.ts
│   │   └── useWebSocket.ts
│   ├── pages/
│   │   └── Home.tsx
│   ├── services/
│   │   ├── audioPlayback.ts
│   │   ├── audioStreaming.ts
│   │   └── websocketService.ts
│   ├── store/
│   │   ├── appointmentStore.ts
│   │   ├── sessionStore.ts
│   │   └── voiceStore.ts
│   ├── styles/
│   │   └── theme.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Commands To Run In VS Code Terminal

1. `cd frontend`
2. `npm install`
3. `copy .env.example .env` (Windows PowerShell) or `cp .env.example .env` (macOS/Linux)
4. `npm run dev`

Build command:

1. `npm run build`
2. `npm run preview`

## Full Scaffold Commands (If You Want To Create Again)

1. `npm create vite@latest frontend -- --template react-ts`
2. `cd frontend`
3. `npm install`
4. `npm install tailwindcss postcss autoprefixer framer-motion zustand lucide-react clsx`
5. `npx tailwindcss init -p`

## Realtime Flow

1. User taps microphone.
2. `navigator.mediaDevices.getUserMedia()` opens mic stream.
3. `MediaRecorder` emits chunks every 250ms.
4. Frontend sends chunks via `wss://voice-text-ai.onrender.com/ws/audio`.
5. Backend returns transcript, AI text, memory updates, appointment updates, and optional audio chunks.
6. UI updates live transcript and AI response cards.
7. Audio chunks are queued and played in sequence.

## Backend Message Handling

The frontend parser handles flexible backend payloads:

- User transcript keys like `user_transcript`, `transcript`.
- AI response keys like `ai_response`, `assistant_response`, `response`.
- Language keys like `language`, `lang`, `detected_language`.
- Latency keys like `stt_latency`, `llm_latency`, `tts_latency`, `total_latency`.
- Session memory payloads like `session_memory` or `memory`.
- Appointment payloads like `appointment` or `booking`.

## Deployment

## Vercel

1. Push this `frontend` folder to GitHub.
2. Import project in Vercel.
3. Set Root Directory to `frontend`.
4. Add env vars:
   - `VITE_API_BASE_URL=https://voice-text-ai.onrender.com`
   - `VITE_WS_AUDIO_URL=wss://voice-text-ai.onrender.com/ws/audio`
5. Build command: `npm run build`
6. Output directory: `dist`

## Netlify

1. Push this `frontend` folder to GitHub.
2. Create new site from Git repo in Netlify.
3. Base directory: `frontend`
4. Build command: `npm run build`
5. Publish directory: `frontend/dist`
6. Add the same two environment variables.

## Production Notes

- Use HTTPS hosting so browser microphone access works.
- Keep the WebSocket URL as `wss://` in production.
- If backend audio format changes, update parser and player MIME support in:
  - `src/api/websocket.ts`
  - `src/services/audioPlayback.ts`
