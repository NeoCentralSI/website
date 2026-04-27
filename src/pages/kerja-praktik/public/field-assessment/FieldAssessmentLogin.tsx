import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { verifyFieldAssessmentPin } from '@/services/internship/public.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label'
import logo from '@/assets/images/neocentral-logo.png';

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
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
            <Card className="w-full max-w-md shadow-lg border-slate-200 rounded-xl overflow-hidden bg-white">
                <CardHeader className="text-center pt-10 pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                <img src={logo} alt="Logo" className="h-10 w-10" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-100">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <CardTitle className="text-2xl font-bold text-slate-900">Portal Pembimbing</CardTitle>
                        <CardDescription className="font-medium text-slate-500 text-sm px-6">
                            Masukkan 6 digit PIN dari email Anda untuk mengakses data penilaian mahasiswa.
                        </CardDescription>
                    </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-10">
                    {data?.internship && (
                        <div className="mb-8 p-4 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col items-center text-center">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Mahasiswa Terkait</p>
                            <p className="text-base font-bold text-slate-800">{data.internship.studentName}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">NIM {data.internship.studentNim}</p>
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">PIN Keamanan</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="pin"
                                    type="password"
                                    maxLength={6}
                                    placeholder="Masukkan 6 Digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="h-14 pl-12 rounded-lg bg-white border-slate-200 text-center text-xl font-bold tracking-[0.5em] focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                                    autoComplete="off"
                                    autoFocus
                                />
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={loading || pin.length !== 6}
                            className="w-full h-12 rounded-lg font-bold shadow-sm gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Buka Akses Portal
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                
                <div className="bg-slate-50 py-4 text-center border-t border-slate-200/60">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">NeoCentral &bull; Departemen Sistem Informasi</p>
                </div>
            </Card>
        </div>
    );
}
