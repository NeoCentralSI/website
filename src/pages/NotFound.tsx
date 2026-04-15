import { useNavigate } from 'react-router-dom';
import NotFound from '@/components/ui/not-found';
import { NotFoundSeo } from '@/components/seo';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <NotFoundSeo />
      <NotFound
        onPrimaryClick={() => navigate('/dashboard')}
        onSecondaryClick={() => navigate(-1)}
      />
    </div>
  );
}
