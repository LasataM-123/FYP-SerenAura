// store/chatStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChatStore {
  currentChatId: string | null;
  patientName: string | null;
  patientProfileUrl: string | null;

  setCurrentChatId: (id: string | null) => void;
  setPatientName: (name: string | null) => void;
  setPatientProfileUrl: (url: string | null) => void;

  resetChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      currentChatId: null,
      patientName: null,
      patientProfileUrl: null,

      setCurrentChatId: (id) => set({ currentChatId: id }),
      setPatientName: (name) => set({ patientName: name }),
      setPatientProfileUrl: (url) => set({ patientProfileUrl: url }),

      resetChat: () =>
        set({
          currentChatId: null,
          patientName: null,
          patientProfileUrl: null,
        }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
