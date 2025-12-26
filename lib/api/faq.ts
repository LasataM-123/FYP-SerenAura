import { useAuthStore } from "@/store/authStore";
import { API_URL } from '@/config';
export type CreateSupportQuestionResponse = {
  message: string;
  success: boolean;
  data: {
    _id: string;
    question: string;
    askedBy: string;
    isAnswered: boolean;
    answer?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export type TopQuestion = {
  _id: string;
  question: string;
  answer: string;
  count: number;
}

export type GetTopQuestionsResponse = {
  total: number;
  data: TopQuestion[];
}

export async function createSupportQuestion(params?: { question: string }): Promise<CreateSupportQuestionResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/faq/create-question`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
         "Authorization": `Bearer ${accessToken}`

     },
     body: JSON.stringify(params),
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Post request failed")
        }
    return res.json();
}
export async function getTopQuestions(): Promise<GetTopQuestionsResponse> {
    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/faq/get-questions`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
         "Authorization": `Bearer ${accessToken}`

     },
    });
        if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.message || "Get request failed")
        }
    return res.json();
}
