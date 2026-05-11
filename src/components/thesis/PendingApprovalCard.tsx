import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Hourglass } from "lucide-react";

interface PendingApprovalCardProps {
    status: string;
}

export function PendingApprovalCard({ status }: PendingApprovalCardProps) {
    return (
        <Card className="w-full border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                            <Hourglass className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-amber-700 dark:text-amber-300">
                                Menunggu Persetujuan
                            </CardTitle>
                            <CardDescription>
                                Proposal tugas akhir Anda sedang ditinjau
                            </CardDescription>
                        </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                        {status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                        Proposal tugas akhir Anda telah diajukan dan sedang menunggu persetujuan dari dosen pembimbing atau koordinator. Anda akan mendapat notifikasi ketika status berubah.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
