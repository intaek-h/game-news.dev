export interface OpenVerseToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface OpenVerseImages {
  result_count: number;
  page_count: number;
  page_size: number;
  page: number;
  results: OpenVerseImage[];
}

export interface OpenVerseImage {
  id: string;
  title: string;
  indexed_on: string;
  foreign_landing_url: string;
  url: string;
  creator: string;
  creator_url: string | null;
  license: string;
  license_version: string;
  license_url: string;
  provider: string;
  source: string;
  category: string | null;
  filesize: number | null;
  filetype: string;
  tags: OpenVerseTag[];
  attribution: string;
  fields_matched: string[];
  mature: boolean;
  height: number;
  width: number;
  thumbnail: string;
  detail_url: string;
  related_url: string;
  unstable__sensitivity: any[];
}

export interface OpenVerseTag {
  name: string;
  accuracy: number | null;
  unstable__provider: string;
}
