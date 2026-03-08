import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// One-time migration from old storage key
if (localStorage.getItem('ea-light-ai-key') && !localStorage.getItem('cairn-ai-key')) {
  localStorage.setItem('cairn-ai-key', localStorage.getItem('ea-light-ai-key')!);
  localStorage.removeItem('ea-light-ai-key');
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  panelOpen: boolean;
  apiKeyConfigured: boolean;
  showApiKeyInput: boolean;
  error: string | null;

  addMessage: (msg: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingText: (chunk: string) => void;
  finalizeStreaming: () => void;
  clearMessages: () => void;
  setPanelOpen: (open: boolean) => void;
  setApiKeyConfigured: (configured: boolean) => void;
  setShowApiKeyInput: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingText: '',
      panelOpen: false,
      apiKeyConfigured: !!localStorage.getItem('cairn-ai-key'),
      showApiKeyInput: false,
      error: null,

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg].slice(-50) as ChatMessage[] })),

      setStreaming: (isStreaming) =>
        set({ isStreaming, error: null }),

      appendStreamingText: (chunk) =>
        set((s) => ({ streamingText: s.streamingText + chunk })),

      finalizeStreaming: () => {
        const { streamingText } = get();
        if (streamingText) {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: streamingText,
              },
            ].slice(-50) as ChatMessage[],
            streamingText: '',
            isStreaming: false,
          }));
        } else {
          set({ streamingText: '', isStreaming: false });
        }
      },

      clearMessages: () => set({ messages: [], streamingText: '', error: null }),

      setPanelOpen: (panelOpen) => set({ panelOpen }),

      setApiKeyConfigured: (apiKeyConfigured) => set({ apiKeyConfigured }),

      setShowApiKeyInput: (showApiKeyInput) => set({ showApiKeyInput }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'cairn-ai-chat',
      partialize: (state) => ({ messages: state.messages.slice(-50) }),
    }
  )
);
