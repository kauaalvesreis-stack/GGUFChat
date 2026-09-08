// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatSession, LlamaModel, GenerationParams, LlamaServerStatus } from '@/services/llamaService';
import {
  saveSessions,
  loadSessions,
  saveModels,
  loadModels,
  saveServerUrl,
  loadServerUrl,
  saveActiveSessionId,
  loadActiveSessionId,
  saveParams,
  loadParams,
  saveSystemPrompt,
  loadSystemPrompt,
} from '@/services/storageService';
import { DEFAULT_PARAMS, SYSTEM_PROMPT_DEFAULT } from '@/constants/config';

export interface AppContextType {
  // Server
  serverUrl: string;
  setServerUrl: (url: string) => Promise<void>;
  serverStatus: LlamaServerStatus;
  setServerStatus: (s: LlamaServerStatus) => void;

  // Models
  models: LlamaModel[];
  addModel: (model: LlamaModel) => Promise<void>;
  removeModel: (id: string) => Promise<void>;
  activeModelId: string | null;
  setActiveModelId: (id: string | null) => void;

  // Sessions
  sessions: ChatSession[];
  setSessions: (s: ChatSession[]) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => Promise<void>;
  createSession: (modelId: string) => Promise<ChatSession>;
  updateSession: (session: ChatSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Params
  params: GenerationParams;
  setParams: (p: GenerationParams) => Promise<void>;
  systemPrompt: string;
  setSystemPrompt: (s: string) => Promise<void>;

  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionTitle(modelId: string): string {
  const now = new Date();
  return `Chat ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [serverUrl, _setServerUrl] = useState('http://localhost:8080');
  const [serverStatus, setServerStatus] = useState<LlamaServerStatus>({
    connected: false,
    modelLoaded: false,
  });
  const [models, setModels] = useState<LlamaModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, _setActiveSessionId] = useState<string | null>(null);
  const [params, _setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  const [systemPrompt, _setSystemPrompt] = useState(SYSTEM_PROMPT_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [
        storedSessions,
        storedModels,
        storedUrl,
        storedActiveId,
        storedParams,
        storedPrompt,
      ] = await Promise.all([
        loadSessions(),
        loadModels(),
        loadServerUrl(),
        loadActiveSessionId(),
        loadParams(),
        loadSystemPrompt(),
      ]);
      setSessions(storedSessions);
      setModels(storedModels);
      _setServerUrl(storedUrl);
      _setActiveSessionId(storedActiveId);
      if (storedParams) _setParams(storedParams);
      if (storedPrompt) _setSystemPrompt(storedPrompt);
      setIsLoading(false);
    }
    init();
  }, []);

  const setServerUrl = useCallback(async (url: string) => {
    _setServerUrl(url);
    await saveServerUrl(url);
  }, []);

  const addModel = useCallback(async (model: LlamaModel) => {
    setModels((prev) => {
      const next = [...prev, model];
      saveModels(next);
      return next;
    });
  }, []);

  const removeModel = useCallback(async (id: string) => {
    setModels((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveModels(next);
      return next;
    });
  }, []);

  const setActiveSessionId = useCallback(async (id: string | null) => {
    _setActiveSessionId(id);
    if (id) await saveActiveSessionId(id);
  }, []);

  const createSession = useCallback(
    async (modelId: string): Promise<ChatSession> => {
      const session: ChatSession = {
        id: generateId(),
        title: getSessionTitle(modelId),
        modelId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions((prev) => {
        const next = [session, ...prev];
        saveSessions(next);
        return next;
      });
      await saveActiveSessionId(session.id);
      _setActiveSessionId(session.id);
      return session;
    },
    []
  );

  const updateSession = useCallback(async (session: ChatSession) => {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === session.id ? session : s));
      saveSessions(next);
      return next;
    });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSessions(next);
      return next;
    });
    _setActiveSessionId((cur) => (cur === id ? null : cur));
  }, []);

  const setParams = useCallback(async (p: GenerationParams) => {
    _setParams(p);
    await saveParams(p);
  }, []);

  const setSystemPrompt = useCallback(async (s: string) => {
    _setSystemPrompt(s);
    await saveSystemPrompt(s);
  }, []);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        setServerUrl,
        serverStatus,
        setServerStatus,
        models,
        addModel,
        removeModel,
        activeModelId,
        setActiveModelId,
        sessions,
        setSessions,
        activeSessionId,
        setActiveSessionId,
        createSession,
        updateSession,
        deleteSession,
        params,
        setParams,
        systemPrompt,
        setSystemPrompt,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
