
import React, { useState, useCallback } from 'react';
import { StickerShape, StickerType } from './types';
import { generateStickerPreview } from './services/geminiService';
import { UploadIcon, SparklesIcon, XCircleIcon } from './components/Icons';

// Helper function to define components outside the main App component
// FIX: Define props type explicitly to aid TypeScript's generic type inference.
type OptionButtonProps<T> = {
    value: T;
    selectedValue: T;
    onSelect: (value: T) => void;
    children: React.ReactNode;
};

const OptionButton = <T,>({ value, selectedValue, onSelect, children }: OptionButtonProps<T>) => (
    <button
        onClick={() => onSelect(value)}
        className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            ${selectedValue === value
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            }`}
    >
        {children}
    </button>
);


const App: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
    const [stickerShape, setStickerShape] = useState<StickerShape>(StickerShape.Round);
    const [stickerType, setStickerType] = useState<StickerType>(StickerType.Vinyl);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setGeneratedImage(null);
            setError(null);
            setUploadedImage({
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }
    };

    const handleGenerateClick = useCallback(async () => {
        if (!uploadedImage) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const resultBase64 = await generateStickerPreview(uploadedImage.file, stickerShape, stickerType);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (err) {
            console.error(err);
            setError('Failed to generate sticker preview. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [uploadedImage, stickerShape, stickerType]);

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            <main className="container mx-auto p-4 md:p-8">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Control Panel */}
                        <div className="flex flex-col space-y-6">
                            <div className="text-center lg:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">AI Sticker Generator</h1>
                                <p className="mt-2 text-slate-600">Upload an image to create a high-quality sticker preview.</p>
                            </div>
                            
                            {/* Step 1: Upload */}
                            <div className="space-y-2">
                                <h2 className="font-semibold text-slate-700">1. Upload Image</h2>
                                <label htmlFor="image-upload" className="cursor-pointer group">
                                    <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-200 ${uploadedImage ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                                        <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                        {uploadedImage ? (
                                            <img src={uploadedImage.previewUrl} alt="Uploaded preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center space-y-3 text-slate-500 group-hover:text-indigo-600">
                                                <UploadIcon className="w-10 h-10" />
                                                <span className="font-medium">Click to upload or drag & drop</span>
                                                <span className="text-sm">PNG, JPG, WEBP</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Step 2: Choose Shape */}
                            <div className="space-y-2">
                                <h2 className="font-semibold text-slate-700">2. Select Shape</h2>
                                <div className="flex space-x-3">
                                    {/* FIX: Wrapped state setters in arrow functions to ensure correct type inference for the generic `onSelect` prop. */}
                                    <OptionButton value={StickerShape.Round} selectedValue={stickerShape} onSelect={(v) => setStickerShape(v)}>Round</OptionButton>
                                    <OptionButton value={StickerShape.Square} selectedValue={stickerShape} onSelect={(v) => setStickerShape(v)}>Square</OptionButton>
                                    <OptionButton value={StickerShape.Rectangle} selectedValue={stickerShape} onSelect={(v) => setStickerShape(v)}>Rectangle</OptionButton>
                                </div>
                            </div>

                            {/* Step 3: Choose Type */}
                            <div className="space-y-2">
                                <h2 className="font-semibold text-slate-700">3. Select Material</h2>
                                <div className="flex space-x-3">
                                    {/* FIX: Wrapped state setters in arrow functions to ensure correct type inference for the generic `onSelect` prop. */}
                                    <OptionButton value={StickerType.Vinyl} selectedValue={stickerType} onSelect={(v) => setStickerType(v)}>Vinyl</OptionButton>
                                    <OptionButton value={StickerType.Domed} selectedValue={stickerType} onSelect={(v) => setStickerType(v)}>Domed (Resined)</OptionButton>
                                </div>
                            </div>

                             {/* Generate Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleGenerateClick}
                                    disabled={!uploadedImage || isLoading}
                                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-6 h-6" />
                                            <span>Generate Preview</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="bg-slate-200/50 rounded-2xl flex items-center justify-center min-h-[300px] lg:min-h-full p-4 relative overflow-hidden">
                             <div className="absolute inset-0 bg-grid-slate-300/[0.2] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                            <div className="z-10 w-full h-full flex flex-col items-center justify-center">
                                {isLoading && (
                                    <div className="text-center text-slate-600">
                                        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 font-semibold">AI is crafting your sticker...</p>
                                        <p className="text-sm">This may take a moment.</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">
                                        <XCircleIcon className="w-10 h-10 mx-auto" />
                                        <p className="mt-2 font-semibold">An Error Occurred</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                                {generatedImage && !isLoading && (
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">Your Sticker Preview</h3>
                                        <img src={generatedImage} alt="Generated sticker preview" className="max-w-full max-h-96 object-contain drop-shadow-2xl" />
                                    </div>
                                )}
                                {!isLoading && !generatedImage && !error && (
                                    <div className="text-center text-slate-500">
                                        <p className="font-semibold">Your preview will appear here.</p>
                                        <p className="text-sm">Complete the steps to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
