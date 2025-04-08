export interface HighlightResultField {
  value: string;
  matchLevel: string;
  matchedWords: string[];
}

export interface HighlightResult {
  title: HighlightResultField;
  subtitle: HighlightResultField;
  type: HighlightResultField;
  location: HighlightResultField;
  price: HighlightResultField;
  age_restriction: HighlightResultField;
  presented_by: HighlightResultField;
}

export interface AlgoliaHit {
  slug: string;
  is_featured: string;
  is_cancelled: string;
  is_past: string;
  is_beergarden: string;
  title: string;
  subtitle: string;
  type: string;
  date_title: string;
  date_filter_string: string;
  start_time: string;
  start_timestamp: string;
  entry_time: string;
  location: string;
  price: string;
  presale: string;
  age_restriction: string;
  presented_by: string;
  calendar_file_url: string;
  objectID: string;
  _highlightResult: HighlightResult;
}

export interface AlgoliaResult {
  hits: AlgoliaHit[];
}

export interface AlgoliaResponse {
  results: AlgoliaResult[];
}

export interface ZBauEventDetailResponse {
  html: {
    content: string;
  };
}
