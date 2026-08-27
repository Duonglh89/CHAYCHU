import React from 'react';
import { X, Check, Sparkles, Type } from 'lucide-react';
import { FontFamilyType } from '../types';
import { FONT_OPTIONS, getFontFamilyStyle } from '../constants/fonts';

interface FontPickerModalProps {
  isOpen: boolean;
  selectedFont: FontFamilyType;
  onSelectFont: (font: FontFamilyType) => void;
  onClose: () => void;
}

export const FontPickerModal: React.FC<FontPickerModalProps> = ({
  isOpen,
  selectedFont,
  onSelectFont,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-[#e0e0e0] animate-fade-in">
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Type size={20} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">
                Chọn Phông Chữ Dễ Đọc (Typography)
              </h3>
              <p className="text-xs text-[#888888]">
                Tất cả phông chữ đều được tối ưu hóa cho tiếng Việt, chống mỏi mắt và rõ ràng từ xa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Font List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4 overflow-y-auto pr-1">
          {FONT_OPTIONS.map((font) => {
            const isSelected = selectedFont === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  onSelectFont(font.id);
                }}
                className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative group ${
                  isSelected
                    ? 'bg-[#16140f] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                    : 'bg-[#111111] border-[#222222] hover:border-[#3a3a3a] hover:bg-[#141414]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{font.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                          font.tagColor || 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {font.tag}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#888888] mb-3 leading-relaxed">{font.description}</p>
                </div>

                {/* Live Font Sample Rendered in the actual font */}
                <div
                  className="p-3 rounded-lg bg-[#080808] border border-[#222222] text-[#e0e0e0] text-sm leading-relaxed"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <p className="line-clamp-2">{font.sampleText}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#1a1a1a]">
                    {font.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-[#777777] bg-[#141414] px-1.5 py-0.5 rounded"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Preview Box with Current Selection */}
        <div className="p-3.5 rounded-xl bg-[#111111] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles size={16} />
            <span className="font-serif">
              Đang áp dụng:{' '}
              <strong className="text-white">
                {FONT_OPTIONS.find((f) => f.id === selectedFont)?.name || 'Mặc định'}
              </strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-wide text-xs transition active:scale-95 shadow-lg shadow-amber-950/30"
          >
            Áp Dụng Phông Chữ
          </button>
        </div>
      </div>
    </div>
  );
};
