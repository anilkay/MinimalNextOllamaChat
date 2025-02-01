import React from "react";
import { useChatContext } from "../ChatContext";

export const SliderTemperatureComponent: React.FC = () => {
     const { temperature,setTemperature } = useChatContext();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemperature(parseFloat(event.target.value)); // Slider'dan gelen değeri güncelle
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <label htmlFor="slider" className="text-gray-700 font-medium">
                Value: <span className="font-bold">{temperature.toFixed(2)}</span>
            </label>
            <input
                id="slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={temperature}
                onChange={handleChange}
                className="w-64 h-2 bg-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            />
        </div>
    );
};