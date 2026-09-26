export type FeatureType = 'ask' | 'explain' | 'notes' | 'practice' | 'code';

export interface FeatureConfig {
  id: FeatureType;
  title: string;
  shortLabel: string;
  tagline: string;
  placeholder: string;
  buttonText: string;
  iconName: string;
  samplePrompt: string;
  examples: string[];
}

export interface HistoryItem {
  id: string;
  prompt: string;
  result: string;
  feature: FeatureType;
  timestamp: number;
}

export interface SubjectPreset {
  id: string;
  label: string;
  icon: string;
  sampleQuery: string;
  suggestedFeature: FeatureType;
}

export interface AssistResponse {
  result?: string;
  error?: string;
}

export interface AttachedImage {
  data: string; // base64 string
  mimeType: string;
  name: string;
  previewUrl: string;
}

export interface AttachedFile {
  data?: string; // base64 for binary/pdf
  text?: string; // plain text for code/txt
  mimeType: string;
  name: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feature?: FeatureType;
  image?: {
    previewUrl: string;
    name?: string;
  };
  file?: {
    name: string;
    size: number;
    mimeType: string;
  };
  timestamp: number;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

