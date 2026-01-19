
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

export interface CloudAIInstance {
  id:string;
  name: string;
  provider: 'Gemini' | 'Other';
  model: string;
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
    cloudAIProviders: CloudAIInstance[];
    activeAIProviderId: string | null;
  };
}
