import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { SOCKET_URL, API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export interface ChatMessage {
  _id?: string;
  chatId: string;
  senderRole: "patient" | "counselor";
  content: string;
  createdAt?: string;
}

export type EndChatResponse = {
  success: boolean;
  status: "ended";
  message: string;
};

export function useChatMessaging(chatId: string, senderRole: "patient" | "counselor") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const lastChatIdRef = useRef<string | null>(null);
  const accessToken = useAuthStore.getState().accessToken;

  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🔌 Messaging socket connected");

        if (lastChatIdRef.current) {
          socket.emit("joinChat", lastChatIdRef.current);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Messaging socket disconnected");
      });

      socket.on("newMessage", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${chatId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();
        setMessages(data); // <-- THIS SETS ALL PREVIOUS MESSAGES
      } catch (err) {
        console.log("Failed to load chat messages:", err);
      }
    };

    loadHistory();
  }, [chatId]);

  useEffect(() => {
    if (!socketRef.current || !chatId) return;

    if (lastChatIdRef.current === chatId) return;

    if (lastChatIdRef.current) {
      socketRef.current.emit("leaveChat", lastChatIdRef.current);
    }

    socketRef.current.emit("joinChat", chatId);
    lastChatIdRef.current = chatId;

    return () => {
      socketRef.current?.emit("leaveChat", chatId);
    };
  }, [chatId]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatId,
          senderRole,
          content,
        }),
      });

      if (!res.ok) throw new Error(`Error sending message: ${res.status}`);

      return await res.json();
    } catch (err) {
      console.log("Message send error:", err);
      throw err;
    }
  };

  const endChat = async (): Promise<EndChatResponse> => {
    try {
      const res = await fetch(`${API_URL}/chat/end/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Error ending chat: ${res.status}`);

      return await res.json();
    } catch (err) {
      console.log("End chat error:", err);
      throw err;
    }
  };

  return {
    messages,
    sendMessage,
    endChat,
  };
}
