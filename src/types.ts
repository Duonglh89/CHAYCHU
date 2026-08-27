export type ThemeType = 'oled' | 'high-contrast-yellow' | 'studio-green' | 'navy-blue' | 'paper-light' | 'sunset-amber';

export type FontFamilyType = 'lexend' | 'be-vietnam' | 'sans' | 'roboto' | 'lora' | 'mono' | 'merriweather';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface PrompterSettings {
  fontSize: number; // in px: 20 to 120
  speed: number; // 1 to 100 (represents scroll velocity / ~30 to 450 WPM)
  lineHeight: number; // 1.2 to 2.6
  letterSpacing: number; // -1 to 5px
  textMargin: number; // 5 to 40% (margins for eye contact focus near camera lens)
  theme: ThemeType;
  fontFamily: FontFamilyType;
  alignment: TextAlignment;
  allCaps: boolean;
  isMirrored: boolean; // Horizontal flip for glass teleprompters
  isFlipped: boolean; // Vertical flip
  focusGuide: boolean; // Reading bar guide overlay
  focusPosition: number; // 10 to 90% vertical position
  focusHeight: number; // 40 to 180px
  focusDimBackground: boolean; // Dim text outside focus bar
  countdownSeconds: number; // 0, 3, 5
  cameraOverlay: boolean; // Webcam overlay
  cameraOpacity: number; // 10 to 90%
  cameraPosition: 'behind' | 'side' | 'pip';
  bionicReading: boolean; // Emphasize first letters for quick scanning
  showProgress: boolean; // Progress bar and timer
  invertColors: boolean;
}

export interface ScriptItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  createdAt: number;
  tags?: string[];
  settings?: Partial<PrompterSettings>;
}

export interface RoomState {
  roomId: string;
  scriptId?: string;
  scriptTitle: string;
  scriptContent: string;
  isPlaying: boolean;
  scrollProgress: number; // 0 to 1
  scrollPosPx: number;
  speed: number;
  fontSize: number;
  lineHeight: number;
  theme: string;
  isMirrored: boolean;
  isFlipped: boolean;
  focusGuide: boolean;
  focusPosition: number;
  fontFamily: string;
  alignment: TextAlignment;
  allCaps: boolean;
  lastUpdated: number;
}

export interface ImportSheetsResult {
  title: string;
  content: string;
  headers: string[];
  rowCount: number;
}

export type ViewMode = 'library' | 'editor' | 'prompter' | 'remote-controller';
