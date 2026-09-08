// Powered by OnSpace.AI
export interface LlamaModel {
  id: string;
  name: string;
  path: string;
  addedAt: number;
  isLoaded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface GenerationParams {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens: number;
  repeat_penalty: number;
  stream: boolean;
}

export interface LlamaServerStatus {
  connected: boolean;
  modelLoaded: boolean;
  modelName?: string;
}

export async function checkServerStatus(serverUrl: string): Promise<LlamaServerStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${serverUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      return { connected: true, modelLoaded: true, modelName: 'llama.cpp server' };
    }
    return { connected: false, modelLoaded: false };
  } catch {
    return { connected: false, modelLoaded: false };
  }
}

export async function getServerModels(serverUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${serverUrl}/v1/models`);
    if (response.ok) {
      const data = await response.json();
      return data?.data?.map((m: { id: string }) => m.id) ?? [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function generateCompletion(
  serverUrl: string,
  messages: ChatMessage[],
  params: GenerationParams,
  systemPrompt: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const body = JSON.stringify({
      messages: formattedMessages,
      temperature: params.temperature,
      top_p: params.top_p,
      top_k: params.top_k,
      max_tokens: params.max_tokens,
      repeat_penalty: params.repeat_penalty,
      stream: params.stream,
    });

    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      onError(`Server error: ${response.status} ${response.statusText}`);
      return;
    }

    if (!params.stream) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      onToken(content);
      onDone();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed?.choices?.[0]?.delta?.content ?? '';
          if (token) onToken(token);
        } catch {
          // skip
        }
      }
      onDone();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed?.choices?.[0]?.delta?.content ?? '';
          if (token) onToken(token);
        } catch {
          // skip malformed
        }
      }
    }
    onDone();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onError(message);
  }
}
