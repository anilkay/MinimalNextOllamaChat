# Minimal Next Ollama Chat

A modern, minimalist chat interface for **any OpenAI-compatible API**. Connect it to OpenAI, OpenRouter, Groq, LM Studio, vLLM, Ollama's `/v1` endpoint, or your own self-hosted server — all from one clean UI.

Built with Next.js (App Router), React 19, Tailwind CSS, and React Markdown.

## Features

- 🎨 Modern dark UI with gradient accents and smooth animations
- ⚡ Streaming responses (server-sent events) with a live "stop" control
- 🔌 Works with any OpenAI-compatible endpoint — configure base URL + API key in-app
- 🔀 Chat Completions or the Responses API (`/responses`), per connection
- 🧮 Embeddings page: embed several texts at once, compare them with cosine similarity
- ⚖️ Decide page for [TypeSafe](https://typesafe.ai) System One models (Jev): typed Choice / Noul / Score answers with probabilities
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

The browser never talks to the upstream API directly. Instead, requests are proxied through Next.js route handlers, which avoids CORS issues and keeps your key on your own server:

- `POST /api/chat` → forwards to `{baseUrl}/chat/completions` and streams the SSE response back
- `POST /api/responses` → forwards to `{baseUrl}/responses` (streamed the same way)
- `POST /api/embeddings` → forwards to `{baseUrl}/embeddings`
- `POST /api/systemone` → forwards to `{baseUrl}/systemone` (TypeSafe), retrying on 429 / 529
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
4. **Chat API** — `Chat Completions` (default) or `Responses`. The Responses API is supported by OpenAI, Azure OpenAI / Foundry, Ollama, LM Studio and vLLM. Requests are stateless either way: the whole conversation is sent each time, with `store: false`. With Responses, the system prompt is sent as `instructions`, reasoning effort as `reasoning.effort` (with a reasoning summary when the account allows it), and the seed is not sent because the API has none.

## Pages

| Page | What it does |
| --- | --- |
| `/` | Chat, the reply arrives whole |
| `/chatstream` | Chat, streamed token by token |
| `/embeddings` | Embeddings and similarity |
| `/decide` | TypeSafe System One decisions (Jev) |

### Embeddings

Pick an embedding model in the header (e.g. `text-embedding-3-small`, or `nomic-embed-text` / `bge-m3` on Ollama), enter a few texts and press **Embed**. All texts go to `/embeddings` in one request. The page shows:

- the texts ranked by cosine similarity to the first one,
- the full similarity matrix,
- each vector's norm and first values, with buttons to copy a vector or download all of them as JSON.

**Dimensions** is optional and only works with models that support shortened vectors, such as OpenAI's `text-embedding-3-*`. The embeddings page uses the same connection as the chat.

### Decide (TypeSafe System One / Jev)

[System One models](https://docs.typesafe.ai/concepts/system-one) like Jev don't generate text. They answer typed questions about a piece of state with calibrated probabilities. The Decide page has its own connection in the sidebar: the base URL (default `https://api.typesafe.ai/v1`) and a TypeSafe API key. The model list (`jev-latest`, `jev-preview`, …) is loaded from the API.

1. Enter the **state**: plain text, or JSON. An object or array is sent as structured JSON, and questions can refer to its fields as `` `review` `` or `` `ticket.messages[0].text` ``.
2. Add questions. The name is the answer's key and is not shown to the model.
   - **Choice**: picks one of up to 255 options and gives a probability for each. Option descriptions are optional.
   - **Noul**: gives the probability that a condition holds. The page reads at least 0.7 as yes and at most 0.3 as no, which is a starting point taken from TypeSafe's docs.
   - **Score**: gives the expected position on 2–10 ordered levels, lowest first, plus the probability of each level.
3. Press **Decide** (or Ctrl+Enter). All questions are sent in one request and answered independently. Choice and Score answers include a confidence.

**Load example** fills in a ready-made workspace. **Request JSON** shows the exact body, so you can copy it into your own code. **Long context** sends `TypeSafe-Danger-Zone-Long-Context: true`, which raises the limit from 64k to 262k tokens but is slower and less accurate. The state and questions are kept in your browser's `localStorage`. Image (Box) questions are not supported.

## MCP tools

The chat can use tools from [Model Context Protocol](https://modelcontextprotocol.io) servers. Add them under **MCP servers** in the sidebar:

1. Click **Add MCP server** and enter a name and the server's URL (e.g. `https://example.com/mcp`). Add headers such as `Authorization: Bearer …` if the server needs them, one per line.
2. The app connects, lists the server's tools and offers them to the model with every message. The model must support tool calling (OpenAI, most hosted providers, and Ollama/LM Studio models that support tools).
3. When the model calls a tool, a card shows the tool and its arguments with **Run** / **Deny** buttons. Nothing runs until you approve it. You can turn on **Run tools without asking** per server, but only do that for servers whose tools can't change or send anything: tool results can contain text that tries to steer the model.

Notes:

- Only **HTTP** servers are supported (Streamable HTTP, falling back to the older HTTP+SSE transport). Servers that run as a local command (stdio) need an HTTP bridge such as [`mcp-proxy`](https://github.com/sparfenyuk/mcp-proxy).
- Like the chat API, MCP requests are made by the app's server, so in Docker `localhost` means the container. Use `host.docker.internal` for servers on your machine.
- Server URLs and headers are stored in your browser's `localStorage`, like the API key.
- A single message can trigger up to 10 rounds of tool calls.
- Set `ALLOWED_MCP_HOSTS` (same format as `ALLOWED_API_HOSTS` below) to limit which MCP servers the app's server will connect to.

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
git tag v0.2.0
git push origin v0.2.0
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

Entries may be a hostname (any port) or `host:port`. When unset, all hosts are allowed. The list also covers the Decide page, so add `api.typesafe.ai` if you use it.

## Technologies Used

- [Next.js](https://nextjs.org/) — React framework (App Router, route handlers)
- [React 19](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [React Markdown](https://github.com/remarkjs/react-markdown) — markdown rendering
- [Lucide](https://lucide.dev/) — icons
- [React Toastify](https://fkhadra.github.io/react-toastify/) — notifications

## License

MIT License — feel free to use this project however you'd like.
