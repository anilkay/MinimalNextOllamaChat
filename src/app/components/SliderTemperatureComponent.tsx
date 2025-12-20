import React, { useState } from "react";
import { useChatContext } from "../ChatContext";

export const SliderTemperatureComponent: React.FC = () => {
     const { temperature,setTemperature } = useChatContext();
     const [localTemperature,setLocalTemperature]= useState(temperature);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemperature(parseFloat(event.target.value));
        setLocalTemperature(parseFloat(event.target.value));
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <input
                id="slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localTemperature}
                onChange={handleChange}
                className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                title={`Temperature: ${localTemperature.toFixed(2)}`}
            />
            <span className="text-xs text-gray-400 font-mono w-8 text-right">
                {localTemperature.toFixed(1)}
            </span>
        </div>
    );
};

export default SliderTemperatureComponent;