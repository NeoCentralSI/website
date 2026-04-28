import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { verifyFieldAssessmentPin } from '@/services/internship/public.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label'
import { LoginCarousel } from '@/components/auth/LoginCarousel';

export default function FieldAssessmentLogin() {
    const { token } = useParams<{ token: string }>();
    const { data, refetch } = useOutletContext<any>();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 6) {
            toast.error("PIN harus terdiri dari 6 digit.");
            return;
        }

        try {
            setLoading(true);
            await verifyFieldAssessmentPin(token!, pin);
            sessionStorage.setItem(`field_assessment_pin_${token}`, pin);
            toast.success("Akses berhasil diberikan.");
            refetch();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "PIN yang Anda masukkan salah.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 bg-white overflow-hidden">
            <LoginCarousel />

            <div className="flex items-center justify-center py-12 px-8 bg-white overflow-y-auto">
                <div className="mx-auto grid w-full max-w-[400px] gap-10">
                    <div className="grid gap-3 text-center">
                        <div className="flex justify-center mb-4">
                             <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Portal Pembimbing</h1>
                        <p className="text-gray-500 font-body text-base">
                            Masukkan 6 digit PIN keamanan untuk mengakses data penilaian mahasiswa.
                        </p>
                    </div>

                    {data?.internship && (
                        <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30 text-center transition-colors hover:bg-gray-50/60">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Mahasiswa Terkait</p>
                            <p className="text-xl font-display font-bold text-gray-900">{data.internship.studentName}</p>
                            <p className="text-sm font-medium text-gray-500 mt-1">NIM {data.internship.studentNim}</p>
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="grid gap-8">
                        <div className="grid gap-3">
                            <Label htmlFor="pin" className="text-sm font-semibold text-gray-700 ml-1">PIN Keamanan</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="pin"
                                    type="password"
                                    maxLength={6}
                                    placeholder="••••••"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="h-14 pl-12 rounded-xl border-gray-200 text-center text-2xl font-bold tracking-[0.6em] focus:border-primary focus:ring-primary shadow-none transition-all placeholder:tracking-normal placeholder:text-gray-300"
                                    autoComplete="off"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading || pin.length !== 6}
                            className="w-full h-14 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 text-white transition-all shadow-none active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Memverifikasi...</span>
                                </div>
                            ) : (
                                "Buka Akses Portal"
                            )}
                        </Button>
                    </form>

                    <div className="text-center pt-4">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                            NeoCentral &bull; Departemen Sistem Informasi
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


