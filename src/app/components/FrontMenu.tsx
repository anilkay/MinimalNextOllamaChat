import Link from "next/link"
import { SelectModel } from "./SelectModel"
import SliderTemperatureComponent  from "./SliderTemperatureComponent"
import { Settings, MessageSquare } from 'lucide-react';

interface ButtonLinkProps {
    href: string;
    buttonText: string;
    icon?: React.ReactNode;
}

const ButtonLinks= (props:Readonly<ButtonLinkProps>) => {
    return (
        <Link 
            href={props.href}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors text-sm text-gray-200"
        >
            {props.icon}
            <span>{props.buttonText}</span>
        </Link>
    );
};


interface FrontMenuProps {
    leftLinkText: string;
    leftLinkHref: string;
}

export function FrontMenu(props:Readonly<FrontMenuProps>){
    return  (
        <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2">
                <ButtonLinks 
                    href={props.leftLinkHref}
                    buttonText={props.leftLinkText} 
                    icon={<MessageSquare size={14} />}
                />
            </div>
            
            <div className="flex items-center gap-4">
                <SelectModel />
                <div className="w-32">
                    <SliderTemperatureComponent />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ButtonLinks 
                    href="/models" 
                    buttonText="Models" 
                    icon={<Settings size={14} />}
                />
            </div>
        </div>
    )
}
export default FrontMenu;
