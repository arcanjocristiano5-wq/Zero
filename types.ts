
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
  gitStatus?: 'M' | 'A';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  fileSnapshots: { path: string; content: string; status: 'A' | 'M' }[];
}

export interface Deployment {
  id: string;
  commitId: string;
  timestamp: number;
  status: 'Success' | 'Failed' | 'In Progress';
  url: string;
}

export interface CloudAIInstance {
  id:string;
  name: string;
  provider: 'Gemini' | 'Other';
  model: string;
}

export type AIEngine = 'cloud' | 'local';

export interface LocalAIInstance {
  id: string;
  name: string;
  engine: string;
  status: 'downloaded' | 'not_downloaded' | 'downloading';
  compatibility: 'compatible' | 'incompatible' | 'unknown';
}

export interface HelperAIInstance {
  id: string;
  name: string;
  description: string;
  task: 'Code Optimization' | 'Security Scan' | 'UI/UX Feedback' | 'Database Design';
  status: 'downloaded' | 'not_downloaded' | 'downloading';
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  structure: FileNode[];
  lastSaved: number;
  commitHistory: Commit[];
  deploymentHistory: Deployment[];
  branches: { [key: string]: string | null }; // Branch name -> commit ID
  currentBranch: string;
  config: {
    targetPlatform: Platform;
    language: string;
    cloudAIProviders: CloudAIInstance[];
    activeAIProviderId: string | null;
    aiEngine: AIEngine;
    localAIProviders: LocalAIInstance[];
    activeLocalAIProviderId: string | null;
    helperAIs: HelperAIInstance[];
  };
}