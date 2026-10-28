# Minimal Next Ollama Chat

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
  - Temperature, seed, reasoning effort, and system prompt controls
- 📝 Markdown rendering for assistant responses (code blocks, tables, lists)
- 🧠 Reasoning effort control (Off / Low / Medium / High) + live reasoning display for reasoning models (OpenAI o-series, GPT-5, DeepSeek, …)
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

1. **Base URL** — your OpenAI-compatible endpoint, e.g. `https://api.openai.com/v1`, `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `http://localhost:1234/v1` (LM Studio), or `http://localhost:11434/v1` (Ollama). If you omit the protocol, `http://` is used for local/private hosts and `https://` otherwise; `/v1` is appended only when the URL has no path (so endpoints like `.../v1beta/openai` are kept as-is).
2. **API Key** — optional for local servers; required for hosted providers. **Key header** selects how it is sent: `Authorization: Bearer` (default) or `api-key` for Azure OpenAI / Azure AI Foundry (`Auto` picks `api-key` for `*.azure.com` hosts). For Foundry use the v1 endpoint, e.g. `https://<resource>.openai.azure.com/openai/v1`.
3. **Model** — select from the header dropdown (loaded from the endpoint's model list) or type an ID manually and press Enter.

## Docker

### Prebuilt images

Images for `linux/amd64` and `linux/arm64` are published to two registries:

- **GitHub Container Registry** (built automatically by GitHub Actions):

  ```bash
  docker run -p 3000:3000 ghcr.io/anilkay/minimalnextollamachat:latest
  ```

- **Docker Hub** (older images, plus releases pushed manually with `GenerateDockerImage.bash`):

  ```bash
  docker run -p 3000:3000 aanilkay/minimalnextollamachat:latest
  ```

The [Docker image workflow](.github/workflows/docker.yml) builds on every pull request and pushes to GHCR only:

| Trigger | GHCR tags |
| --- | --- |
| Push to `main` | `latest`, `sha-<short sha>` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `sha-<short sha>` |
| Pull request | build only, nothing pushed |

It can also be run by hand from the Actions tab (**Run workflow**). To release a version:

```bash
git tag v0.1.8
git push origin v0.1.8
```

### Build it yourself

```bash
docker build -t minimalnextollamachat .
docker run -p 3000:3000 minimalnextollamachat
```

To build both architectures and push to Docker Hub (requires `docker login`):

```bash
./GenerateDockerImage.bash Dockerfile latest
```

Because requests are made by the server, `localhost` inside the container is the container itself, not your machine. To reach Ollama or LM Studio running on the host, use `http://host.docker.internal:11434/v1` (on Linux, add `--add-host=host.docker.internal:host-gateway` to `docker run`).

### Restricting upstream hosts

The proxy forwards to whatever base URL the browser sends. If the app is reachable by others, set `ALLOWED_API_HOSTS` so the server can't be used to reach arbitrary hosts on your network:

```bash
docker run -p 3000:3000 -e ALLOWED_API_HOSTS=api.openai.com,host.docker.internal:11434 minimalnextollamachat
```

Entries may be a hostname (any port) or `host:port`. When unset, all hosts are allowed.

## Technologies Used

- [Next.js](https://nextjs.org/) — React framework (App Router, route handlers)
- [React 19](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [React Markdown](https://github.com/remarkjs/react-markdown) — markdown rendering
- [Lucide](https://lucide.dev/) — icons
- [React Toastify](https://fkhadra.github.io/react-toastify/) — notifications

## License

MIT License — feel free to use this project however you'd like.
