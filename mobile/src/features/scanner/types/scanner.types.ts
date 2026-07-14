export interface ScannedDocument {
  uri: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size?: number;
  source: 'camera' | 'gallery';
}
