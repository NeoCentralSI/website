import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export function PendingApprovalCard({ status }: { status: string }) {
    return (
        <Card className="w-full border-yellow-200 bg-yellow-50 mb-6">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-yellow-800">Menunggu Persetujuan</CardTitle>
                            <CardDescription className="text-yellow-700">Proposal Anda sedang ditinjau</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                        {status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-yellow-800">
                    Judul Tugas Akhir Anda telah diajukan dan sedang menunggu persetujuan dari Dosen Pembimbing.
                    Silakan cek kembali secara berkala.
                </p>
            </CardContent>
        </Card>
    );
}
