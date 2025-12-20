import { ChatMessageMessageRequest } from "../Services/OllamaService";
import { ChatHistory } from "../page";

export function IsModelSelected(selectedModel:string | undefined | null):boolean{
    return !!selectedModel && selectedModel!=="";
}

export function IsSystemPromptAppended(messages:ChatMessageMessageRequest[],systemPromptUsage:boolean):boolean{
    return systemPromptUsage && messages.findIndex(x => x.role === "system")<0;
}

export const exportChatHistory = (chatHistory: ChatHistory[], systemPrompt: string, systemPromptUsage: boolean) => {
    const exportData = {
        chatHistory,
        systemPrompt,
        systemPromptUsage
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatHistory.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};