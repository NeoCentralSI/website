import { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { validateFieldAssessmentToken } from '@/services/internship/public.service';
import { Loading } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FieldAssessmentPortal() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const pin = sessionStorage.getItem(`field_assessment_pin_${token}`);

    const fetchData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await validateFieldAssessmentToken(token, pin || undefined);
            setData(res.data);
            
            // If pin is valid but we are on the login page, redirect to dashboard/logbook
            if (res.data.isVerified && location.pathname === `/field-assessment/${token}`) {
                navigate(`/field-assessment/${token}/logbook`, { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Gagal memverifikasi token.");
            if (err.response?.status === 410) {
                // Token expired or used
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, pin]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loading size="lg" text="Memverifikasi akses..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold text-slate-900">Akses Tidak Tersedia</h1>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">{error}</p>
                    </div>
                    <Button 
                        variant="outline"
                        onClick={() => navigate('/')}
                        className="w-full font-semibold"
                    >
                        Kembali ke Beranda
                    </Button>
                </div>
            </div>
        );
    }

    return <Outlet context={{ data, token, refetch: fetchData }} />;
}
