import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Table,
  Clipboard,
  UploadCloud,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { importGoogleSheets } from '../services/api';
import { calculateStats } from '../utils/textUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (title: string, content: string, tags?: string[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'file' | 'text'>('sheets');

  // Google Sheets states
  const [sheetsUrl, setSheetsUrl] = useState<string>('');
  const [sheetsFormat, setSheetsFormat] = useState<string>('dialogue_scenes');
  const [sheetsLoading, setSheetsLoading] = useState<boolean>(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [tsvRawText, setTsvRawText] = useState<string>('');

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste text states
  const [pasteTitle, setPasteTitle] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');

  if (!isOpen) return null;

  // Handle Google Sheets fetch
  const handleFetchSheets = async () => {
    if (!sheetsUrl.trim() && !tsvRawText.trim()) {
      setSheetsError('Vui lòng nhập đường link Google Sheets hoặc dán nội dung bảng tính.');
      return;
    }

    setSheetsLoading(true);
    setSheetsError(null);

    try {
      const res = await importGoogleSheets({
        url: sheetsUrl.trim() || undefined,
        rawCsv: tsvRawText.trim() || undefined,
        formatOption: sheetsFormat,
        title: sheetsUrl ? 'Kịch bản từ Google Sheets' : 'Kịch bản bảng tính đã dán',
      });

      onImportComplete(res.title || 'Kịch bản Google Sheets', res.content, ['Google Sheets']);
      onClose();
    } catch (err: any) {
      setSheetsError(err.message || 'Lỗi khi nhập kịch bản từ Google Sheets');
    } finally {
      setSheetsLoading(false);
    }
  };

  // Handle Text File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const title = file.name.replace(/\.[^/.]+$/, ''); // Strip extension
      setUploadedFile({ name: title, content });
    };
    reader.readAsText(file);
  };

  // Complete file import
  const handleConfirmFileImport = () => {
    if (!uploadedFile) return;
    onImportComplete(uploadedFile.name, uploadedFile.content, ['File Tải Lên']);
    onClose();
  };

  // Complete paste text import
  const handleConfirmPasteImport = () => {
    if (!pasteContent.trim()) return;
    const title = pasteTitle.trim() || 'Kịch bản mới ' + new Date().toLocaleDateString('vi-VN');
    onImportComplete(title, pasteContent.trim(), ['Soạn thảo']);
    onClose();
  };

  // Text cleanup tools
  const handleFormatText = (type: 'clean_spaces' | 'capitalize' | 'auto_scenes') => {
    let text = pasteContent;
    if (type === 'clean_spaces') {
      text = text
        .split('\n')
        .map((line) => line.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .join('\n\n');
    } else if (type === 'capitalize') {
      text = text.toUpperCase();
    } else if (type === 'auto_scenes') {
      const paragraphs = text.split(/\n{2,}/).filter(Boolean);
      text = paragraphs
        .map((para, i) => `[CẢNH ${i + 1}]\n${para.trim()}`)
        .join('\n\n');
    }
    setPasteContent(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-[#e0e0e0]">
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">Nhập Kịch Bản Mới</h3>
              <p className="text-xs text-[#888888]">Google Sheets, File văn bản hoặc Dán nội dung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#111111] rounded-xl my-4 border border-[#222222] text-xs font-semibold">
          <button
            id="tab-import-sheets"
            onClick={() => setActiveTab('sheets')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'sheets' ? 'bg-amber-600 text-black font-bold shadow-md' : 'text-[#888888] hover:text-white'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Google Sheets</span>
          </button>

          <button
            id="tab-import-file"
            onClick={() => setActiveTab('file')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'file' ? 'bg-amber-600 text-black font-bold shadow-md' : 'text-[#888888] hover:text-white'
            }`}
          >
            <FileText size={15} />
            <span>File Văn Bản</span>
          </button>

          <button
            id="tab-import-text"
            onClick={() => setActiveTab('text')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'text' ? 'bg-amber-600 text-black font-bold shadow-md' : 'text-[#888888] hover:text-white'
            }`}
          >
            <Clipboard size={15} />
            <span>Dán / Sao Chép</span>
          </button>
        </div>

        {/* Tab 1: Google Sheets Import */}
        {activeTab === 'sheets' && (
          <div className="space-y-4 overflow-y-auto py-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#888888] flex items-center justify-between">
                <span>Đường link Google Sheets (Chia sẻ "Bất kỳ ai có liên kết"):</span>
                <button
                  type="button"
                  onClick={() =>
                    setSheetsUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit')
                  }
                  className="text-amber-500 hover:underline font-normal text-[11px]"
                >
                  Dùng link mẫu thử nghiệm
                </button>
              </label>
              <input
                id="input-sheets-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-[#e0e0e0]"
              />
            </div>

            {/* Format Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#888888] block">Quy cách định dạng dữ liệu:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  onClick={() => setSheetsFormat('dialogue_scenes')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition ${
                    sheetsFormat === 'dialogue_scenes'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-[#222222] bg-[#111111] text-[#888888] hover:border-[#333333]'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={sheetsFormat === 'dialogue_scenes'}
                    onChange={() => setSheetsFormat('dialogue_scenes')}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <strong className="block text-white font-medium">Tự nhận Cảnh & Nhân vật</strong>
                    <span className="text-[11px] opacity-75">Tự động nhận diện cột: Cảnh, Người nói, Lời thoại</span>
                  </div>
                </label>

                <label
                  onClick={() => setSheetsFormat('all_text')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition ${
                    sheetsFormat === 'all_text'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-[#222222] bg-[#111111] text-[#888888] hover:border-[#333333]'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={sheetsFormat === 'all_text'}
                    onChange={() => setSheetsFormat('all_text')}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <strong className="block text-white font-medium">Ghép tất cả các cột</strong>
                    <span className="text-[11px] opacity-75">Ghép các ô trong từng hàng thành đoạn văn liền mạch</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Direct TSV/CSV Paste Alternative */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[#888888] block">
                Hoặc copy các ô từ Google Sheets/Excel rồi dán vào đây:
              </label>
              <textarea
                placeholder="Dán các cột được copy từ Excel hoặc Google Sheets..."
                value={tsvRawText}
                onChange={(e) => setTsvRawText(e.target.value)}
                rows={3}
                className="w-full bg-[#111111] border border-[#222222] rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 font-mono text-[#e0e0e0]"
              />
            </div>

            {sheetsError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{sheetsError}</span>
              </div>
            )}

            <button
              id="btn-import-sheets-confirm"
              onClick={handleFetchSheets}
              disabled={sheetsLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wide active:scale-95"
            >
              {sheetsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải và xử lý bảng tính...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Nhập Kịch Bản Từ Google Sheets</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4 overflow-y-auto py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.md,.csv,.rtf,.json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#333333] hover:border-amber-500/60 bg-[#111111] rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] group-hover:bg-amber-500/20 group-hover:text-amber-400 flex items-center justify-center text-[#888888] transition">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="font-medium text-xs text-white">Nhấn để chọn file hoặc kéo thả vào đây</p>
                  <p className="text-[11px] text-[#888888] mt-1 font-mono">Hỗ trợ các định dạng: .txt, .md, .docx, .csv, .json, .rtf</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#111111] p-4 rounded-xl border border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-amber-500" size={20} />
                    <div>
                      <h4 className="font-medium text-xs text-white">{uploadedFile.name}</h4>
                      <p className="text-[11px] text-[#888888] font-mono">
                        {calculateStats(uploadedFile.content, 30).words} từ • {uploadedFile.content.length} ký tự
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-2.5 py-1 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white text-xs"
                  >
                    Đổi file
                  </button>
                </div>

                <div className="bg-[#111111] p-3 rounded-xl border border-[#222222] max-h-48 overflow-y-auto font-sans text-xs text-[#888888] whitespace-pre-wrap">
                  {uploadedFile.content.slice(0, 1000)}
                  {uploadedFile.content.length > 1000 && '...'}
                </div>

                <button
                  id="btn-confirm-file-import"
                  onClick={handleConfirmFileImport}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wide active:scale-95"
                >
                  <Check size={16} />
                  <span>Xác Nhận Nhập File Kịch Bản</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Paste / Direct Text */}
        {activeTab === 'text' && (
          <div className="space-y-4 overflow-y-auto py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#888888] block">Tiêu đề kịch bản:</label>
              <input
                id="input-paste-title"
                type="text"
                placeholder="VD: Video giới thiệu sản phẩm..."
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-[#e0e0e0]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#888888]">Nội dung kịch bản:</label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleFormatText('clean_spaces')}
                    className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white"
                  >
                    Gọn dòng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('auto_scenes')}
                    className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white"
                  >
                    Thêm [CẢNH]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('capitalize')}
                    className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white"
                  >
                    IN HOA
                  </button>
                </div>
              </div>
              <textarea
                id="textarea-paste-content"
                rows={6}
                placeholder="Dán hoặc gõ nội dung kịch bản của bạn vào đây..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full bg-[#111111] border border-[#222222] rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 leading-relaxed font-sans text-[#e0e0e0]"
              />
            </div>

            <button
              id="btn-confirm-paste-import"
              onClick={handleConfirmPasteImport}
              disabled={!pasteContent.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 uppercase tracking-wide active:scale-95"
            >
              <Check size={16} />
              <span>Tạo Kịch Bản Ngay</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] font-semibold text-xs text-[#888888] hover:text-white transition"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};
