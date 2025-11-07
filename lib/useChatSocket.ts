import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { SOCKET_URL } from "@/config";
import { deleteExpired } from "./api/chat"; // Or whatever your API function is
import { useBackend } from "./useBackend";

export type ChatStatus = "pending" | "active" | "closed" | "";

export function useChatStatus(
  chatId: string,
  chatRequestSentDate?: string,
  appointmentDate?: string
) {
  const [status, setStatus] = useState<ChatStatus>("");
  const { refetch } = useBackend({ fn: deleteExpired });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
  socket.on("connect_error", (err) => {
  console.error("[Socket Hook] connect_error:", err);
});

socket.on("error", (err) => {
  console.error("[Socket Hook] error:", err);
});

 socket.on("connect", () => {
  console.log(`[Socket Hook]: Connected with id ${socket.id}`);
  if (chatId) {
    socket.emit("joinChat", chatId);
    console.log(`[Socket Hook]: Joining chat ${chatId}`);
  }
});


  socket.on("chatStatusUpdated", (data) => {
    console.log("[Socket Event]: chatStatusUpdated received!", data);
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
      setStatus(""); // Clear status if no chat ID
      return;
    }

    let isMounted = true; 
    const fetchInitialStatus = async () => {
      try {
        console.log(`[Fetch Hook]: Fetching initial status for ${chatId}`);
        const res = await refetch({ chatId });
        if (isMounted && res?.status) {
          setStatus(res.status);
        }
      } catch (err) {
        console.warn("❌ Failed to fetch chat status:", err);
      }
    };

    fetchInitialStatus();

    return () => {
      isMounted = false;
    };
  }, [chatId]); 
  useEffect(() => {
    // 1. Clear any existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 2. Only set a new timer if the status is 'pending'
    if (status !== "pending") {
      return;
    }

    const now = Date.now();
    let expiryTime: number | null = null;

    if (appointmentDate) {
      const appointment = new Date(appointmentDate).getTime();
      expiryTime = appointment <= now ? now : appointment;
    } else if (chatRequestSentDate) {
      const requestTime = new Date(chatRequestSentDate).getTime();
      expiryTime = requestTime + 24 * 60 * 60 * 1000; // 24 hrs
    }

    if (!expiryTime) return;

    const remaining = expiryTime - now;
    console.log(`[Timer Hook]: Setting expiry timer. Remaining: ${remaining}ms`);

    if (remaining > 0) {
      // Timer is in the future
      timeoutRef.current = setTimeout(async () => {
        try {
          console.log(`[Timer Hook]: Timer expired! Checking status for ${chatId}`);
          const res = await refetch({ chatId }); // Check/update status
          if (res?.status) setStatus(res.status);
        } catch (err) {
          console.warn("⏰ Failed to check chat expiry:", err);
        }
      }, remaining);
    } else {
      // Already expired, check immediately
      (async () => {
        try {
          console.log(`[Timer Hook]: Already expired. Checking status for ${chatId}`);
          const res = await refetch({ chatId });
          if (res?.status) setStatus(res.status);
        } catch (err) {
          console.warn("❌ Failed to update expired chat:", err);
        }
      })();
    }

    // Cleanup for this effect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status, chatId, chatRequestSentDate, appointmentDate]); // <-- Dependencies for the timer

  return status;
}