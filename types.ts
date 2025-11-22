export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptItem {
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
}

export interface ResourceItem {
  title: string;
  description: string;
  link?: string;
  icon: string;
}
