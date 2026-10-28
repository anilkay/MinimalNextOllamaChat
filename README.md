# Swift Circuit

A modern, minimalist chat interface for **any OpenAI-compatible API**. Connect it to OpenAI, OpenRouter, Groq, LM Studio, vLLM, Ollama's `/v1` endpoint, or your own self-hosted server — all from one clean UI.

Built with Next.js (App Router), React 19, Tailwind CSS, and React Markdown.

## Features

- 🎨 Modern dark UI with gradient accents and smooth animations
- ⚡ Streaming responses (server-sent events) with a live "stop" control
- 🔌 Works with any OpenAI-compatible endpoint — configure base URL + API key in-app
- 📱 Responsive layout that works on all devices
- 🛠 In-app settings, persisted to `localStorage`:
  - Base URL and API key (with show/hide)
  - Model selector (loaded from `/models`, with manual entry)
  - Temperature, seed, and system prompt controls
- 📝 Markdown rendering for assistant responses (code blocks, tables, lists)
- 🖼️ Image attachments for vision-capable models
- 💾 Save / restore conversations as JSON
- 📋 Copy assistant responses to the clipboard

## Architecture

The browser never talks to the upstream API directly. Instead, requests are proxied through two Next.js route handlers, which avoids CORS issues and keeps your key on your own server:

- `POST /api/chat` → forwards to `{baseUrl}/chat/completions` and streams the SSE response back
- `GET /api/models` → forwards to `{baseUrl}/models`

Your **base URL and API key are stored in your browser's `localStorage`** and are passed to the app's own server (via request headers) for each call. They are never bundled or sent to third parties.

> ⚠️ Note: because the app requires these server-side routes, a pure static export is **not** supported. Use the standalone Node server or the Docker image.

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)

### Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

## Configuration

All configuration happens in the app's sidebar:

1. **Base URL** — your OpenAI-compatible endpoint, e.g. `https://api.openai.com/v1`, `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `http://localhost:1234/v1` (LM Studio), or `http://localhost:11434/v1` (Ollama). If you omit `/v1` or the `https://` prefix, they are added automatically.
2. **API Key** — optional for local servers; required for hosted providers.
3. **Model** — select from the header dropdown (loaded from the endpoint's model list) or type an ID manually and press Enter.

## Docker

```bash
docker build -t swift-circuit .
docker run -p 3000:3000 swift-circuit
```

## Technologies Used

- [Next.js](https://nextjs.org/) — React framework (App Router, route handlers)
- [React 19](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [React Markdown](https://github.com/remarkjs/react-markdown) — markdown rendering
- [Lucide](https://lucide.dev/) — icons
- [React Toastify](https://fkhadra.github.io/react-toastify/) — notifications

## License

MIT License — feel free to use this project however you'd like.
