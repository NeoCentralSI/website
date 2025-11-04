import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/lottie/empty.json';
import { Button } from './button';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonIcon?: ReactNode;
}

export default function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada data untuk ditampilkan',
  className = '',
  size = 'md',
  showButton = false,
  buttonText = 'Muat Ulang',
  onButtonClick,
  buttonIcon,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Lottie
        animationData={emptyAnimation}
        loop={true}
        className={sizeClasses[size]}
      />
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {description}
      </p>
      {showButton && onButtonClick && (
        <Button 
          onClick={onButtonClick}
          className="mt-6"
          variant="default"
        >
          {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
          {buttonText}
        </Button>
      )}
    </div>
  );
}
