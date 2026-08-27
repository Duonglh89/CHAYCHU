import React, { useState, useEffect, useCallback } from 'react';
import { ScriptItem, PrompterSettings, ViewMode } from './types';
import {
  getLocalScripts,
  saveLocalScripts,
  getLocalSettings,
  saveLocalSettings,
  DEFAULT_PROMPTER_SETTINGS,
} from './services/storage';
import {
  fetchScripts,
  createScript,
  updateScript,
  deleteScript as apiDeleteScript,
  sendRoomAction,
} from './services/api';
import { ScriptLibrary } from './components/ScriptLibrary';
import { PrompterView } from './components/PrompterView';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { ImportModal } from './components/ImportModal';
import { RemoteControlModal } from './components/RemoteControlModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [settings, setSettings] = useState<PrompterSettings>(DEFAULT_PROMPTER_SETTINGS);
  const [activeScript, setActiveScript] = useState<ScriptItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('library');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingScript, setEditingScript] = useState<ScriptItem | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync Room ID
  const [roomId, setRoomId] = useState<string>('');

  // 1. Initial Load: Settings and Scripts from API & LocalStorage
  useEffect(() => {
    // Load local settings
    const loadedSettings = getLocalSettings();
    setSettings(loadedSettings);

    // Check URL parameters for direct room sync (e.g. ?room=123456)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        setRoomId(urlRoom.toUpperCase());
        setIsSyncModalOpen(true);
      }
    }

    // Load initial scripts from local cache first for instant rendering
    const local = getLocalScripts();
    setScripts(local);

    // Then try sync with backend API
    fetchScripts()
      .then((serverScripts) => {
        if (serverScripts && serverScripts.length > 0) {
          setScripts(serverScripts);
          saveLocalScripts(serverScripts);
        }
      })
      .catch((err) => {
        console.log('Using local offline cache for scripts:', err);
      });
  }, []);

  // Update Settings handler
  const handleUpdateSettings = useCallback((newSettings: Partial<PrompterSettings>) => {
    setSettings((prev) => {
      const updated = saveLocalSettings(newSettings);
      return updated;
    });
  }, []);

  // Open Prompter
  const handleOpenPrompter = (script: ScriptItem) => {
    setActiveScript(script);
    // Apply script-specific settings if defined
    if (script.settings) {
      handleUpdateSettings(script.settings);
    }
    setViewMode('prompter');

    // Broadcast to room if connected
    if (roomId) {
      sendRoomAction(roomId, 'LOAD_SCRIPT', {
        scriptId: script.id,
        scriptTitle: script.title,
        scriptContent: script.content,
      });
    }
  };

  // Close Prompter
  const handleClosePrompter = () => {
    setViewMode('library');
  };

  // Open Editor
  const handleOpenEditor = (script: ScriptItem | null) => {
    setEditingScript(script);
    setIsEditorOpen(true);
  };

  // Save Script (Create or Update)
  const handleSaveScript = async (scriptData: Partial<ScriptItem>) => {
    try {
      if (scriptData.id && scripts.some((s) => s.id === scriptData.id)) {
        // Update existing
        const updated = await updateScript(scriptData.id, scriptData).catch(() => {
          // Fallback to local
          const localItem: ScriptItem = {
            ...scripts.find((s) => s.id === scriptData.id)!,
            ...scriptData,
            updatedAt: Date.now(),
          } as ScriptItem;
          return localItem;
        });

        const newScripts = scripts.map((s) => (s.id === updated.id ? updated : s));
        setScripts(newScripts);
        saveLocalScripts(newScripts);
        if (activeScript?.id === updated.id) {
          setActiveScript(updated);
        }
      } else {
        // Create new
        const created = await createScript({
          title: scriptData.title || 'Kịch bản mới',
          content: scriptData.content || '',
          tags: scriptData.tags || ['Mới'],
          settings: scriptData.settings,
        }).catch(() => {
          const localNew: ScriptItem = {
            id: 'script_' + Math.random().toString(36).substring(2, 9),
            title: scriptData.title || 'Kịch bản mới',
            content: scriptData.content || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: scriptData.tags || ['Mới'],
            settings: scriptData.settings,
          };
          return localNew;
        });

        const newScripts = [created, ...scripts];
        setScripts(newScripts);
        saveLocalScripts(newScripts);
      }
    } catch (err) {
      console.error('Error saving script:', err);
    }
  };

  // Delete Script
  const handleDeleteScript = async (id: string) => {
    try {
      await apiDeleteScript(id).catch(() => {});
      const newScripts = scripts.filter((s) => s.id !== id);
      setScripts(newScripts);
      saveLocalScripts(newScripts);
      if (activeScript?.id === id) {
        setActiveScript(null);
        setViewMode('library');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Duplicate Script
  const handleDuplicateScript = async (script: ScriptItem) => {
    const duplicatedData: Partial<ScriptItem> = {
      title: `${script.title} (Bản sao)`,
      content: script.content,
      tags: [...(script.tags || []), 'Bản sao'],
      settings: script.settings,
    };
    await handleSaveScript(duplicatedData);
  };

  // Handle Import Complete from Google Sheets / File / Paste
  const handleImportComplete = async (title: string, content: string, tags?: string[]) => {
    await handleSaveScript({
      title,
      content,
      tags: tags || ['Đã nhập'],
      settings: {
        fontSize: settings.fontSize,
        speed: settings.speed,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans antialiased">
      {/* 1. Main Teleprompter View Mode */}
      {viewMode === 'prompter' && activeScript ? (
        <PrompterView
          script={activeScript}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={handleClosePrompter}
          onEditScript={(sc) => handleOpenEditor(sc)}
          roomId={roomId}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />
      ) : (
        /* 2. Main Library View */
        <ScriptLibrary
          scripts={scripts}
          settings={settings}
          onOpenPrompter={handleOpenPrompter}
          onOpenEditor={handleOpenEditor}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onDeleteScript={handleDeleteScript}
          onDuplicateScript={handleDuplicateScript}
        />
      )}

      {/* Modals & Dialogs */}
      {/* Script Editor Modal */}
      <ScriptEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingScript(null);
        }}
        script={editingScript}
        onSave={handleSaveScript}
        onStartPrompter={(sc) => handleOpenPrompter(sc)}
      />

      {/* Import from Google Sheets / File / Paste Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Real-time Multi-device Sync / Phone Remote Control Modal */}
      <RemoteControlModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        roomId={roomId}
        onSetRoomId={setRoomId}
        currentScriptTitle={activeScript?.title}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
