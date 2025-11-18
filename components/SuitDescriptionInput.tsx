import React from 'react';

interface SuitDescriptionInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
}

const suggestions = [
  "A classic black tuxedo",
  "A modern slim-fit navy suit",
  "A vintage tweed jacket",
  "A James Bond style white dinner jacket"
];


export const SuitDescriptionInput: React.FC<SuitDescriptionInputProps> = ({ description, onDescriptionChange }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col items-center text-center h-full w-full shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2">2. Describe the Suit</h2>
      <p className="text-slate-400 mb-4">Tell the AI what you want to wear. Be descriptive!</p>
      <div className="relative w-full h-full min-h-[200px] sm:min-h-0 sm:aspect-square bg-slate-900/70 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600 focus-within:border-indigo-500 transition-all duration-300 group overflow-hidden">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g., 'a sharp navy blue tuxedo with a black bowtie and a white pocket square'"
          className="w-full h-full bg-transparent text-slate-200 resize-none border-0 focus:ring-0 text-center placeholder:text-slate-500 p-4"
          aria-label="Suit Description"
        />
      </div>
       <div className="w-full mt-4">
        <p className="text-sm text-slate-400 mb-2">Quick ideas:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => onDescriptionChange(s)}
              className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};