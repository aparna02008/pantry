import React, { useState, useRef } from "react";
import { UploadCloud, Camera, Sparkles, Wand2 } from "lucide-react";

interface ImageUploaderProps {
  onIngredientsDetected: (ingredients: string[]) => void;
  onAddLog: (type: "success" | "error" | "info", message: string) => void;
  demoMode: boolean;
  onSetDemoIngredients: () => void;
}

export default function ImageUploader({
  onIngredientsDetected,
  onAddLog,
  demoMode,
  onSetDemoIngredients,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onAddLog("error", "Invalid file type. Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPreviewUrl(base64Data);
      onAddLog("info", `Selected fridge photo: ${file.name} (${Math.round(file.size / 1024)} KB)`);

      await uploadAndScan(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const uploadAndScan = async (base64WithHeader: string, mimeType: string) => {
    setIsScanning(true);
    onAddLog("info", "Extracting base64 image payload...");

    const base64Clean = base64WithHeader.split(",")[1];

    if (demoMode) {
      onAddLog("info", "Demonstration Mode Active: Parsing image features with local machine vision mock...");
      setTimeout(() => {
        setIsScanning(false);
        const randomItems = ["Tomato", "Egg", "Onion", "Cheese", "Spinach"];
        onIngredientsDetected(randomItems);
        onAddLog("success", `Mock Vision success: Sparsed item shapes and cataloged: [${randomItems.join(", ")}]`);
      }, 1500);
      return;
    }

    try {
      const response = await fetch("/api/detect-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Clean, mimeType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server failed to analyze: status ${response.status}`);
      }

      const list = data.ingredients || [];
      setIsScanning(false);
      if (list.length > 0) {
        onIngredientsDetected(list);
        onAddLog("success", `Gemini Vision parsed ${list.length} item(s): [${list.join(", ")}]`);
      } else {
        onAddLog("info", "Gemini scanned the photo but could not find any visible pantry ingredients. Try manually typing some!");
      }
    } catch (err: any) {
      setIsScanning(false);
      const msg = err?.message || String(err);
      onAddLog("error", `Scanned parse failed: ${msg}`);
      onAddLog("info", "Recommendation: Try enabling 'Demo Mode' on the toolbar to simulate instant photo scans offline!");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs transition-all hover:shadow-xs" id="photo-scanner-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <Camera className="h-4.5 w-4.5 text-emerald-600" />
            Pantry Scanner
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Upload or drag a photo of your fridge ingredients
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
          AI Vision Ready
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/20"
            : isScanning
            ? "border-amber-500 bg-amber-50/10 cursor-not-allowed"
            : "border-gray-200 hover:border-emerald-500/80 hover:bg-gray-50/40"
        }`}
        id="drag-drop-container"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isScanning}
          id="file-input-raw"
        />

        {isScanning ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="relative mb-3">
              <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <Wand2 className="h-4 w-4 text-amber-500 absolute top-3 left-3 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider animate-pulse">
              Gemini Vision Sparsing...
            </p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-[220px]">
              Recognizing labels, fresh food silhouettes, and packaging.
            </p>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
            <img src={previewUrl} alt="Fridge preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadCloud className="h-8 w-8 text-white mb-1" />
              <p className="text-white font-semibold text-xs">Choose another image</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <div className="bg-gray-100 text-gray-600 p-3 rounded-full mb-3 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-800">Drag your photo here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse your local device</p>
            <p className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500 font-medium">No photo on hand?</span>
        <button
          onClick={onSetDemoIngredients}
          disabled={isScanning}
          className="text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-100/50 transition-all font-bold flex items-center gap-1 cursor-pointer"
          id="btn-load-demo-shelf"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Load Demo Ingredients
        </button>
      </div>
    </div>
  );
}
