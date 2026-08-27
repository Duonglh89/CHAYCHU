import React from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sliders,
  Type,
  Gauge,
  Eye,
  Keyboard,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PrompterSettings, ThemeType, FontFamilyType } from '../types';
import { DEFAULT_PROMPTER_SETTINGS } from '../services/storage';
import { FONT_OPTIONS, getFontFamilyStyle } from '../constants/fonts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrompterSettings;
  onUpdateSettings: (newSettings: Partial<PrompterSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-[#e0e0e0]">
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">Cài Đặt Máy Nhắc Chữ</h3>
              <p className="text-xs text-[#888888]">Tùy chỉnh trải nghiệm đọc kịch bản theo phong cách của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-5 overflow-y-auto py-4 pr-1">
          {/* Typography Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Type size={13} /> Phông Chữ & Kiểu Hiển Thị
              </h4>
              <span className="text-[11px] text-[#888888] font-mono">
                Đang dùng: <strong className="text-amber-400">{FONT_OPTIONS.find(f => f.id === settings.fontFamily)?.name || 'Lexend'}</strong>
              </span>
            </div>

            {/* Interactive Font Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {FONT_OPTIONS.map((font) => {
                const isSelected = settings.fontFamily === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontFamily: font.id })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#18150f] border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/20'
                        : 'bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-semibold text-xs text-white">{font.shortName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                            font.tagColor || 'bg-[#1a1a1a] text-[#888888] border-[#333333]'
                          }`}
                        >
                          {font.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] line-clamp-2 mb-2 leading-relaxed">
                        {font.description}
                      </p>
                    </div>

                    {/* Sample preview */}
                    <div
                      className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-xs text-[#e0e0e0] truncate"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      {font.sampleText}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Typography Sliders & Theme Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#111111] p-4 rounded-xl border border-[#222222] text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-medium block text-[#888888]">Giao diện tương phản (Theme)</label>
                <select
                  value={settings.theme}
                  onChange={(e) => onUpdateSettings({ theme: e.target.value as ThemeType })}
                  className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-white"
                >
                  <option value="oled">OLED Đen Tuyệt Đối (Chữ Trắng - Tiết kiệm pin & Rõ nét)</option>
                  <option value="sunset-amber">Hoàng Hôn Ấm Áp (Tone Vàng Đầm Dịu Mắt)</option>
                  <option value="high-contrast-yellow">Vàng Nổi Bật (Chống lóa đèn studio)</option>
                  <option value="studio-green">Xanh Lá Matrix Chuyên Nghiệp</option>
                  <option value="navy-blue">Xanh Đêm Midnight Navy</option>
                  <option value="paper-light">Giấy Trắng Sáng (Ban ngày)</option>
                </select>
              </div>

              {/* Line Height */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#888888]">Độ giãn dòng:</span>
                  <span className="text-amber-500 font-mono font-bold">{settings.lineHeight}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
                />
              </div>

              {/* Text Margin Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#888888]">Lề văn bản (thu hẹp vùng mắt nhìn):</span>
                  <span className="text-amber-500 font-mono font-bold">{settings.textMargin}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={settings.textMargin}
                  onChange={(e) => onUpdateSettings({ textMargin: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Reading & Cuộn Tự Động Section */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Eye size={13} /> Vùng Đọc & Đếm Ngược
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#111111] p-4 rounded-xl border border-[#222222] text-xs">
              <div className="space-y-1.5">
                <label className="font-medium block text-[#888888]">Đếm ngược trước khi chạy</label>
                <select
                  value={settings.countdownSeconds}
                  onChange={(e) => onUpdateSettings({ countdownSeconds: Number(e.target.value) })}
                  className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-white"
                >
                  <option value={0}>Không đếm ngược (Chạy ngay)</option>
                  <option value={3}>Đếm ngược 3 giây</option>
                  <option value={5}>Đếm ngược 5 giây</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium block text-[#888888]">Vị trí dải đọc trọng tâm</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="5"
                    value={settings.focusPosition}
                    onChange={(e) => onUpdateSettings({ focusPosition: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
                  />
                  <span className="text-amber-500 font-mono font-bold w-10 text-right">{settings.focusPosition}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotkeys Cheatsheet */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
              <Keyboard size={13} /> Phím tắt bàn phím (Desktop)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Phát / Tạm dừng:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">
                  Space
                </kbd>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Tăng / Giảm tốc độ:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">
                  ↑ / ↓
                </kbd>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Tua lùi / Tua tới:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">
                  ← / →
                </kbd>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Toàn màn hình:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">F</kbd>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Phản chiếu gương:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">M</kbd>
              </div>
              <div className="p-2.5 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-between">
                <span className="text-[#888888]">Về đầu trang:</span>
                <kbd className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-amber-400 font-mono font-bold text-[11px]">R</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
          <button
            onClick={() => onUpdateSettings(DEFAULT_PROMPTER_SETTINGS)}
            className="text-xs text-[#888888] hover:text-white flex items-center gap-1.5 transition"
          >
            <RotateCcw size={13} />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-wide text-xs transition active:scale-95 shadow-lg shadow-amber-950/30"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
