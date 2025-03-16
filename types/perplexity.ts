export type PerplexityResponse = {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    citation_tokens: number;
    num_search_queries: number;
  };
  citations: string[];
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
};
