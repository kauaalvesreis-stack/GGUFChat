// Powered by OnSpace.AI
export interface HFModel {
  id: string;
  modelId: string;
  pipeline_tag?: string;
  likes: number;
  downloads: number;
  tags: string[];
  lastModified: string;
  siblings?: HFFile[];
}

export interface HFFile {
  rfilename: string;
  size?: number;
  blobId?: string;
}

export interface HFDownloadProgress {
  loaded: number;
  total: number;
  percent: number;
  speed: number; // bytes/sec
  eta: number;   // seconds
}

export async function searchHFModels(query: string, limit = 20): Promise<HFModel[]> {
  try {
    const url = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&sort=downloads&direction=-1&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: HFModel[] = await res.json();
    return data;
  } catch {
    return [];
  }
}

export async function getModelFiles(modelId: string): Promise<HFFile[]> {
  try {
    const url = `https://huggingface.co/api/models/${modelId}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const siblings: HFFile[] = data?.siblings ?? [];
    return siblings.filter((f) => f.rfilename.endsWith('.gguf'));
  } catch {
    return [];
  }
}

export function getDownloadUrl(modelId: string, filename: string): string {
  return `https://huggingface.co/${modelId}/resolve/main/${encodeURIComponent(filename)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDownloads(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
