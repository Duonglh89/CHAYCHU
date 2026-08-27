import { FontFamilyType } from '../types';

export interface FontOption {
  id: FontFamilyType;
  name: string;
  shortName: string;
  tag: string;
  tagColor?: string;
  fontFamily: string;
  description: string;
  sampleText: string;
  features: string[];
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'lexend',
    name: 'Lexend',
    shortName: 'Lexend',
    tag: 'Khuyên dùng ⭐',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    fontFamily: "'Lexend', sans-serif",
    description: 'Được nghiên cứu khoa học chuyên sâu để giảm mỏi mắt, chống nhảy dòng và tối đa hóa tốc độ đọc của mắt.',
    sampleText: 'Chào mừng quý vị khán giả đang theo dõi bản tin hôm nay',
    features: ['Khoảng cách chữ mở rộng', 'Chống mỏi mắt khi đọc lâu', 'Độ tương phản quang học cao'],
  },
  {
    id: 'be-vietnam',
    name: 'Be Vietnam Pro',
    shortName: 'Be Vietnam',
    tag: 'Chuẩn tiếng Việt',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    description: 'Thiết kế riêng cho hệ thống chữ Quốc Ngữ, vị trí dấu thanh cân đối, không bị chồng lấn hay khó đọc từ xa.',
    sampleText: 'Đọc trôi chảy từng câu từ rõ ràng, không lo vấp chữ',
    features: ['Dấu tiếng Việt rõ ràng', 'Không bị dính dấu', 'Nét chữ dày dặn, sắc nét'],
  },
  {
    id: 'sans',
    name: 'Plus Jakarta Sans',
    shortName: 'Jakarta Sans',
    tag: 'Hiện đại & Tròn trịa',
    tagColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    description: 'Font không chân hiện đại, đường nét tròn trịa, tương phản tuyệt đối trên phông nền tối studio.',
    sampleText: 'Ứng dụng máy nhắc chữ thông minh cho người sáng tạo',
    features: ['Đường nét thanh thoát', 'Dễ nhìn ở mọi cỡ chữ', 'Hình khối hiện đại'],
  },
  {
    id: 'roboto',
    name: 'Roboto Studio',
    shortName: 'Roboto',
    tag: 'Rõ từ khoảng cách xa',
    tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    fontFamily: "'Roboto', sans-serif",
    description: 'Kiểu chữ tiêu chuẩn đài truyền hình, đường nét thẳng đều, dễ nhận diện mặt chữ ngay cả khi đứng xa máy quay.',
    sampleText: 'Bản tin phát thanh thời sự và kịch bản thuyết trình',
    features: ['Dễ nhận diện từ xa', 'Tỷ lệ chữ chuẩn', 'Độ bám mắt ổn định'],
  },
  {
    id: 'lora',
    name: 'Lora Serif',
    shortName: 'Lora Serif',
    tag: 'MC & Thời sự',
    tagColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    fontFamily: "'Lora', serif",
    description: 'Phông chữ có chân sang trọng, tạo nhịp điệu đọc trang trọng cho phát thanh viên, MC truyền hình và phóng sự.',
    sampleText: 'Kính thưa quý vị đại biểu và toàn thể hội nghị',
    features: ['Chân chữ trang nhã', 'Phong cách truyền hình', 'Khoảng cách chữ thoáng'],
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    shortName: 'Monospace',
    tag: 'Giữ nhịp đều',
    tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    fontFamily: "'JetBrains Mono', monospace",
    description: 'Đơn cách – mỗi ký tự có bề rộng bằng nhau, giúp người thuyết trình giữ đều nhịp thở và căn thời gian chuẩn từng giây.',
    sampleText: '1.2.3 BẮT ĐẦU: Giữ nhịp thở đều đặn theo từng dòng',
    features: ['Ký tự đều nhau 100%', 'Dễ đếm và ngắt nhịp', 'Chống nhầm lẫn số và chữ'],
  },
];

export function getFontFamilyStyle(fontId: FontFamilyType): string {
  switch (fontId) {
    case 'lexend':
      return "'Lexend', sans-serif";
    case 'be-vietnam':
      return "'Be Vietnam Pro', sans-serif";
    case 'roboto':
      return "'Roboto', sans-serif";
    case 'lora':
    case 'merriweather':
      return "'Lora', serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'sans':
    default:
      return "'Plus Jakarta Sans', sans-serif";
  }
}
