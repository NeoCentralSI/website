import { useNavigate } from 'react-router-dom';
import NotFound from '@/components/ui/not-found';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <NotFound 
        onPrimaryClick={() => navigate('/dashboard')}
        onSecondaryClick={() => navigate(-1)}
      />
    </div>
  );
}
