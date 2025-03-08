// Define the structure for a single post
interface Post {
  created_utc: number;
  id: string;
  num_comments: number;
  score: number;
  title: string;
  url: string;
}

// Define the structure for the posts object, which is a dictionary of arrays of Post
interface Posts {
  [subreddit: string]: Post[];
}

// Define the structure for the topics object, which is a dictionary of arrays of strings
interface Topics {
  [subreddit: string]: string[];
}

// Define the structure for the parameters
interface Params {
  limit: number;
  min_score: number;
  subreddits: string[];
  time_window: number;
}

// Define the main structure for the entire data
export interface RedditScrapingResult {
  params: Params;
  posts: Posts;
  topics: Topics;
  total_count: number;
}
