export interface ChatHistory {
    message: string;
    sender: string;
    messageNumber: number;
    role: 'user' | 'assistant'
    images: string[] | null
}
