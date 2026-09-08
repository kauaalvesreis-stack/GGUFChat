// Powered by OnSpace.AI
import { GenerationParams } from './llamaService';

export interface BenchmarkResult {
  id: string;
  modelName: string;
  prompt: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  firstTokenMs: number;
  totalMs: number;
  tokensPerSecond: number;
  timestamp: number;
}

export interface BenchmarkProgress {
  stage: 'idle' | 'running' | 'done' | 'error';
  message: string;
  tokensReceived: number;
  elapsedMs: number;
}

const BENCH_PROMPTS = [
  'Explique o que é machine learning em 3 parágrafos detalhados.',
  'Escreva um conto curto sobre um robô que aprende a sentir emoções.',
  'Liste 10 vantagens e desvantagens do uso de modelos de linguagem locais.',
];

export async function runBenchmark(
  serverUrl: string,
  params: GenerationParams,
  promptIndex: number = 0,
  onProgress: (p: BenchmarkProgress) => void
): Promise<BenchmarkResult | null> {
  const prompt = BENCH_PROMPTS[promptIndex % BENCH_PROMPTS.length];
  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let tokenCount = 0;

  onProgress({ stage: 'running', message: 'Enviando prompt...', tokensReceived: 0, elapsedMs: 0 });

  try {
    const body = JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: params.temperature,
      top_p: params.top_p,
      top_k: params.top_k,
      max_tokens: Math.min(params.max_tokens, 256),
      stream: true,
    });

    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      onProgress({ stage: 'error', message: `Erro HTTP: ${response.status}`, tokensReceived: 0, elapsedMs: 0 });
      return null;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    const processLines = (lines: string[]) => {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') return true;
        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed?.choices?.[0]?.delta?.content ?? '';
          if (token) {
            if (firstTokenTime === null) firstTokenTime = Date.now();
            tokenCount++;
            accumulated += token;
            onProgress({
              stage: 'running',
              message: 'Gerando resposta...',
              tokensReceived: tokenCount,
              elapsedMs: Date.now() - startTime,
            });
          }
        } catch {
          // skip
        }
      }
      return false;
    };

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        if (processLines(lines)) break;
      }
    } else {
      const text = await response.text();
      processLines(text.split('\n'));
    }

    const totalMs = Date.now() - startTime;
    const firstMs = firstTokenTime ? firstTokenTime - startTime : totalMs;
    const tps = tokenCount > 0 ? (tokenCount / (totalMs / 1000)) : 0;

    const result: BenchmarkResult = {
      id: `${Date.now()}`,
      modelName: 'llama.cpp',
      prompt,
      totalTokens: tokenCount + prompt.split(' ').length,
      inputTokens: prompt.split(' ').length,
      outputTokens: tokenCount,
      firstTokenMs: firstMs,
      totalMs,
      tokensPerSecond: parseFloat(tps.toFixed(2)),
      timestamp: Date.now(),
    };

    onProgress({ stage: 'done', message: 'Benchmark concluído!', tokensReceived: tokenCount, elapsedMs: totalMs });
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    onProgress({ stage: 'error', message: msg, tokensReceived: tokenCount, elapsedMs: Date.now() - startTime });
    return null;
  }
}

export const BENCH_PROMPT_LABELS = [
  'Machine Learning',
  'Conto criativo',
  'Lista argumentativa',
];
