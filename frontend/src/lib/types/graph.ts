export interface GraphNode {
  id: string;
  author: string;
  book: string;
  year: string;
  page: string | null;
  degree: number; // total connections in the loaded subgraph
  isOrigin: boolean;
  // Layout (populated by D3 force simulation)
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
  score: number; // 0–1
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type GraphDepth = 1 | 2 | 3;
