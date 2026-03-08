import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LecturerYudisiumDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumbs = useMemo(
        () => [
            { label: 'Yudisium', href: '/yudisium' },
            { label: 'Detail Periode' },
        ],
        [],
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Detail Yudisium');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Detail Yudisium</h1>
                    <p className="text-muted-foreground text-sm">Halaman detail sementara untuk periode yudisium.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/yudisium/lecturer/event')}>
                    Kembali
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>ID Yudisium: {id}</p>
                    <p>Konten detail lengkap akan diimplementasikan pada iterasi berikutnya.</p>
                </CardContent>
            </Card>
        </div>
    );
}
