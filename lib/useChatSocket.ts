import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { SOCKET_URL } from "@/config";
import { deleteExpired, deleteInactiveChats } from "./api/chat";
import { useBackend } from "./useBackend";
import { useAuthStore } from "@/store/authStore";

export type ChatStatus = "pending" | "active" | "closed" | "";

export function useChatStatus(
  chatId: string,
  chatRequestSentDate?: string,
  appointmentDate?: string
) {
  const [status, setStatus] = useState<ChatStatus>("");
  const { refetch } = useBackend({ fn: deleteExpired });
  const { refetch: refetchInactive } = useBackend({ fn: deleteInactiveChats });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastChatIdRef = useRef<string | null>(null);
  const userId = useAuthStore.getState().userId;

  // --- Initialize socket connection only once ---
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Socket connected");
        if (lastChatIdRef.current) {
          socket.emit("joinChat", lastChatIdRef.current);
          console.log(`[Socket Hook]: Reconnected & rejoined ${lastChatIdRef.current}`);
        }
      });

      socket.on("chatStatusUpdated", (data) => {
        if (data.chatId === lastChatIdRef.current && data.status) {
          setStatus(data.status);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });
    }

    return () => {
      // Cleanly disconnect socket on full unmount
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // --- Join/Leave chat rooms when chatId changes ---
  useEffect(() => {
    if (!socketRef.current || !chatId) return;

    // If chatId didn’t actually change, don’t rejoin
    if (lastChatIdRef.current === chatId) return;

    // Leave previous room if it exists
    if (lastChatIdRef.current) {
      console.log(`[Socket Hook]: Leaving chat ${lastChatIdRef.current}`);
      socketRef.current.emit("leaveChat", lastChatIdRef.current);
    }

    // Join new room
    console.log(`[Socket Hook]: Joining chat ${chatId}`);
    socketRef.current.emit("joinChat", chatId);
    lastChatIdRef.current = chatId;

    // Optional cleanup on unmount (not on every rerender)
    return () => {
      console.log(`[Socket Hook]: Leaving chat ${chatId}`);
      socketRef.current?.emit("leaveChat", chatId);
    };
  }, [chatId]);

  // --- Fetch initial status from backend ---
  useEffect(() => {
    if (!chatId) {
      setStatus("");
      return;
    }

    let isMounted = true;
    const fetchInitialStatus = async () => {
      try {
        const res = await refetch({ chatId });
        if (isMounted && res?.status) {
          setStatus(res.status);
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch chat status:", err);
      }
    };

    fetchInitialStatus();
    return () => {
      isMounted = false;
    };
  }, [chatId]);

  // --- Inactive chat cleanup (1 hour after appointment) ---
  useEffect(() => {
    if (!appointmentDate || !userId) return;

    const appointmentTime = new Date(appointmentDate).getTime();
    const oneHourAfter = appointmentTime + 60 * 60 * 1000;
    const delay = oneHourAfter - Date.now();

    const runCleanup = async () => {
      try {
        await refetchInactive({ userId });
      } catch (err) {
        console.warn("⚠️ Failed to check inactive chats:", err);
      }
    };

    if (delay <= 0) {
      runCleanup();
    } else {
      const timer = setTimeout(runCleanup, delay);
      return () => clearTimeout(timer);
    }
  }, [appointmentDate, userId]);

  // --- Pending chat expiry logic (24h or until appointment) ---
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (status !== "pending") return;

    const now = Date.now();
    let expiryTime: number | null = null;

    if (appointmentDate && chatRequestSentDate) {
      const appointment = new Date(appointmentDate).getTime();
      const requestTime = new Date(chatRequestSentDate).getTime();
      const twentyFourHoursLater = requestTime + 24 * 60 * 60 * 1000;

      // expire at appointment if within 24h, else after 24h
      expiryTime =
        appointment - requestTime <= 24 * 60 * 60 * 1000
          ? appointment
          : twentyFourHoursLater;
    } else if (chatRequestSentDate) {
      const requestTime = new Date(chatRequestSentDate).getTime();
      expiryTime = requestTime + 24 * 60 * 60 * 1000;
    }

    if (!expiryTime) return;

    const remaining = expiryTime - now;

    const runExpiryCheck = async () => {
      try {
        const res = await refetch({ chatId });
        if (res?.status) setStatus(res.status);
      } catch (err) {
        console.warn("⚠️ Expiry check failed:", err);
      }
    };

    if (remaining > 0) {
      timeoutRef.current = setTimeout(runExpiryCheck, remaining);
    } else {
      runExpiryCheck();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, chatId, chatRequestSentDate, appointmentDate]);

  return status;
}
