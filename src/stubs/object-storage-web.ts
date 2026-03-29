// Stub replacement for @workspace/object-storage-web (removed Replit dependency)
import { useState } from "react";

interface UseUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  uploadFile: (file: File) => Promise<string | null>;
  isUploading: boolean;
  progress: number;
}

export function useUpload(options: UseUploadOptions = {}): UploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/trainingDocs?path=upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const url = data.url as string;
      setProgress(100);
      options.onSuccess?.(url);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      options.onError?.(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress };
}
