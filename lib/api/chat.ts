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

export type PatientInfo = {
  _id: string;
  name: string;
  profileUrl?: string;
};

export type GetResponse = {
  _id: string;
  patientId: string | PatientInfo;
  counselorId: string;
  status: ChatStatus;
  appointmentDate: string;
  requestSentDate: string;
  endTime?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type GetChatResponse = {
  success: boolean;
  message: string;
  chats: GetResponse[];
};

export type SendChatRequestResponse = {
  success: boolean;
  message: string;
  chat: Chat;
};

export type DeleteExpiredChatsResponse = {
  status: "closed" | "active" | "pending" |  "";
};

export type DeleteInactiveChatsResponse = {
  message: string;
  deleteCount?: number;
};

export type CancelChatResponse = {
  message: string;
  status: "closed";
};

export type AcceptChatResponse = {
  success: boolean;
  message: string;
  status: "active" | "pending" ;
};

export async function sendChatRequest(params?: {
  patientId: string;
  counselorId: string;
  appointmentDate: string;
}): Promise<SendChatRequestResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      patientId: params?.patientId,
      counselorId: params?.counselorId,
      appointmentDate: params?.appointmentDate,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to send chat request");
  }

  return res.json();
}

export async function deleteExpired(
  params?: { chatId: string }
): Promise<DeleteExpiredChatsResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/cleanup/expired/${params?.chatId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to delete expired chat");
  }

  return res.json();
}

export async function deleteInactiveChats(
  params?: { userId: string }
): Promise<DeleteInactiveChatsResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/cleanup/inactive/${params?.userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to delete inactive chats");
  }

  return res.json();
}

export async function cancelRequest(
  params?: { chatId: string }
): Promise<CancelChatResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/cancel/${params?.chatId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to cancel request");
  }

  return res.json();
}

export async function acceptRequest(
  params?: { chatId: string }
): Promise<AcceptChatResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/accept/${params?.chatId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to accept request");
  }

  return res.json();
}

export async function getAllChatRequests(): Promise<GetChatResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}/chat/get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.message || "Failed to get chat requests");
  }

  return res.json();
}
