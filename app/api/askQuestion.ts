import { apiClient } from "@/lib/api-client";

export interface AskQuestionRequest {
  question: string;
  session_id?: string;
}

export interface AskQuestionResponse {
  success: boolean;
  question: string;
  session_id?: string;
  generated_sql?: string;
  data?: any[];
  columns?: string[];
  row_count?: number;
  execution_time_ms?: number;
  examples_used?: number;
  warnings?: string[];
  suggestions?: string[];
  error?: string;
}

export async function askQuestion(request: AskQuestionRequest): Promise<AskQuestionResponse> {
  try {
    const response = await apiClient.post<AskQuestionResponse>('/ask', request);
    return response;
  } catch (error) {
    console.error('Error asking question:', error);
    return {
      success: false,
      question: request.question,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
