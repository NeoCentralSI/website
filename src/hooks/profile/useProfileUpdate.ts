import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/shared';
import { updateProfileAPI } from '@/services/auth.service';
import { toast } from 'sonner';

interface ProfileFormData {
  phoneNumber: string;
}

export const useProfileUpdate = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    phoneNumber: '',
  });
  const [error, setError] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.phoneNumber) {
      setError('Nomor telepon harus diisi');
      return;
    }

    if (!/^[0-9+\-() ]+$/.test(formData.phoneNumber)) {
      setError('Format nomor telepon tidak valid');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileAPI({ phoneNumber: formData.phoneNumber });
      toast.success('Profil berhasil diperbarui');
      await refreshUser();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memperbarui profil');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    updateField,
    error,
    setError,
    isSaving,
    handleSubmit,
    isProfileIncomplete: !user?.phoneNumber,
  };
};
