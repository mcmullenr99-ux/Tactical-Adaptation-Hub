// Stub for @workspace/object-storage-web
export function useUpload() {
  return {
    upload: async (_file: File) => ({ url: null }),
    uploading: false,
    error: null,
  };
}
