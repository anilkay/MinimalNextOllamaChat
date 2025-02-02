import Link from "next/link"
import { SeedComponent } from "./SeedComponent"
import { SelectModel } from "./SelectModel"
import { SliderTemperatureComponent } from "./SliderTemperatureComponent"

interface FrontMenuProps {
    leftLinkText: string;
    leftLinkHref: string;
}

export function FrontMenu(props:FrontMenuProps){
    return  (
        <>
        <div className="flex flex-col items-center gap-2">
            <Link 
            href={props.leftLinkHref}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"

            >
                {props.leftLinkText} 
            </Link>
            
        </div>
            <div className="flex flex-col items-center gap-2">
                <SelectModel />
                <SliderTemperatureComponent />
            </div>

            <div className="flex flex-col items-center gap-2">
                <SeedComponent />
             </div>
            <div>
            <div className="flex flex-col items-center gap-2">
            <Link 
                href="/models"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
            >
                Manage Models
            </Link>
            </div>
        </div>
        </>
    )
}