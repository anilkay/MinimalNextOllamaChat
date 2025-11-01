import React, { useState } from "react";
import { useChatStore } from "../stores/useChatStore";

export const SliderTemperatureComponent: React.FC = () => {
     const temperature = useChatStore((state) => state.temperature);
     const setTemperature = useChatStore((state) => state.setTemperature);
     const [localTemperature,setLocalTemperature]= useState(temperature);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemperature(parseFloat(event.target.value));
        setLocalTemperature(parseFloat(event.target.value));
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <label htmlFor="slider" className="text-gray-400 font-medium">
                Value: <span className="font-bold">{localTemperature.toFixed(2)}</span>
            </label>
            <input
                id="slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localTemperature}
                onChange={handleChange}
                className="w-64 h-2 bg-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            />
        </div>
    );
};

export default SliderTemperatureComponent;