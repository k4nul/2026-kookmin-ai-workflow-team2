import type { ChatMessage } from "./dto.js";

export type OllamaChatOptions = {
  temperature?: number;
  top_p?: number;
  num_predict?: number;
};

export type OllamaChatRequest = {
  model: string;
  messages: ChatMessage[];
  stream: false;
  keep_alive?: string;
  options?: OllamaChatOptions;
  format?: "json";
};

export type OllamaChatResponse = {
  model?: string;
  created_at?: string;
  message?: {
    role: string;
    content: string;
  };
  done?: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

export type OllamaModelEntry = {
  name?: string;
  model?: string;
};

export type OllamaTagsResponse = {
  models?: OllamaModelEntry[];
};

export type OllamaRunningModelsResponse = {
  models?: OllamaModelEntry[];
};

export type OllamaVersionResponse = {
  version?: string;
};
