import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionState {
  chatId: string;
  counselorId: string;
  userId: string;
  requestSentDate: string;
  appointmentDate: string;
  counselorName?: string;
  setSessionDetails: (details: Partial<Omit<SessionState, 'setSessionDetails'>>) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      chatId: "",
      counselorId: "",
      userId: "",
      appointmentDate: "",
      counselorName: "",
        requestSentDate: "",

      setSessionDetails: (details) => set((state) => ({ ...state, ...details })),
      clearSession: () =>
        set({
          chatId: "",
          counselorId: "",
          userId: "",
          appointmentDate: "",
          counselorName: "",
            requestSentDate: ""

        }),
    }),
    {
      name: "session-storage", // Key for AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
