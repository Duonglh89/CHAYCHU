export function calculateStats(text: string, speedSetting: number) {
  const clean = text.trim();
  if (!clean) return { words: 0, chars: 0, estimatedTimeSeconds: 0, estimatedTimeFormatted: '00:00', wpm: 120 };

  const words = clean.split(/\s+/).filter(Boolean).length;
  const chars = clean.length;

  // Map speed slider (1 to 100) to actual Words Per Minute (approx 60 WPM to 380 WPM)
  // Standard conversational speech is ~130-160 WPM
  const wpm = Math.round(50 + (speedSetting / 100) * 320);

  const totalMinutes = words / Math.max(wpm, 30);
  const totalSeconds = Math.round(totalMinutes * 60);

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const estimatedTimeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return {
    words,
    chars,
    estimatedTimeSeconds: totalSeconds,
    estimatedTimeFormatted,
    wpm,
  };
}

export function formatTimeSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface ParsedLine {
  id: string;
  type: 'heading' | 'cue' | 'speaker' | 'dialogue' | 'pause' | 'blank';
  rawText: string;
  text: string;
  speakerName?: string;
  pauseDuration?: string;
}

export function parseScriptContent(content: string): ParsedLine[] {
  const rawLines = content.split('\n');
  return rawLines.map((line, idx) => {
    const trimmed = line.trim();
    const id = `line-${idx}`;

    if (!trimmed) {
      return { id, type: 'blank', rawText: line, text: '' };
    }

    // Check for Scene / Heading cue: [CẢNH 1], [MỞ ĐẦU], [INTRO], [SCENE 1], etc.
    const headingMatch = trimmed.match(/^\[(.*?)\]$/);
    if (headingMatch) {
      const inner = headingMatch[1].trim();
      // Check if it is a pause indicator like [nghỉ 2s] or [pause 1s]
      const pauseMatch = inner.match(/(?:nghỉ|pause|dừng)\s*(\d+(?:\.\d+)?\s*s?)/i);
      if (pauseMatch) {
        return { id, type: 'pause', rawText: line, text: `⏸️ ${inner.toUpperCase()}`, pauseDuration: pauseMatch[1] };
      }
      return { id, type: 'heading', rawText: line, text: inner };
    }

    // Check for Speaker marker: 【Nguyễn Văn A】 or 【Speaker】 or MC: or Tên:
    const speakerMatch1 = trimmed.match(/^【(.*?)】(.*)$/);
    if (speakerMatch1) {
      return {
        id,
        type: 'speaker',
        rawText: line,
        speakerName: speakerMatch1[1].trim(),
        text: speakerMatch1[2].trim(),
      };
    }

    const speakerMatch2 = trimmed.match(/^([A-Za-zÀ-ỹ\s0-9]{2,20}):\s*(.*)$/);
    if (speakerMatch2 && speakerMatch2[1].length < 25 && !speakerMatch2[1].includes('.')) {
      return {
        id,
        type: 'speaker',
        rawText: line,
        speakerName: speakerMatch2[1].trim(),
        text: speakerMatch2[2].trim(),
      };
    }

    // Check for cue in parenthesis or brackets inline: (Cười), (Nhìn thẳng vào ống kính)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return { id, type: 'cue', rawText: line, text: trimmed };
    }

    return { id, type: 'dialogue', rawText: line, text: trimmed };
  });
}
