import  SeedComponent  from "./SeedComponent";
import  SystemPromptComponent  from "./SystemPromptComponent";
import RestoreChatHistory from "./RestoreChatHistory";


// React Compiler handles component optimization automatically
export function LeftMenu() {
    return (
        <div className="flex flex-col items-start gap-2">
                <SeedComponent />
                <SystemPromptComponent />
                <RestoreChatHistory />
             </div>
    );
}

export default LeftMenu;

