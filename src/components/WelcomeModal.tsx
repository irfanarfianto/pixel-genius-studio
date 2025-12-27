import React, { useState } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { Palette, Play } from 'lucide-react';

const COLORS = [
    '#EF4444', // Merah
    '#F97316', // Orange
    '#F59E0B', // Kuning
    '#10B981', // Hijau
    '#3B82F6', // Biru
    '#6366F1', // Indigo
    '#8B5CF6', // Ungu
    '#EC4899', // Pink
];

export const WelcomeModal: React.FC = () => {
    const { userName, setUserIdentity } = useDrawingStore();
    const [inputName, setInputName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[5]); // Default Indigo

    if (userName) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputName.trim()) {
            setUserIdentity(inputName.trim(), selectedColor);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 text-center animate-in zoom-in duration-500 border-4 border-indigo-100">
                {/* Header Icon */}
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl transition-colors duration-300"
                    style={{ backgroundColor: selectedColor }}
                >
                    <Palette size={48} />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-800 mb-2 font-display">Halo Teman Baru! 👋</h2>
                <p className="text-gray-500 mb-8 text-lg font-medium">Siapa namamu?</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div>
                        <input
                            type="text"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            placeholder="Tulis namamu disini..."
                            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-xl font-bold text-center placeholder:text-gray-300 shadow-sm"
                            autoFocus
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-gray-500 text-sm font-bold mb-3 uppercase tracking-wide">Pilih Warna Kesukaanmu:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${selectedColor === color ? 'ring-4 ring-offset-2 scale-110' : 'hover:shadow-md'}`}
                                    style={{
                                        backgroundColor: color,
                                        borderColor: selectedColor === color ? color : 'transparent',
                                        '--tw-ring-color': color
                                    } as any}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!inputName.trim()}
                        className="w-full py-4 rounded-2xl font-bold text-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ backgroundColor: inputName.trim() ? selectedColor : '#d1d5db' }}
                    >
                        <span>Mulai Menggambar!</span>
                        <Play fill="currentColor" size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};
