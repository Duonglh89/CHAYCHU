import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Smartphone,
  Laptop,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Type,
  Gauge,
  FlipHorizontal,
  Copy,
  Check,
  QrCode,
  Share2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { RoomState, FontFamilyType } from '../types';
import { sendRoomAction, getRoomState } from '../services/api';
import { FONT_OPTIONS } from '../constants/fonts';

interface RemoteControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  onSetRoomId: (id: string) => void;
  currentScriptTitle?: string;
}

export const RemoteControlModal: React.FC<RemoteControlModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onSetRoomId,
  currentScriptTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'controller'>('host');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate a random room code if none exists
  const generateNewRoomId = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    onSetRoomId(code);
  };

  useEffect(() => {
    if (isOpen && !roomId) {
      generateNewRoomId();
    }
  }, [isOpen, roomId]);

  // Connect to SSE stream for real-time room events
  useEffect(() => {
    const targetRoom = activeTab === 'controller' ? inputRoomId.trim().toUpperCase() : roomId;
    if (!isOpen || !targetRoom) return;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/rooms/${targetRoom}/events?role=${activeTab}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT' || data.type === 'ACTION') {
            if (data.state) {
              setRoomState(data.state);
              setIsConnected(true);
              setErrorMsg(null);
            }
          }
        } catch (e) {
          // ignore keepalive
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('SSE Error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, roomId, inputRoomId, activeTab]);

  if (!isOpen) return null;

  const currentRoomCode = activeTab === 'controller' ? inputRoomId.trim().toUpperCase() : roomId || '';

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=${currentRoomCode}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendAction = async (action: string, payload?: any) => {
    if (!currentRoomCode) return;
    try {
      await sendRoomAction(currentRoomCode, action, payload);
    } catch (err) {
      console.error('Failed to send action:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-[#e0e0e0]">
      <div className="bg-[#0d0d0d] border border-[#222222] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg text-white">Đồng Bộ & Điều Khiển Từ Xa</h3>
              <p className="text-xs text-[#888888]">Điều khiển máy nhắc chữ từ điện thoại không độ trễ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#111111] rounded-xl my-4 border border-[#222222] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('host')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'host' ? 'bg-amber-600 text-black font-bold shadow-md' : 'text-[#888888] hover:text-white'
            }`}
          >
            <Laptop size={15} />
            <span>Màn Hình Nhắc Chữ (Host)</span>
          </button>
          <button
            onClick={() => setActiveTab('controller')}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'controller' ? 'bg-amber-600 text-black font-bold shadow-md' : 'text-[#888888] hover:text-white'
            }`}
          >
            <Smartphone size={15} />
            <span>Remote Trên Điện Thoại</span>
          </button>
        </div>

        {/* Tab 1: Host Mode */}
        {activeTab === 'host' && (
          <div className="space-y-5 overflow-y-auto py-2">
            <div className="bg-[#111111] border border-[#222222] p-6 rounded-xl text-center space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-[#888888] font-mono font-bold">
                MÃ PHÒNG ĐỒNG BỘ CỦA BẠN
              </p>
              <div className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-amber-500 select-all">
                {roomId}
              </div>
              <p className="text-xs text-[#888888] max-w-xs mx-auto">
                Mở ứng dụng trên điện thoại, chọn <strong>"Remote Trên Điện Thoại"</strong> và nhập mã trên để điều khiển.
              </p>
            </div>

            {/* Quick Share Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#888888] block">Liên kết mở nhanh trên điện thoại</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-[#111111] border border-[#222222] rounded-xl px-3 py-2 text-xs text-[#e0e0e0] font-mono truncate select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 uppercase tracking-wide"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Features Info */}
            <div className="bg-[#111111] rounded-xl p-4 border border-[#222222] text-xs space-y-2 text-[#888888]">
              <div className="font-semibold text-amber-500 font-mono flex items-center gap-1.5">
                <Smartphone size={14} /> Tiện ích khi dùng Remote điện thoại:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[#888888]">
                <li>Bấm Chạy / Tạm dừng mà không cần với tay chạm vào máy tính.</li>
                <li>Tăng giảm tốc độ đọc theo nhịp thở thực tế.</li>
                <li>Tua nhanh/lùi từng đoạn kịch bản hoặc chỉnh cỡ chữ từ xa.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Remote Controller Mode */}
        {activeTab === 'controller' && (
          <div className="space-y-4 overflow-y-auto py-2">
            {!isConnected && (
              <div className="space-y-3 bg-[#111111] p-4 rounded-xl border border-[#222222]">
                <label className="text-xs font-semibold text-[#888888] block">Nhập mã phòng 6 chữ số:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: 842109"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#1a1a1a] border border-[#333333] rounded-xl px-4 py-2 text-lg font-mono font-bold tracking-wider text-center text-white focus:outline-none focus:border-amber-500"
                    maxLength={10}
                  />
                  <button
                    onClick={() => {
                      if (inputRoomId.trim()) {
                        setIsConnected(true);
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs uppercase tracking-wide transition"
                  >
                    Kết nối
                  </button>
                </div>
              </div>
            )}

            {/* Tactile Remote Control Pad */}
            <div className="bg-[#111111] p-4 rounded-2xl border border-[#222222] space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222222]">
                <span className="text-[#888888]">
                  Phòng: <strong className="text-amber-500 font-mono">{currentRoomCode || '---'}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-green-400 font-mono text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Đã kết nối
                </span>
              </div>

              {/* Big Main Play/Pause Button */}
              <button
                onClick={() => handleSendAction('TOGGLE_PLAY')}
                className={`w-full py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 shadow-xl transition active:scale-95 uppercase tracking-wide ${
                  roomState?.isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-black'
                    : 'bg-green-600 hover:bg-green-500 text-black animate-pulse'
                }`}
              >
                {roomState?.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                <span>{roomState?.isPlaying ? 'TẠM DỪNG' : 'CHẠY KỊCH BẢN'}</span>
              </button>

              {/* Rewind / Forward / Reset Row */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSendAction('SCROLL_JUMP', { scrollProgress: 0 })}
                  className="py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] active:scale-95 transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#888888] hover:text-white"
                >
                  <RotateCcw size={16} />
                  <span>Về Đầu</span>
                </button>
                <button
                  onClick={() => handleSendAction('STEP_SCROLL', { seconds: -8 })}
                  className="py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] active:scale-95 transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#888888] hover:text-white"
                >
                  <Rewind size={16} />
                  <span>Tua Lùi 8s</span>
                </button>
                <button
                  onClick={() => handleSendAction('STEP_SCROLL', { seconds: 8 })}
                  className="py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] active:scale-95 transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#888888] hover:text-white"
                >
                  <FastForward size={16} />
                  <span>Tua Nhanh 8s</span>
                </button>
              </div>

              {/* Speed & Font Adjustment Pads */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Speed Controls */}
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a] space-y-2">
                  <div className="text-xs font-semibold text-[#888888] flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono">
                      <Gauge size={13} /> Tốc độ
                    </span>
                    <span className="text-amber-500 font-mono font-bold">{roomState?.speed || 30}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleSendAction('SET_SPEED', { speed: Math.max(1, (roomState?.speed || 30) - 5) })}
                      className="py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] active:scale-95 font-mono text-xs text-[#e0e0e0]"
                    >
                      - Chậm
                    </button>
                    <button
                      onClick={() => handleSendAction('SET_SPEED', { speed: Math.min(100, (roomState?.speed || 30) + 5) })}
                      className="py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] active:scale-95 font-mono text-xs text-amber-500 font-bold"
                    >
                      + Nhanh
                    </button>
                  </div>
                </div>

                {/* Font Size Controls */}
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a] space-y-2">
                  <div className="text-xs font-semibold text-[#888888] flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono">
                      <Type size={13} /> Cỡ chữ
                    </span>
                    <span className="text-amber-500 font-mono font-bold">{roomState?.fontSize || 40}px</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() =>
                        handleSendAction('SET_FONT_SIZE', { fontSize: Math.max(18, (roomState?.fontSize || 40) - 4) })
                      }
                      className="py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] active:scale-95 font-mono text-xs text-[#e0e0e0]"
                    >
                      - Nhỏ
                    </button>
                    <button
                      onClick={() =>
                        handleSendAction('SET_FONT_SIZE', { fontSize: Math.min(120, (roomState?.fontSize || 40) + 4) })
                      }
                      className="py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] active:scale-95 font-mono text-xs text-amber-500 font-bold"
                    >
                      + To
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Family Quick Select for Remote Phone */}
              <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a] space-y-2">
                <div className="text-xs font-semibold text-[#888888] flex items-center justify-between">
                  <span className="flex items-center gap-1 font-mono">
                    <Type size={13} className="text-amber-500" /> Phông chữ máy nhắc
                  </span>
                  <span className="text-amber-500 font-mono text-[11px]">
                    {FONT_OPTIONS.find((f) => f.id === (roomState?.settings?.fontFamily || 'lexend'))?.name || 'Lexend'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_OPTIONS.slice(0, 6).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSendAction('SET_SETTINGS', { fontFamily: f.id })}
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-mono truncate transition active:scale-95 ${
                        (roomState?.settings?.fontFamily || 'lexend') === f.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                          : 'border-[#333333] bg-[#222222] text-[#888888] hover:text-white'
                      }`}
                    >
                      {f.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Mirror Toggle */}
              <button
                onClick={() => handleSendAction('TOGGLE_MIRROR')}
                className="w-full py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] active:scale-95 transition flex items-center justify-center gap-2 text-xs text-[#888888] hover:text-white"
              >
                <FlipHorizontal size={15} />
                <span>Bật / Tắt Phản Chiếu Gương (Mirror Mode)</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] font-semibold text-xs text-[#888888] hover:text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
