import { Camera, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/shared';
import { useAvatarUpload, useAvatarBlob } from '@/hooks/profile';
import { toTitleCaseName } from '@/lib/text';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function AvatarUpload() {
  const { user } = useAuth();
  const {
    fileInputRef,
    preview,
    isUploading,
    isDeleting,
    handleFileSelect,
    triggerFileSelect,
    handleDelete,
  } = useAvatarUpload();

  const avatarBlobUrl = useAvatarBlob(user?.avatarUrl);
  const displaySrc = preview || avatarBlobUrl;

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <Avatar className="h-28 w-28 ring-4 ring-gray-100 shadow-md">
          <AvatarImage src={displaySrc} alt={user?.fullName || 'Avatar'} />
          <AvatarFallback className="text-3xl font-bold bg-gray-100 text-gray-600">
            {getInitials(user?.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Hover overlay for upload */}
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-wait"
        >
          {isUploading ? (
            <Spinner className="h-6 w-6 text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>

        {/* Camera badge */}
        <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-gray-700 border-2 border-white flex items-center justify-center shadow-sm">
          <Camera className="h-3.5 w-3.5 text-white" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <h2 className="mt-3 text-lg font-bold text-gray-900 text-center leading-tight">
        {toTitleCaseName(user?.fullName)}
      </h2>
      <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

      {user?.avatarUrl && !isUploading && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="mt-1 text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs px-3"
        >
          {isDeleting ? (
            <>
              <Spinner className="mr-1 h-3 w-3" />
              Menghapus...
            </>
          ) : (
            <>
              <Trash2 className="mr-1 h-3 w-3" />
              Hapus Foto
            </>
          )}
        </Button>
      )}
    </div>
  );
}
