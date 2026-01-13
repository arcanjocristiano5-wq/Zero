
export enum AIProviderType {
  CLOUD = 'Cloud',
  LOCAL = 'Local'
}

export enum Platform {
  WEB = 'Web (React/Next.js)',
  ANDROID = 'Android (Kotlin/React Native)',
  IOS = 'iOS (Swift/React Native)',
  WINDOWS = 'Windows (C#/.NET)',
  LINUX = 'Linux (Python/C++)',
  MACOS = 'macOS (Swift)'
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

export interface LocalAIInstance {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  temperature: number;
  cpuLimit: number;
  ramLimit: number;
  contextWindow: number;
}

export interface CloudAIInstance {
  id: string;
  name: string;
  provider: 'Gemini' | 'Other';
  model: string;
  apiKey: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  structure: FileNode[];
  lastSaved: number;
  config: {
    targetPlatform: Platform;
    language: string;
    localAIEngine: {
      status: 'idle' | 'downloading' | 'installed';
      downloadProgress?: number;
    };
    localAIProviders: LocalAIInstance[];
    cloudAIProviders: CloudAIInstance[];
    activeAIProviderId: string | null;
  };
}

export interface AIStatus {
  isLocalReady: boolean;
  localModel: string;
  usage: {
    cpu: number;
    ram: number;
  };
}
