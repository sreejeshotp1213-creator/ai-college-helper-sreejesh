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

