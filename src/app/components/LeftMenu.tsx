import { memo } from "react";
import  SeedComponent  from "./SeedComponent";
import { SystemPromptComponent } from "./SystemPromptComponent";
import RestoreChatHistory from "./RestoreChatHistory";


export function LeftMenu() {
    return (
        <div className="flex flex-col items-start gap-2">
                <SeedComponent />
                <SystemPromptComponent />
                <RestoreChatHistory />
             </div>
    );
}

export default memo(LeftMenu);

