import { ScriptItem, PrompterSettings } from '../types';

const STORAGE_SCRIPTS_KEY = 'prompterflow_local_scripts_v1';
const STORAGE_SETTINGS_KEY = 'prompterflow_user_settings_v1';

export const DEFAULT_PROMPTER_SETTINGS: PrompterSettings = {
  fontSize: 42,
  speed: 28,
  lineHeight: 1.8,
  letterSpacing: 0,
  textMargin: 12,
  theme: 'oled',
  fontFamily: 'lexend',
  alignment: 'left',
  allCaps: false,
  isMirrored: false,
  isFlipped: false,
  focusGuide: true,
  focusPosition: 35,
  focusHeight: 70,
  focusDimBackground: true,
  countdownSeconds: 3,
  cameraOverlay: false,
  cameraOpacity: 40,
  cameraPosition: 'behind',
  bionicReading: false,
  showProgress: true,
  invertColors: false,
};

export const INITIAL_SAMPLE_SCRIPTS: ScriptItem[] = [
  {
    id: 'sample-welcome',
    title: 'Kịch bản mẫu: Giới thiệu ứng dụng PrompterFlow',
    content: `Chào mừng bạn đến với PrompterFlow - Ứng dụng máy nhắc chữ thông minh đa nền tảng!

[CẢNH 1: MỞ ĐẦU]
Xin chào quý vị khán giả và các bạn sáng tạo nội dung.
Hôm nay, tôi rất vui được giới thiệu một công cụ đắc lực giúp bạn quay video TikTok, YouTube, bài giảng và thuyết trình mượt mà hơn bao giờ hết.

[CẢNH 2: TÍNH NĂNG NỔI BẬT]
Với PrompterFlow, bạn có thể:
1. Cuộn văn bản tự động cực kỳ mượt mà với tốc độ tùy chỉnh linh hoạt từ 30 đến 400 từ/phút.
2. Tùy chỉnh cỡ chữ, độ giãn dòng và màu sắc tương phản cao (OLED, Vàng nổi bật, Xanh Studio) để đọc rõ ở mọi khoảng cách.
3. Chế độ phản chiếu gương (Mirror Mode) dành riêng cho kính nhắc chữ chuyên dụng.
4. Bật Camera trực tiếp ngay trên màn hình để vừa nhìn kịch bản vừa duy trì ánh mắt tự nhiên vào ống kính máy quay.

[CẢNH 3: ĐỒNG BỘ ĐÁM MÂY & ĐIỀU KHIỂN TỪ XA]
Đặc biệt, bạn có thể biến chiếc điện thoại của mình thành một Remote điều khiển từ xa.
Chỉ cần nhập mã phòng 6 chữ số, bạn có thể bấm Dừng, Phát, Tăng tốc hoặc Tua lại kịch bản đang chạy trên máy tính hoặc máy tính bảng của bạn mà không cần chạm vào màn hình chính.

[CẢNH 4: KẾT LUẬN]
Hãy thử tải lên kịch bản từ file .txt, Google Sheets hoặc dán trực tiếp văn bản vào ứng dụng ngay bây giờ.
Chúc các bạn có những buổi ghi hình thành công và tự tin nhất!`,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    tags: ['Mẫu', 'Vlog', 'Hướng dẫn'],
    settings: {
      fontSize: 44,
      speed: 28,
      lineHeight: 1.8,
      theme: 'oled',
    },
  },
  {
    id: 'sample-pitch',
    title: 'Kịch bản mẫu: Bài thuyết trình gọi vốn 2 phút',
    content: `[MỞ ĐẦU - GÂY ẤN TƯỢNG]
Xin chào hội đồng đầu tư và ban giám khảo!
Có bao giờ bạn tự hỏi: Tại sao 80% người sáng tạo nội dung mất hàng giờ chỉ để quay đi quay lại một đoạn video ngắn vì quên lời?

[VẤN ĐỀ]
Khi đứng trước ống kính, áp lực tâm lý và sự phân tâm khiến chúng ta dễ vấp váp, mất tự nhiên và tốn kém rất nhiều thời gian dựng hậu kỳ.

[GIẢI PHÁP - SẢN PHẨM]
Đó là lý do chúng tôi phát triển giải pháp máy nhắc chữ thế hệ mới:
- Tự động cuộn theo nhịp đọc
- Đồng bộ kịch bản từ Google Sheets trong 1 nốt nhạc
- Điều khiển từ xa bằng điện thoại cá nhân không độ trễ

[KÊU GỌI HÀNH ĐỘNG]
Chúng tôi mong muốn đồng hành cùng các bạn để tạo ra những video chất lượng nhất. Cảm ơn sự lắng nghe của quý vị!`,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 1800000,
    tags: ['Thuyết trình', 'Pitching', 'Doanh nghiệp'],
    settings: {
      fontSize: 40,
      speed: 32,
      theme: 'high-contrast-yellow',
    },
  },
];

export function getLocalScripts(): ScriptItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_SCRIPTS_KEY);
    if (!raw) {
      saveLocalScripts(INITIAL_SAMPLE_SCRIPTS);
      return INITIAL_SAMPLE_SCRIPTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_SCRIPTS;
  } catch {
    return INITIAL_SAMPLE_SCRIPTS;
  }
}

export function saveLocalScripts(scripts: ScriptItem[]): void {
  try {
    localStorage.setItem(STORAGE_SCRIPTS_KEY, JSON.stringify(scripts));
  } catch (err) {
    console.error('Failed to save scripts to localStorage:', err);
  }
}

export function getLocalSettings(): PrompterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_PROMPTER_SETTINGS;
    return { ...DEFAULT_PROMPTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROMPTER_SETTINGS;
  }
}

export function saveLocalSettings(settings: Partial<PrompterSettings>): PrompterSettings {
  const current = getLocalSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
  return updated;
}
