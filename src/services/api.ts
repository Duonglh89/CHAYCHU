import { ScriptItem, RoomState, ImportSheetsResult } from '../types';

export const API_BASE = '/api';

export async function fetchScripts(): Promise<ScriptItem[]> {
  try {
    const res = await fetch(`${API_BASE}/scripts`);
    if (!res.ok) throw new Error('Không thể tải danh sách kịch bản');
    const data = await res.json();
    return data.scripts || [];
  } catch (err) {
    console.warn('Backend scripts fetch failed, falling back to local cache:', err);
    throw err;
  }
}

export async function fetchScriptById(id: string): Promise<ScriptItem> {
  const res = await fetch(`${API_BASE}/scripts/${id}`);
  if (!res.ok) throw new Error('Không tìm thấy kịch bản');
  const data = await res.json();
  return data.script;
}

export async function createScript(script: {
  title: string;
  content: string;
  tags?: string[];
  settings?: any;
}): Promise<ScriptItem> {
  const res = await fetch(`${API_BASE}/scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(script),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi lưu kịch bản');
  }
  const data = await res.json();
  return data.script;
}

export async function updateScript(id: string, updates: Partial<ScriptItem>): Promise<ScriptItem> {
  const res = await fetch(`${API_BASE}/scripts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi cập nhật kịch bản');
  }
  const data = await res.json();
  return data.script;
}

export async function deleteScript(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/scripts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi khi xóa kịch bản');
  }
}

export async function importGoogleSheets(params: {
  url?: string;
  rawCsv?: string;
  selectedColumn?: number;
  formatOption?: string;
  title?: string;
}): Promise<ImportSheetsResult> {
  const res = await fetch(`${API_BASE}/import/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể nhập dữ liệu từ Google Sheets');
  }
  const data = await res.json();
  return data.script;
}

export async function optimizeScriptWithAI(scriptText: string, actionType: string): Promise<string> {
  const res = await fetch(`${API_BASE}/ai/optimize-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText, actionType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Lỗi xử lý AI');
  }
  const data = await res.json();
  return data.optimizedContent;
}

export async function getRoomState(roomId: string): Promise<RoomState> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/state`);
  if (!res.ok) throw new Error('Không thể lấy trạng thái phòng');
  const data = await res.json();
  return data.state;
}

export async function sendRoomAction(roomId: string, action: string, payload?: any, senderId?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, senderId }),
  });
  if (!res.ok) throw new Error('Không thể gửi lệnh điều khiển');
  return await res.json();
}
