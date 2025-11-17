import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChatStore {
  currentChatId: string | null;
  patientName: string | null;
  patientProfileUrl: string | null;

  endedByCounselor: boolean;

  setCurrentChatId: (id: string | null) => void;
  setPatientName: (name: string | null) => void;
  setPatientProfileUrl: (url: string | null) => void;

  setEndedByCounselor: (value: boolean) => void;

  resetChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      currentChatId: null,
      patientName: null,
      patientProfileUrl: null,

      endedByCounselor: false,

      setCurrentChatId: (id) => set({ currentChatId: id }),
      setPatientName: (name) => set({ patientName: name }),
      setPatientProfileUrl: (url) => set({ patientProfileUrl: url }),

      setEndedByCounselor: (value) => set({ endedByCounselor: value }),

      resetChat: () =>
        set({
          currentChatId: null,
          patientName: null,
          patientProfileUrl: null,
          endedByCounselor: false,
        }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);