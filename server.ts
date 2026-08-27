import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScriptItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  createdAt: number;
  tags?: string[];
  settings?: {
    fontSize?: number;
    speed?: number;
    lineHeight?: number;
    theme?: string;
    isMirrored?: boolean;
    isFlipped?: boolean;
    focusGuide?: boolean;
    focusPosition?: number;
    fontFamily?: string;
    alignment?: "left" | "center" | "right" | "justify";
    allCaps?: boolean;
    cameraOverlay?: boolean;
  };
}

interface RoomClient {
  id: string;
  role: "prompter" | "controller";
  res: express.Response;
}

interface RoomState {
  roomId: string;
  scriptId?: string;
  scriptTitle: string;
  scriptContent: string;
  isPlaying: boolean;
  scrollProgress: number; // 0 to 1
  scrollPosPx: number;
  speed: number; // 1 to 100 or WPM
  fontSize: number;
  lineHeight: number;
  theme: string;
  isMirrored: boolean;
  isFlipped: boolean;
  focusGuide: boolean;
  focusPosition: number;
  fontFamily: string;
  alignment: "left" | "center" | "right" | "justify";
  allCaps: boolean;
  lastUpdated: number;
}

// In-memory databases
const scriptsDb = new Map<string, ScriptItem>();
const roomsState = new Map<string, RoomState>();
const roomClients = new Map<string, Set<RoomClient>>();

// Seed initial sample scripts
const sampleScriptId = "sample-1";
scriptsDb.set(sampleScriptId, {
  id: sampleScriptId,
  title: "Kịch bản mẫu: Giới thiệu ứng dụng PrompterFlow",
  content: `Chào mừng bạn đến với PrompterFlow - Ứng dụng máy nhắc chữ thông minh đa nền tảng!

[CẢNH 1: MỞ ĐẦU]
Xin chào quý vị khán giả và các bạn sáng tạo nội dung.
Hôm nay, tôi rất vui được giới thiệu một công cụ đắc lực giúp bạn quay video, dẫn chương trình và thuyết trình mượt mà hơn bao giờ hết.

[CẢNH 2: TÍNH NĂNG NỔI BẬT]
Với PrompterFlow, bạn có thể:
1. Cuộn văn bản tự động cực kỳ mượt mà với tốc độ tùy chỉnh linh hoạt.
2. Thay đổi cỡ chữ, độ giãn dòng và màu sắc tương phản cao để đọc rõ ở mọi khoảng cách.
3. Chế độ phản chiếu gương (Mirror Mode) dành riêng cho kính nhắc chữ chuyên dụng.
4. Bật Camera trực tiếp ngay trên màn hình để vừa nhìn kịch bản vừa duy trì ánh mắt tự nhiên vào ống kính.

[CẢNH 3: ĐỒNG BỘ ĐÁM MÂY & ĐIỀU KHIỂN TỪ XA]
Đặc biệt, bạn có thể biến chiếc điện thoại của mình thành một Remote điều khiển từ xa.
Chỉ cần nhập mã phòng 6 chữ số, bạn có thể bấm Dừng, Phát, Tăng tốc hoặc Tua lại kịch bản đang chạy trên máy tính hoặc máy tính bảng của bạn mà không cần chạm vào màn hình chính.

[CẢNH 4: KẾT LUẬN]
Hãy thử tải lên kịch bản từ file .txt, Google Sheets hoặc dán trực tiếp văn bản vào ứng dụng ngay bây giờ.
Chúc các bạn có những buổi ghi hình thành công và tự tin nhất!`,
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now(),
  tags: ["Mẫu", "Vlog", "Hướng dẫn"],
  settings: {
    fontSize: 42,
    speed: 28,
    lineHeight: 1.8,
    theme: "oled",
    isMirrored: false,
    isFlipped: false,
    focusGuide: true,
    focusPosition: 35,
    fontFamily: "sans",
    alignment: "left",
    allCaps: false,
    cameraOverlay: false,
  }
});

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now(), totalScripts: scriptsDb.size });
  });

  // API: Scripts CRUD
  app.get("/api/scripts", (req, res) => {
    const list = Array.from(scriptsDb.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ success: true, scripts: list });
  });

  app.get("/api/scripts/:id", (req, res) => {
    const script = scriptsDb.get(req.params.id);
    if (!script) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kịch bản" });
    }
    res.json({ success: true, script });
  });

  app.post("/api/scripts", (req, res) => {
    const { title, content, settings, tags } = req.body;
    if (!title || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Tiêu đề và nội dung kịch bản là bắt buộc" });
    }

    const id = "script_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const newScript: ScriptItem = {
      id,
      title: title.trim(),
      content: content.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: Array.isArray(tags) ? tags : ["Mới"],
      settings: settings || {
        fontSize: 38,
        speed: 30,
        lineHeight: 1.7,
        theme: "oled",
        isMirrored: false,
        isFlipped: false,
        focusGuide: true,
        focusPosition: 35,
        fontFamily: "sans",
        alignment: "left",
        allCaps: false,
        cameraOverlay: false,
      }
    };

    scriptsDb.set(id, newScript);
    res.status(201).json({ success: true, script: newScript });
  });

  app.put("/api/scripts/:id", (req, res) => {
    const id = req.params.id;
    const existing = scriptsDb.get(id);
    if (!existing) {
      // Create if not found
      const newScript: ScriptItem = {
        id,
        title: req.body.title || "Kịch bản mới",
        content: req.body.content || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: req.body.tags || [],
        settings: req.body.settings,
      };
      scriptsDb.set(id, newScript);
      return res.json({ success: true, script: newScript });
    }

    const updated: ScriptItem = {
      ...existing,
      title: req.body.title !== undefined ? req.body.title.trim() : existing.title,
      content: req.body.content !== undefined ? req.body.content : existing.content,
      tags: req.body.tags !== undefined ? req.body.tags : existing.tags,
      settings: req.body.settings ? { ...existing.settings, ...req.body.settings } : existing.settings,
      updatedAt: Date.now(),
    };

    scriptsDb.set(id, updated);
    res.json({ success: true, script: updated });
  });

  app.delete("/api/scripts/:id", (req, res) => {
    const id = req.params.id;
    if (!scriptsDb.has(id)) {
      return res.status(404).json({ success: false, message: "Kịch bản không tồn tại" });
    }
    scriptsDb.delete(id);
    res.json({ success: true, message: "Đã xóa kịch bản thành công" });
  });

  // API: Real-time Multi-device Sync Rooms
  // 1. Get or create room state
  app.get("/api/rooms/:roomId/state", (req, res) => {
    const roomId = req.params.roomId.toUpperCase().trim();
    let state = roomsState.get(roomId);
    if (!state) {
      state = {
        roomId,
        scriptTitle: "Kịch bản đồng bộ",
        scriptContent: "Chào mừng bạn đến với phòng đồng bộ...",
        isPlaying: false,
        scrollProgress: 0,
        scrollPosPx: 0,
        speed: 30,
        fontSize: 40,
        lineHeight: 1.8,
        theme: "oled",
        isMirrored: false,
        isFlipped: false,
        focusGuide: true,
        focusPosition: 35,
        fontFamily: "sans",
        alignment: "left",
        allCaps: false,
        lastUpdated: Date.now(),
      };
      roomsState.set(roomId, state);
    }
    res.json({ success: true, state });
  });

  // 2. SSE stream for real-time room events
  app.get("/api/rooms/:roomId/events", (req, res) => {
    const roomId = req.params.roomId.toUpperCase().trim();
    const role = (req.query.role as "prompter" | "controller") || "controller";
    const clientId = Math.random().toString(36).substring(2, 9);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    if (!roomClients.has(roomId)) {
      roomClients.set(roomId, new Set());
    }

    const clientObj: RoomClient = { id: clientId, role, res };
    roomClients.get(roomId)!.add(clientObj);

    // Send initial connected state
    let state = roomsState.get(roomId);
    if (!state) {
      state = {
        roomId,
        scriptTitle: "Kịch bản đồng bộ",
        scriptContent: "Chào mừng bạn đến với phòng đồng bộ...",
        isPlaying: false,
        scrollProgress: 0,
        scrollPosPx: 0,
        speed: 30,
        fontSize: 40,
        lineHeight: 1.8,
        theme: "oled",
        isMirrored: false,
        isFlipped: false,
        focusGuide: true,
        focusPosition: 35,
        fontFamily: "sans",
        alignment: "left",
        allCaps: false,
        lastUpdated: Date.now(),
      };
      roomsState.set(roomId, state);
    }

    res.write(`data: ${JSON.stringify({ type: "INIT", state, clientId })}\n\n`);

    // Ping interval to keep connection alive
    const pingTimer = setInterval(() => {
      res.write(`:ping\n\n`);
    }, 15000);

    req.on("close", () => {
      clearInterval(pingTimer);
      const set = roomClients.get(roomId);
      if (set) {
        set.delete(clientObj);
        if (set.size === 0) {
          roomClients.delete(roomId);
        }
      }
    });
  });

  // 3. Broadcast action or state update to all devices in room
  app.post("/api/rooms/:roomId/action", (req, res) => {
    const roomId = req.params.roomId.toUpperCase().trim();
    const { action, payload, senderId } = req.body;

    let state = roomsState.get(roomId);
    if (!state) {
      state = {
        roomId,
        scriptTitle: "Kịch bản đồng bộ",
        scriptContent: "",
        isPlaying: false,
        scrollProgress: 0,
        scrollPosPx: 0,
        speed: 30,
        fontSize: 40,
        lineHeight: 1.8,
        theme: "oled",
        isMirrored: false,
        isFlipped: false,
        focusGuide: true,
        focusPosition: 35,
        fontFamily: "sans",
        alignment: "left",
        allCaps: false,
        lastUpdated: Date.now(),
      };
      roomsState.set(roomId, state);
    }

    // Apply action updates to stored state
    if (action === "SYNC_STATE" && payload) {
      state = { ...state, ...payload, lastUpdated: Date.now() };
      roomsState.set(roomId, state);
    } else if (action === "PLAY") {
      state.isPlaying = true;
      state.lastUpdated = Date.now();
    } else if (action === "PAUSE") {
      state.isPlaying = false;
      state.lastUpdated = Date.now();
    } else if (action === "TOGGLE_PLAY") {
      state.isPlaying = !state.isPlaying;
      state.lastUpdated = Date.now();
    } else if (action === "SET_SPEED" && typeof payload?.speed === "number") {
      state.speed = payload.speed;
      state.lastUpdated = Date.now();
    } else if (action === "SET_FONT_SIZE" && typeof payload?.fontSize === "number") {
      state.fontSize = payload.fontSize;
      state.lastUpdated = Date.now();
    } else if (action === "SCROLL_JUMP" && typeof payload?.scrollProgress === "number") {
      state.scrollProgress = payload.scrollProgress;
      state.scrollPosPx = payload.scrollPosPx || 0;
      state.lastUpdated = Date.now();
    } else if (action === "LOAD_SCRIPT" && payload) {
      if (payload.scriptTitle) state.scriptTitle = payload.scriptTitle;
      if (payload.scriptContent) state.scriptContent = payload.scriptContent;
      if (payload.scriptId) state.scriptId = payload.scriptId;
      state.scrollProgress = 0;
      state.scrollPosPx = 0;
      state.isPlaying = false;
      state.lastUpdated = Date.now();
    } else if (action === "TOGGLE_MIRROR") {
      state.isMirrored = !state.isMirrored;
      state.lastUpdated = Date.now();
    } else if (action === "SET_THEME" && payload?.theme) {
      state.theme = payload.theme;
      state.lastUpdated = Date.now();
    }

    // Broadcast to all connected clients in this room
    const clients = roomClients.get(roomId);
    if (clients) {
      const dataStr = JSON.stringify({
        type: "ACTION",
        action,
        payload,
        state,
        senderId,
        timestamp: Date.now(),
      });
      for (const client of clients) {
        try {
          client.res.write(`data: ${dataStr}\n\n`);
        } catch (e) {
          // ignore closed connection
        }
      }
    }

    res.json({ success: true, state, connectedClients: clients ? clients.size : 0 });
  });

  // API: Google Sheets Importer Proxy & Parser
  app.post("/api/import/sheets", async (req, res) => {
    try {
      const { url, rawCsv, selectedColumn, formatOption } = req.body;

      let csvText = "";

      if (rawCsv && typeof rawCsv === "string") {
        csvText = rawCsv;
      } else if (url && typeof url === "string") {
        // Parse Google Sheet URL to extract document ID and sheet/gid
        let fetchUrl = url.trim();

        // Match Google Sheets ID
        const match = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const docId = match[1];
          let gid = "0";
          const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
          if (gidMatch && gidMatch[1]) {
            gid = gidMatch[1];
          }
          // Direct CSV export link format for public/shared Google Sheets
          fetchUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
        }

        const response = await fetch(fetchUrl, {
          headers: {
            "User-Agent": "PrompterFlow-Script-Importer/1.0",
            Accept: "text/csv, text/plain, */*",
          },
        });

        if (!response.ok) {
          return res.status(400).json({
            success: false,
            message: `Không thể tải dữ liệu từ Google Sheets (Mã lỗi ${response.status}). Hãy đảm bảo bảng tính đã được mở quyền chia sẻ ("Bất kỳ ai có liên kết đều có thể xem") hoặc dùng tính năng Dán nội dung TSV/CSV trực tiếp.`,
          });
        }

        csvText = await response.text();
      } else {
        return res.status(400).json({ success: false, message: "Cần cung cấp URL Google Sheets hoặc nội dung CSV/TSV" });
      }

      // Parse CSV / TSV lines
      const isTsv = csvText.includes("\t") && !csvText.includes(",");
      const delimiter = isTsv ? "\t" : ",";

      // Basic robust CSV parser handling quotes
      const parseCSVLine = (line: string, delim: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const next = line[i + 1];
          if (char === '"') {
            if (inQuotes && next === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delim && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        return res.status(400).json({ success: false, message: "Bảng tính không có dữ liệu" });
      }

      const headers = parseCSVLine(lines[0], delimiter);
      const rows = lines.slice(1).map((line) => parseCSVLine(line, delimiter));

      // Build structured script content
      let generatedScript = "";
      const scriptTitle = req.body.title || "Kịch bản từ Google Sheets";

      // Analyze formatOption: 'all_text', 'dialogue_scenes', or 'single_column'
      if (formatOption === "single_column" && typeof selectedColumn === "number") {
        const colIdx = selectedColumn;
        generatedScript = rows
          .map((row) => row[colIdx] || "")
          .filter((t) => t.trim().length > 0)
          .join("\n\n");
      } else if (formatOption === "dialogue_scenes" || headers.some(h => /cảnh|scene|nhân vật|speaker|người đọc|nội dung|dialogue/i.test(h))) {
        // Detect column indices
        const sceneCol = headers.findIndex((h) => /cảnh|scene|phần|part/i.test(h));
        const speakerCol = headers.findIndex((h) => /nhân vật|speaker|người đọc|vai|role/i.test(h));
        const contentCol = headers.findIndex((h) => /nội dung|dialogue|kịch bản|lời thoại|text|script/i.test(h));

        let currentScene = "";
        const parts: string[] = [];

        rows.forEach((row) => {
          const sceneVal = sceneCol >= 0 ? row[sceneCol] : "";
          const speakerVal = speakerCol >= 0 ? row[speakerCol] : "";
          const contentVal = contentCol >= 0 ? row[contentCol] : row.filter((_, idx) => idx !== sceneCol && idx !== speakerCol).join(" ");

          if (sceneVal && sceneVal !== currentScene) {
            currentScene = sceneVal;
            parts.push(`\n[${sceneVal.toUpperCase()}]\n`);
          }

          if (speakerVal) {
            parts.push(`【${speakerVal}】\n${contentVal}\n`);
          } else if (contentVal) {
            parts.push(`${contentVal}\n`);
          }
        });

        generatedScript = parts.join("\n").trim();
      } else {
        // Default: intelligently combine row text
        generatedScript = rows
          .map((row) => row.filter((c) => c.length > 0).join(" - "))
          .filter((t) => t.trim().length > 0)
          .join("\n\n");
      }

      if (!generatedScript) {
        // Fallback: take all text
        generatedScript = csvText;
      }

      res.json({
        success: true,
        script: {
          title: scriptTitle,
          content: generatedScript,
          headers,
          rowCount: rows.length,
        },
      });
    } catch (err: any) {
      console.error("Sheets import error:", err);
      res.status(500).json({ success: false, message: "Lỗi xử lý bảng tính: " + (err.message || "Không xác định") });
    }
  });

  // API: AI Script Polishing & Speech Markers (Gemini)
  app.post("/api/ai/optimize-script", async (req, res) => {
    try {
      const { scriptText, actionType } = req.body;
      if (!scriptText || typeof scriptText !== "string") {
        return res.status(400).json({ success: false, message: "Cần cung cấp nội dung kịch bản" });
      }

      const ai = getAIClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          message: "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Bạn vẫn có thể sử dụng đầy đủ các tính năng nhập và đọc kịch bản!",
        });
      }

      let prompt = "";
      if (actionType === "add_cues") {
        prompt = `Bạn là một đạo diễn và chuyên gia huấn luyện MC/diễn giả truyền hình hàng đầu. 
Hãy tối ưu hóa đoạn kịch bản sau đây để người đọc sử dụng trên Máy Nhắc Chữ (Teleprompter) một cách tự nhiên nhất:
1. Thêm các thẻ phân đoạn rõ ràng như [MỞ ĐẦU], [CẢNH 1], [TRỌNG TÂM], [KẾT THÚC] nếu thích hợp.
2. Thêm chỉ dẫn nhịp thở và ngắt nghỉ tự nhiên bằng cú pháp [nghỉ 1s] hoặc [nhấn giọng].
3. Viết hoa hoặc in đậm các từ khóa cần nhấn mạnh.
4. Giữ nguyên ngôn ngữ gốc (tiếng Việt/tiếng Anh) và ý nghĩa, không tự ý cắt xén bớt thông tin quan trọng.
5. Chỉ trả về trực tiếp nội dung kịch bản đã tối ưu, không kèm lời chào hay giải thích ngoài lề.

Kịch bản gốc:
${scriptText}`;
      } else if (actionType === "bullet_cues") {
        prompt = `Hãy chuyển đổi kịch bản sau đây thành dạng Các Thẻ Ý Chính / Cue Cards tóm tắt cực kỳ dễ nhìn trên máy nhắc chữ teleprompter khi quay video hoặc thuyết trình:
- Từng gạch đầu dòng ngắn gọn, rõ ý, súc tích.
- Mỗi ý thể hiện 1 điểm mấu chốt.
- Có chỉ dẫn mở đầu và kết bài.
- Chỉ trả về nội dung kịch bản tóm tắt, không thêm văn bản giải thích.

Kịch bản gốc:
${scriptText}`;
      } else if (actionType === "fix_grammar") {
        prompt = `Hãy trau chuốt câu từ, sửa lỗi chính tả và làm cho giọng điệu của kịch bản sau đây trở nên trôi chảy, cuốn hút và dễ đọc thành tiếng hơn (dành cho máy nhắc chữ Teleprompter).
Chỉ trả về trực tiếp kịch bản đã trau chuốt, không giải thích gì thêm.

Kịch bản:
${scriptText}`;
      } else {
        prompt = `Hãy tối ưu kịch bản sau cho máy nhắc chữ teleprompter, chia đoạn hợp lý và ngắt nhịp dễ đọc:
${scriptText}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const optimizedContent = response.text?.trim() || scriptText;
      res.json({ success: true, optimizedContent });
    } catch (err: any) {
      console.error("AI optimize error:", err);
      res.status(500).json({ success: false, message: "Lỗi xử lý AI: " + (err.message || "Không xác định") });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PrompterFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
