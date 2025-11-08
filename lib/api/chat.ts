import { API_URL } from "@/config";
import { useAuthStore } from "@/store/authStore";

export type Message = {
  _id: string;
  chatId: string;
  senderRole: "patient" | "counselor";
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatStatus = "pending" | "active" | "closed";

export type Chat = {
  _id: string;
  patientId: string;
  counselorId: string;
  status: ChatStatus;
  appointmentDate: string;
  requestSentDate: string;
  endTime?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type SendChatRequestResponse = {
  success: boolean;
  message: string;
  chat: Chat;
};

export type DeleteExpiredChatsResponse = {
  status: "closed" | "active" | "pending" | "";
};

export async function sendChatRequest(params?:{patientId: string, counselorId: string, appointmentDate: string}): Promise<SendChatRequestResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/chat/request`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
     body: JSON.stringify(params)
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Post request failed")
        }
    return res.json();
}

export async function deleteExpired(params?:{chatId:string}): Promise<DeleteExpiredChatsResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/chat/cleanup/expired/${params?.chatId}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Post request failed")
        }
    return res.json();
}

export async function deleteInactiveChats(params?: { userId: string }): Promise<DeleteExpiredChatsResponse> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}/chat/cleanup/inactive/${params?.userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to delete inactive chats");
  }

  return res.json();
}

export async function cancelRequest(params?: { chatId: string }): Promise<DeleteExpiredChatsResponse> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}/chat/cancel/${params?.chatId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to delete inactive chats");
  }

  return res.json();
}
