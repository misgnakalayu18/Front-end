// hooks/useFileUpload.ts
import { useState, useCallback } from 'react';

interface UseFileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useFileUpload = (uploadMutation: any, options?: UseFileUploadOptions) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!file) {
      options?.onError?.('No file selected');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for large files
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(interval);
            return 90;
          }
          return newProgress;
        });
      }, 500);

      // Call the mutation
      const result = await uploadMutation(formData).unwrap();
      
      clearInterval(interval);
      setProgress(100);
      
      options?.onSuccess?.(result);
      return result;
      
    } catch (error: any) {
      options?.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [uploadMutation, options]);

  return {
    uploadFile,
    progress,
    isUploading,
    resetProgress: () => setProgress(0),
  };
};