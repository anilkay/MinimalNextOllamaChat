import { memo } from "react";
import  SeedComponent  from "./SeedComponent";
import { SystemPromptComponent } from "./SystemPromptComponent";


export function LeftMenu() {
    return (
        <div className="flex flex-col items-start gap-2">
                <SeedComponent />
                <SystemPromptComponent />
             </div>
    );
}

export default memo(LeftMenu);

