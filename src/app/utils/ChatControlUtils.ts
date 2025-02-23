import { ChatMessageMessageRequest } from "../Services/OllamaService";

export function IsModelSelected(selectedModel:string | undefined | null):boolean{
    return !!selectedModel && selectedModel!=="";
}

export function IsSystemPromptAppended(messages:ChatMessageMessageRequest[],systemPromptUsage:boolean):boolean{
    return systemPromptUsage && messages.findIndex(x => x.role === "system")<0;
}