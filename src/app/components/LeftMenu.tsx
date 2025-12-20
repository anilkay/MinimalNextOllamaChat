import  SeedComponent  from "./SeedComponent";
import  SystemPromptComponent  from "./SystemPromptComponent";
import RestoreChatHistory from "./RestoreChatHistory";
import { useChatContext } from "../ChatContext";
import { exportChatHistory } from "../utils/ChatControlUtils";
import { Download } from "lucide-react";


export function LeftMenu() {
    const { chatHistory, systemPrompt, systemPromptUsage } = useChatContext();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h2>
                <SeedComponent />
                <SystemPromptComponent />
            </div>
            
            <div className="pt-4 border-t border-gray-800">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">History</h2>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => exportChatHistory(chatHistory, systemPrompt(), systemPromptUsage())}
                        className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-200 transition-all group"
                        title="Save current conversation to JSON"
                    >
                        <Download size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                        <span>Save Conversation</span>
                    </button>
                    <RestoreChatHistory />
                </div>
            </div>
        </div>
    );
}

export default LeftMenu;

