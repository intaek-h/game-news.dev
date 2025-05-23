export interface ArticleFormat {
  title: string;
  key_points: string[];
  table: {
    header: string[];
    rows: string[][];
  };
}

export interface ArticleEntities {
  companies: string[];
  people: string[];
  products: string[];
}

export interface DeveloperArticleCandidate {
  title: string;
  link: string;
  createdAt: string;
  isSelected: boolean;
}
