import  SeedComponent  from "./SeedComponent";
import  SystemPromptComponent  from "./SystemPromptComponent";
import RestoreChatHistory from "./RestoreChatHistory";


export function LeftMenu() {
    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h2>
                <SeedComponent />
                <SystemPromptComponent />
            </div>
            
            <div className="pt-4 border-t border-gray-800">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">History</h2>
                <RestoreChatHistory />
            </div>
        </div>
    );
}

export default LeftMenu;

