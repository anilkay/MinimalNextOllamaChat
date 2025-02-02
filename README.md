# Minimal Next.js Ollama Chat Interface

A modern, minimalist chat interface for Ollama, built with Next.js and enhanced with Windsurf's AI assistance. This project provides a clean and intuitive way to interact with your local Ollama models.

## Features

- 🎨 Modern UI with gradient backgrounds and smooth animations
- 🔄 Real-time chat interactions with Ollama models
- 📱 Responsive design that works on all devices
- 🛠 Complete model management:
  - View installed models
  - Pull new models
  - Delete existing models
- 🔄 Easy navigation between chat and model management
- 🎯 Real-time model selection

## Prerequisites

- Node.js 18+ installed
- [Ollama](https://ollama.ai) installed and running locally
- A compatible Ollama model (e.g., llama2, mistral, etc.)

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd minimalnextollamachat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start Ollama server locally (make sure you have at least one model pulled)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## Getting Started with Docker

You can easily run the Minimal Next Ollama Chat application using Docker. To pull the image from Docker Hub, use the following command:

```bash
docker pull aanilkay/minimalnextollamachat
```

After pulling the image, you can run it with Docker to start using the application.

## Docker Instructions

## Prerequisites
Make sure you have [Docker](https://www.docker.com/) installed on your machine.

## Building the Docker Image
To build the Docker image for the application, run the following command in the root of your project:

```bash
docker build -t minimalnextollamachat .
```

## Running the Docker Container
Once the image is built, you can run the container using:

```bash
docker run -p 3000:3000 minimalnextollamachat
```

## Accessing the Application
After running the container, you can access the application at `http://localhost:3000`. 

## Static Version

If you want to use the static version of the application, you can pull the following image:

```bash
docker pull aanilkay/minimalnextollamachat:latest_static
```

## Running the Static Version

To run the static version of the application, use the following command:

```bash
docker run -p 3000:80 aanilkay/minimalnextollamachat:latest_static
```

This will map port 3000 on your host to port 80 in the container.

## Usage

### Chat Interface
1. Select your preferred Ollama model from the dropdown
2. Type your message in the input field
3. Press "Send" to send your message
4. View the model's response in the chat history

### Model Management
1. Click "Manage Models" in the top navigation
2. View all installed models and their sizes
3. Pull new models:
   - Enter the model name (e.g., llama2, mistral)
   - Click "Pull Model" and wait for completion
4. Delete models:
   - Click "Delete" next to any installed model
   - Confirm deletion when prompted
5. Return to chat using "Back to Chat" button

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Ollama](https://ollama.ai) - Local LLM runtime
- Windsurf - AI assistance for development

## Development Notes

This project was developed with the assistance of Windsurf's AI tools, which helped in creating a modern and efficient user interface. The codebase is organized into reusable components and follows React best practices.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

MIT License - feel free to use this project however you'd like.

---
*Built with Next.js and enhanced by Windsurf AI assistance*
