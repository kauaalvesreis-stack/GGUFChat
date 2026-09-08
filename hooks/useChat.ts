// Powered by OnSpace.AI
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatSession, generateCompletion } from '@/services/llamaService';
import { useApp } from './useApp';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const { serverUrl, params, systemPrompt, updateSession } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (
      session: ChatSession,
      userText: string,
      onUpdate: (session: ChatSession) => void
    ) => {
      if (!userText.trim() || isGenerating) return;
      abortRef.current = false;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userText.trim(),
        timestamp: Date.now(),
      };

      const aiMsgId = generateId();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      const updatedWithUser: ChatSession = {
        ...session,
        messages: [...session.messages, userMsg, aiMsg],
        updatedAt: Date.now(),
      };
      onUpdate(updatedWithUser);
      setIsGenerating(true);

      let accumulated = '';

      await generateCompletion(
        serverUrl,
        [...session.messages, userMsg],
        params,
        systemPrompt,
        (token) => {
          if (abortRef.current) return;
          accumulated += token;
          const streamingSession: ChatSession = {
            ...updatedWithUser,
            messages: updatedWithUser.messages.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: accumulated, isStreaming: true }
                : m
            ),
          };
          onUpdate(streamingSession);
        },
        () => {
          const finalSession: ChatSession = {
            ...updatedWithUser,
            messages: updatedWithUser.messages.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: accumulated, isStreaming: false }
                : m
            ),
            updatedAt: Date.now(),
          };
          onUpdate(finalSession);
          updateSession(finalSession);
          setIsGenerating(false);
        },
        (err) => {
          const errorSession: ChatSession = {
            ...updatedWithUser,
            messages: updatedWithUser.messages.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    content: `[Erro: ${err}]`,
                    isStreaming: false,
                  }
                : m
            ),
            updatedAt: Date.now(),
          };
          onUpdate(errorSession);
          updateSession(errorSession);
          setIsGenerating(false);
        }
      );
    },
    [serverUrl, params, systemPrompt, isGenerating, updateSession]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    setIsGenerating(false);
  }, []);

  return { sendMessage, stopGeneration, isGenerating };
}
