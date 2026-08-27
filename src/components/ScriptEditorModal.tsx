import React, { useState } from 'react';
import {
  X,
  Save,
  Sparkles,
  Play,
  Type,
  Gauge,
  Clock,
  FileText,
  Check,
  AlertCircle,
  Tag,
  Wand2,
  ListOrdered,
  Scissors,
} from 'lucide-react';
import { ScriptItem, PrompterSettings, FontFamilyType } from '../types';
import { calculateStats } from '../utils/textUtils';
import { optimizeScriptWithAI } from '../services/api';
import { FONT_OPTIONS, getFontFamilyStyle } from '../constants/fonts';

interface ScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ScriptItem | null;
  onSave: (scriptData: Partial<ScriptItem>) => Promise<void>;
  onStartPrompter: (script: ScriptItem) => void;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  isOpen,
  onClose,
  script,
  onSave,
  onStartPrompter,
}) => {
  const [title, setTitle] = useState<string>(script?.title || 'Kịch bản mới');
  const [content, setContent] = useState<string>(script?.content || '');
  const [tagInput, setTagInput] = useState<string>(script?.tags?.join(', ') || '');
  const [speed, setSpeed] = useState<number>(script?.settings?.speed || 28);
  const [fontSize, setFontSize] = useState<number>(script?.settings?.fontSize || 42);
  const [fontFamily, setFontFamily] = useState<FontFamilyType>(script?.settings?.fontFamily || 'lexend');

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state when script prop changes
  React.useEffect(() => {
    if (script) {
      setTitle(script.title);
      setContent(script.content);
      setTagInput(script.tags?.join(', ') || '');
      setSpeed(script.settings?.speed || 28);
      setFontSize(script.settings?.fontSize || 42);
      setFontFamily(script.settings?.fontFamily || 'lexend');
    } else {
      setTitle('Kịch bản mới ' + new Date().toLocaleDateString('vi-VN'));
      setContent('');
      setTagInput('Mới, Vlog');
      setSpeed(28);
      setFontSize(42);
      setFontFamily('lexend');
    }
  }, [script, isOpen]);

  if (!isOpen) return null;

  const stats = calculateStats(content, speed);

  // Insert formatting cue helper
  const insertCue = (snippet: string) => {
    setContent((prev) => prev + (prev.endsWith('\n') || !prev ? '' : '\n\n') + snippet);
  };

  // AI Script Optimizer Actions
  const handleAIOptimize = async (actionType: 'add_cues' | 'bullet_cues' | 'fix_grammar') => {
    if (!content.trim()) return;
    setAiLoading(true);
    setAiSuccessMsg(null);

    try {
      const optimized = await optimizeScriptWithAI(content, actionType);
      setContent(optimized);
      setAiSuccessMsg(
        actionType === 'add_cues'
          ? 'Đã chèn nhịp thở & phân cảnh thông minh!'
          : actionType === 'bullet_cues'
          ? 'Đã rút gọn thành Cue Cards!'
          : 'Đã hoàn thiện văn phong giọng đọc!'
      );
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tối ưu bằng AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveOnly = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng điền tiêu đề và nội dung kịch bản');
      return;
    }
    setIsSaving(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        id: script?.id,
        title: title.trim(),
        content: content.trim(),
        tags,
        settings: {
          ...script?.settings,
          speed,
          fontSize,
          fontFamily,
        },
      });
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPlay = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng điền tiêu đề và nội dung kịch bản');
      return;
    }
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedScript: ScriptItem = {
      id: script?.id || 'temp_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      tags,
      updatedAt: Date.now(),
      createdAt: script?.createdAt || Date.now(),
      settings: {
        ...script?.settings,
        speed,
        fontSize,
        fontFamily,
      },
    };

    await onSave(updatedScript);
    onStartPrompter(updatedScript);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-[#e0e0e0]">
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">
                {script ? 'Chỉnh Sửa Kịch Bản' : 'Tạo Kịch Bản Mới'}
              </h3>
              <p className="text-xs text-[#888888]">Chỉnh sửa nội dung, phân đoạn và chỉ dẫn đọc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 overflow-y-auto py-3 flex-1 pr-1">
          {/* Title & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#888888] block">Tiêu đề kịch bản</label>
              <input
                id="input-editor-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bản tin công nghệ số 45..."
                className="w-full bg-[#111111] border border-[#222222] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#888888] block">Thẻ (cách nhau bằng dấu phẩy)</label>
              <input
                id="input-editor-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Vlog, Thuyết trình..."
                className="w-full bg-[#111111] border border-[#222222] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-[#888888]"
              />
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="p-3 bg-[#111111] border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500 shrink-0" />
              <span className="text-xs font-serif font-medium text-amber-300">Trợ Lý AI Tối Ưu Giọng Đọc:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleAIOptimize('add_cues')}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-amber-400 border border-amber-500/30 text-[11px] font-medium transition disabled:opacity-50 flex items-center gap-1"
              >
                <Wand2 size={11} />
                <span>Thêm Nhịp Thở & Cảnh</span>
              </button>
              <button
                type="button"
                onClick={() => handleAIOptimize('bullet_cues')}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition disabled:opacity-50 flex items-center gap-1"
              >
                <ListOrdered size={11} />
                <span>Rút Gọn Cue Cards</span>
              </button>
              <button
                type="button"
                onClick={() => handleAIOptimize('fix_grammar')}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles size={11} />
                <span>Trau Chuốt Câu Từ</span>
              </button>
            </div>
          </div>

          {aiSuccessMsg && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <Check size={14} />
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* Cue Inserts Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#888888] font-mono text-[10px] uppercase tracking-wider mr-1">Chèn nhanh:</span>
            <button
              type="button"
              onClick={() => insertCue('[CẢNH 1: MỞ ĐẦU]')}
              className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-amber-400 font-mono text-[10px] border border-[#333333]"
            >
              + [CẢNH]
            </button>
            <button
              type="button"
              onClick={() => insertCue('[nghỉ 1.5s]')}
              className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-orange-400 font-mono text-[10px] border border-[#333333]"
            >
              + [nghỉ 1.5s]
            </button>
            <button
              type="button"
              onClick={() => insertCue('【Người nói】')}
              className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-cyan-400 font-mono text-[10px] border border-[#333333]"
            >
              + 【Người nói】
            </button>
            <button
              type="button"
              onClick={() => insertCue('(Nhìn thẳng vào ống kính và mỉm cười)')}
              className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] italic text-[10px] border border-[#333333]"
            >
              + (Chỉ dẫn)
            </button>
          </div>

          {/* Main Content Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-medium">Nội dung kịch bản</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-amber-500">{stats.words} từ</span>
                <span>•</span>
                <span>{stats.chars} ký tự</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock size={11} /> ~{stats.estimatedTimeFormatted}
                </span>
              </div>
            </div>
            <textarea
              id="textarea-editor-content"
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung kịch bản tại đây..."
              className="w-full bg-[#111111] border border-[#222222] rounded-xl p-4 text-xs leading-relaxed focus:outline-none focus:border-amber-500 text-[#e0e0e0] resize-none transition-all"
              style={{ fontFamily: getFontFamilyStyle(fontFamily) }}
            />
          </div>

          {/* Per-script settings defaults */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#111111] p-3.5 rounded-xl border border-[#222222] text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>Phông chữ ưu tiên:</span>
              </div>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamilyType)}
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-[#e0e0e0]"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.tag})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>Cỡ chữ mặc định:</span>
                <span className="text-amber-500 font-mono font-bold">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg mt-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>Tốc độ cuộn:</span>
                <span className="text-amber-500 font-mono font-bold">~{stats.wpm} từ/phút</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg mt-2"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-xs font-medium text-[#888888] hover:text-white transition order-2 sm:order-1"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              id="btn-editor-save-only"
              type="button"
              onClick={handleSaveOnly}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-xs font-semibold text-[#e0e0e0] hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Kịch Bản'}</span>
            </button>

            <button
              id="btn-editor-save-and-play"
              type="button"
              onClick={handleSaveAndPlay}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-wide transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/30 active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              <span>Lưu & Mở Máy Nhắc Chữ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
