import Lottie from 'lottie-react';
import notFoundAnimation from '@/assets/lottie/404.json';
import { Button } from './button';
import type { ReactNode } from 'react';

interface NotFoundProps {
  title?: string;
  description?: string;
  showButtons?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryButtonIcon?: ReactNode;
  secondaryButtonIcon?: ReactNode;
}

export default function NotFound({
  title = 'Halaman Tidak Ditemukan',
  description = 'Maaf, halaman yang Anda cari tidak dapat ditemukan.',
  showButtons = true,
  primaryButtonText = 'Ke Dashboard',
  secondaryButtonText = 'Kembali',
  onPrimaryClick,
  onSecondaryClick,
  primaryButtonIcon,
  secondaryButtonIcon,
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Lottie
        animationData={notFoundAnimation}
        loop={true}
        className="w-64 h-64 md:w-80 md:h-80"
      />
      <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400 text-center max-w-md">
        {description}
      </p>
      {showButtons && (onPrimaryClick || onSecondaryClick) && (
        <div className="mt-6 flex gap-4">
          {onSecondaryClick && (
            <Button onClick={onSecondaryClick} variant="outline">
              {secondaryButtonIcon && <span className="mr-2">{secondaryButtonIcon}</span>}
              {secondaryButtonText}
            </Button>
          )}
          {onPrimaryClick && (
            <Button onClick={onPrimaryClick}>
              {primaryButtonIcon && <span className="mr-2">{primaryButtonIcon}</span>}
              {primaryButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
