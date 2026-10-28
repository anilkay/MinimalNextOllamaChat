"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Paperclip, Send, Square, X } from "lucide-react";
import { useApp } from "@/app/store/AppContext";

export function MessageInput() {
  const { sendMessage, isStreaming, stop } = useApp();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [value]);

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    const text = value;
    const img = image;
    if (!text.trim() && !img) return;
    if (isStreaming) return;
    setValue("");
    clearImage();
    await sendMessage(text, img);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canSend = Boolean(value.trim() || image);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
      {preview && (
        <div className="px-4 pt-4">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data-URL preview */}
            <img
              src={preview}
              alt="preview"
              className="h-20 rounded-lg border border-gray-600 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-gray-700 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <button
          onClick={() => fileRef.current?.click()}
          className={`p-2 rounded-lg transition-colors ${
            image
              ? "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          }`}
          title="Attach image"
        >
          {image ? <ImageIcon size={20} /> : <Paperclip size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isStreaming ? "Generating…" : "Type a message…"}
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none py-2 max-h-[200px] overflow-y-auto"
        />

        {isStreaming ? (
          <button
            onClick={stop}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
            title="Stop generating"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canSend
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
            title="Send"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
