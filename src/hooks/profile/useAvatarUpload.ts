import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadAvatarAPI, deleteAvatarAPI } from '@/services/profile.service';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useAvatarUpload() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadAvatarAPI,
    onSuccess: () => {
      toast.success('Foto profil berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      // Clear blob cache so sidebar picks up new avatar
      queryClient.invalidateQueries({ queryKey: ['avatar-blob'] });
      setPreview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengunggah foto profil');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvatarAPI,
    onSuccess: () => {
      toast.success('Foto profil berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-blob'] });
      setPreview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus foto profil');
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format file harus JPG, PNG, atau WebP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Ukuran file maksimal 5MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadMutation]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    fileInputRef,
    preview,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleFileSelect,
    triggerFileSelect,
    handleDelete,
  };
}
