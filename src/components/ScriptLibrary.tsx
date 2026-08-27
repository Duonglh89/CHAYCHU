import React, { useState } from 'react';
import {
  FileText,
  Play,
  Edit3,
  Trash2,
  Copy,
  Download,
  Plus,
  Search,
  Tag,
  Radio,
  Clock,
  Settings,
  Cloud,
  FileSpreadsheet,
  Upload,
  Smartphone,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ScriptItem, PrompterSettings } from '../types';
import { calculateStats } from '../utils/textUtils';
import { FONT_OPTIONS, getFontFamilyStyle } from '../constants/fonts';

interface ScriptLibraryProps {
  scripts: ScriptItem[];
  settings: PrompterSettings;
  onOpenPrompter: (script: ScriptItem) => void;
  onOpenEditor: (script: ScriptItem | null) => void;
  onOpenImport: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onDeleteScript: (id: string) => Promise<void>;
  onDuplicateScript: (script: ScriptItem) => Promise<void>;
}

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  scripts,
  settings,
  onOpenPrompter,
  onOpenEditor,
  onOpenImport,
  onOpenSync,
  onOpenSettings,
  onDeleteScript,
  onDuplicateScript,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Collect unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    scripts.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [scripts]);

  // Filtered scripts
  const filteredScripts = React.useMemo(() => {
    return scripts.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTag = selectedTag === 'all' || s.tags?.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [scripts, searchTerm, selectedTag]);

  // Export single script to text file
  const handleExportText = (script: ScriptItem) => {
    const blob = new Blob([script.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.title.replace(/[^a-zA-Z0-9À-ỹ]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#111111] backdrop-blur-xl border-b border-[#222222] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black font-bold font-serif text-sm shadow-md shadow-amber-500/20">
              SF
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold tracking-tight text-white font-serif italic">PrompterFlow</span>
              <div className="hidden sm:flex items-center space-x-2 px-2.5 py-0.5 bg-[#1a1a1a] rounded-full border border-[#333333]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-widest text-[#888888] font-mono font-bold">Cloud Synced</span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phone Remote / Sync Room Trigger */}
            <button
              id="btn-nav-sync-room"
              onClick={onOpenSync}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-xs font-semibold flex items-center gap-2 text-[#e0e0e0] transition active:scale-95 shadow-sm"
              title="Đồng bộ điều khiển bằng điện thoại"
            >
              <Smartphone size={15} className="text-amber-500" />
              <span className="hidden sm:inline">Remote Phone</span>
            </button>

            {/* Import Script Trigger */}
            <button
              id="btn-nav-import-script"
              onClick={onOpenImport}
              className="px-3.5 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-xs font-semibold flex items-center gap-2 text-[#e0e0e0] transition active:scale-95 shadow-sm"
              title="Nhập kịch bản từ Google Sheets / File"
            >
              <FileSpreadsheet size={15} className="text-green-500" />
              <span className="hidden md:inline">Import Script</span>
            </button>

            {/* Create New Script */}
            <button
              id="btn-nav-create-script"
              onClick={() => onOpenEditor(null)}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-900/20 tracking-wide uppercase"
            >
              <Plus size={15} />
              <span>Tạo Kịch Bản</span>
            </button>

            {/* Settings */}
            <button
              id="btn-nav-settings"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
              title="Cài đặt máy nhắc chữ"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner with Quick Summary & Google Sheets / Remote Feature Highlights */}
        <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333333] text-amber-500 text-[11px] uppercase tracking-wider font-semibold font-mono">
              <Sparkles size={13} /> Sẵn sàng cho điện thoại & máy tính
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white leading-tight">
              Đọc kịch bản mượt mà, tự tin trước máy quay
            </h2>
            <p className="text-xs sm:text-sm text-[#888888] leading-relaxed font-sans">
              Tự động cuộn theo tốc độ đọc tùy chỉnh, phóng to cỡ chữ linh hoạt, phản chiếu gương (Mirror) cho kính nhắc chữ và
              đồng bộ điều khiển từ xa bằng điện thoại.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 relative z-10 pt-1">
            <button
              onClick={onOpenImport}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#e0e0e0] text-xs font-semibold flex items-center gap-2 transition"
            >
              <FileSpreadsheet size={15} className="text-green-500" />
              <span>Google Sheets & File Upload</span>
            </button>
            <button
              onClick={onOpenSync}
              className="px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Radio size={15} className="animate-pulse" />
              <span>Đồng Bộ Thiết Bị Bằng PIN</span>
            </button>
          </div>
        </div>

        {/* Search & Tags Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              id="input-search-scripts"
              type="text"
              placeholder="Tìm kiếm kịch bản theo tên hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e0e0e0] placeholder-[#555555] focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Tags Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-amber-600 text-black shadow-md font-bold'
                  : 'bg-[#111111] hover:bg-[#1a1a1a] text-[#888888] border border-[#222222]'
              }`}
            >
              Tất cả ({scripts.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedTag === tag
                    ? 'bg-amber-600 text-black shadow-md font-bold'
                    : 'bg-[#111111] hover:bg-[#1a1a1a] text-[#888888] border border-[#222222]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scripts Cards Grid */}
        {filteredScripts.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#666666] mx-auto">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-base text-white">Không tìm thấy kịch bản phù hợp</h3>
              <p className="text-xs text-[#888888] mt-1">
                Hãy tạo kịch bản mới hoặc nhập từ Google Sheets / file văn bản để bắt đầu.
              </p>
            </div>
            <button
              onClick={() => onOpenEditor(null)}
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs inline-flex items-center gap-2 uppercase tracking-wide"
            >
              <Plus size={16} /> Tạo kịch bản ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScripts.map((script) => {
              const currentSpeed = script.settings?.speed || settings.speed;
              const stats = calculateStats(script.content, currentSpeed);

              return (
                <div
                  key={script.id}
                  id={`script-card-${script.id}`}
                  className="bg-[#0d0d0d] hover:bg-[#111111] border border-[#222222] hover:border-[#333333] rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/80 border-l-2 border-l-amber-500 group"
                >
                  {/* Top: Title & Tags */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-medium text-base text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition">
                        {script.title}
                      </h3>
                    </div>

                    {/* Tags */}
                    {script.tags && script.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {script.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#888888] text-[10px] font-mono border border-[#2e2e2e]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Content Preview */}
                    <p
                      className="text-xs text-[#888888] line-clamp-3 leading-relaxed"
                      style={{
                        fontFamily: getFontFamilyStyle(script.settings?.fontFamily || settings.fontFamily),
                      }}
                    >
                      {script.content.replace(/\[.*?\]/g, '').replace(/【.*?】/g, '').trim()}
                    </p>
                  </div>

                  {/* Middle: Metadata stats (words, time, font) */}
                  <div className="my-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs text-[#888888]">
                    <div className="flex items-center gap-1.5 font-mono">
                      <FileText size={14} className="text-amber-500" />
                      <span>{stats.words} từ</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                      <span className="text-amber-500/80">Aa</span>
                      <span>
                        {FONT_OPTIONS.find(
                          (f) => f.id === (script.settings?.fontFamily || settings.fontFamily)
                        )?.shortName || 'Lexend'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-500 font-mono font-medium">
                      <Clock size={14} />
                      <span>~{stats.estimatedTimeFormatted}</span>
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="space-y-2">
                    {/* Giant Prompter Launch Button */}
                    <button
                      id={`btn-play-prompter-${script.id}`}
                      onClick={() => onOpenPrompter(script)}
                      className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-98 uppercase tracking-wide"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>MỞ MÁY NHẮC CHỮ</span>
                    </button>

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        id={`btn-edit-${script.id}`}
                        onClick={() => onOpenEditor(script)}
                        className="py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] text-[#888888] hover:text-[#e0e0e0] text-xs flex items-center justify-center gap-1 transition"
                        title="Chỉnh sửa nội dung"
                      >
                        <Edit3 size={13} />
                        <span className="text-[11px]">Sửa</span>
                      </button>

                      <button
                        onClick={() => onDuplicateScript(script)}
                        className="py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] text-[#888888] hover:text-[#e0e0e0] text-xs flex items-center justify-center gap-1 transition"
                        title="Nhân bản kịch bản"
                      >
                        <Copy size={13} />
                        <span className="text-[11px]">Bản sao</span>
                      </button>

                      <button
                        onClick={() => handleExportText(script)}
                        className="py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] text-[#888888] hover:text-[#e0e0e0] text-xs flex items-center justify-center gap-1 transition"
                        title="Tải file .txt về máy"
                      >
                        <Download size={13} />
                        <span className="text-[11px]">Tải</span>
                      </button>

                      <button
                        id={`btn-delete-${script.id}`}
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa kịch bản "${script.title}" không?`)) {
                            onDeleteScript(script.id);
                          }
                        }}
                        className="py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-red-950/60 border border-[#2a2a2a] hover:border-red-800 text-[#888888] hover:text-red-400 text-xs flex items-center justify-center gap-1 transition"
                        title="Xóa kịch bản"
                      >
                        <Trash2 size={13} />
                        <span className="text-[11px]">Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
