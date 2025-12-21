import { useState } from 'react';
import { toast } from 'sonner';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';
import { createUserAPI, updateUserAPI } from '@/services/admin.service';

export const useUserForm = (onSuccess: () => void) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest | UpdateUserRequest>({
    fullName: '',
    email: '',
    roles: [],
    identityNumber: '',
    identityType: 'NIM',
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        roles: user.roles.map(r => r.name),
        identityNumber: user.identityNumber,
        identityType: user.identityType,
        isVerified: user.isVerified,
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        roles: [],
        identityNumber: '',
        identityType: 'NIM',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingUser) {
        await updateUserAPI(editingUser.id, formData as UpdateUserRequest);
        toast.success('User berhasil diupdate');
      } else {
        await createUserAPI(formData as CreateUserRequest);
        toast.success('User berhasil dibuat');
      }
      
      setDialogOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    dialogOpen,
    setDialogOpen,
    editingUser,
    formData,
    setFormData,
    isSubmitting,
    handleOpenDialog,
    handleSubmit,
  };
};
