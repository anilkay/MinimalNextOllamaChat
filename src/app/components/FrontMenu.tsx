import Link from "next/link"
import { SelectModel } from "./SelectModel"
import SliderTemperatureComponent  from "./SliderTemperatureComponent"
import { memo } from "react";


interface ButtonLinkProps {
    href: string;
    buttonText: string;
}

const ButtonLinks= (props:Readonly<ButtonLinkProps>) => {
    return (
        <Link 
            href={props.href}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 text-gray-100"
        >
            {props.buttonText}
        </Link>
    );
};


interface FrontMenuProps {
    leftLinkText: string;
    leftLinkHref: string;
}

const MemoizedButtonLinks = memo(ButtonLinks);

export function FrontMenu(props:Readonly<FrontMenuProps>){
    return  (
        <>
        <div className="flex flex-col items-center gap-2">
            <MemoizedButtonLinks 
            href={props.leftLinkHref}
            buttonText={props.leftLinkText} 
            />
            
        </div>
            <div className="flex flex-col items-center gap-2">
                <SelectModel />
                <SliderTemperatureComponent />
            </div>

            <div>
            <div className="flex flex-col items-center gap-2">
                <MemoizedButtonLinks href="/models" buttonText="Manage Models" />
            </div>
        </div>
        </>
    )
}
export default memo(FrontMenu);
