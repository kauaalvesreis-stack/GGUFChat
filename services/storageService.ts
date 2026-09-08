// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession, LlamaModel, GenerationParams } from './llamaService';

export interface FavoritePrompt {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface RagDocument {
  id: string;
  name: string;
  content: string;
  addedAt: number;
  size: number;
}

const KEYS = {
  SESSIONS: 'gguf_chat_sessions',
  MODELS: 'gguf_models',
  SERVER_URL: 'gguf_server_url',
  ACTIVE_SESSION: 'gguf_active_session',
  PARAMS: 'gguf_params',
  SYSTEM_PROMPT: 'gguf_system_prompt',
  FAVORITE_PROMPTS: 'gguf_favorite_prompts',
  RAG_DOCUMENTS: 'gguf_rag_documents',
};

export async function saveSessions(sessions: ChatSession[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function loadSessions(): Promise<ChatSession[]> {
  const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveModels(models: LlamaModel[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MODELS, JSON.stringify(models));
}

export async function loadModels(): Promise<LlamaModel[]> {
  const raw = await AsyncStorage.getItem(KEYS.MODELS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SERVER_URL, url);
}

export async function loadServerUrl(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.SERVER_URL)) ?? 'http://localhost:8080';
}

export async function saveActiveSessionId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, id);
}

export async function loadActiveSessionId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACTIVE_SESSION);
}

export async function saveParams(params: GenerationParams): Promise<void> {
  await AsyncStorage.setItem(KEYS.PARAMS, JSON.stringify(params));
}

export async function loadParams(): Promise<GenerationParams | null> {
  const raw = await AsyncStorage.getItem(KEYS.PARAMS);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveSystemPrompt(prompt: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SYSTEM_PROMPT, prompt);
}

export async function loadSystemPrompt(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.SYSTEM_PROMPT);
}

export async function saveFavoritePrompts(prompts: FavoritePrompt[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FAVORITE_PROMPTS, JSON.stringify(prompts));
}

export async function loadFavoritePrompts(): Promise<FavoritePrompt[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITE_PROMPTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveRagDocuments(docs: RagDocument[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.RAG_DOCUMENTS, JSON.stringify(docs));
}

export async function loadRagDocuments(): Promise<RagDocument[]> {
  const raw = await AsyncStorage.getItem(KEYS.RAG_DOCUMENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
