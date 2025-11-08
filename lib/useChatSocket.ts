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
  const userId = useAuthStore.getState().userId;

  useEffect(() => {
    if (!chatId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (chatId) {
        console.log(`[Socket Hook]: Joining chat ${chatId}`);
        socket.emit("joinChat", chatId);
      }
    });

    socket.on("chatStatusUpdated", (data) => {
      if (data.chatId === chatId && data.status) {
        setStatus(data.status);
      }
    });

    return () => {
      console.log(`[Socket Hook]: Leaving chat ${chatId}`);
      socket.emit("leaveChat", chatId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

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
      } catch {}
    };

    fetchInitialStatus();
    return () => {
      isMounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (status === "active" && userId) {
      (async () => {
        try {
          await refetchInactive({ userId });
        } catch (err) {
          console.warn("⚠️ Failed to check inactive chats:", err);
        }
      })();
    }
  }, [status, userId]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (status !== "pending") return;

    const now = Date.now();
    let expiryTime: number | null = null;

    if (appointmentDate) {
      const appointment = new Date(appointmentDate).getTime();
      expiryTime = appointment <= now ? now : appointment;
    } else if (chatRequestSentDate) {
      const requestTime = new Date(chatRequestSentDate).getTime();
      expiryTime = requestTime + 24 * 60 * 60 * 1000;
    }

    if (!expiryTime) return;

    const remaining = expiryTime - now;

    if (remaining > 0) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const res = await refetch({ chatId });
          if (res?.status) setStatus(res.status);
        } catch {}
      }, remaining);
    } else {
      (async () => {
        try {
          const res = await refetch({ chatId });
          if (res?.status) setStatus(res.status);
        } catch {}
      })();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, chatId, chatRequestSentDate, appointmentDate]);

  return status;
}
