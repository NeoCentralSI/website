import { useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import { FileText } from 'lucide-react';
import { ProposalVerificationPanel } from '@/components/internship/sekdep/ProposalVerificationPanel';
import { InternshipListPanel } from '@/components/internship/sekdep/InternshipListPanel';
import { LecturerWorkloadPanel } from '@/components/internship/sekdep/LecturerWorkloadPanel';
import { GuidanceMasterPanel } from '@/components/internship/sekdep/GuidanceMasterPanel';
import { InternshipCpmkPanel } from '@/components/internship/sekdep/InternshipCpmkPanel';

const TAB_ITEMS: TabItem[] = [
    { label: "Verifikasi Proposal", to: "/kelola/kerja-praktik/pendaftaran/proposal" },

    { label: "Daftar Mahasiswa", to: "/kelola/kerja-praktik/pendaftaran/mahasiswa" },
    { label: "Daftar Dosen", to: "/kelola/kerja-praktik/pendaftaran/dosen" },
    { label: "Bimbingan", to: "/kelola/kerja-praktik/pendaftaran/bimbingan" },
    { label: "CPMK", to: "/kelola/kerja-praktik/pendaftaran/cpmk" },
];

export default function SekdepInternshipProposalPage() {
    const { pathname } = useLocation();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const activeTab = useMemo(() =>
        TAB_ITEMS.find((tab) => pathname.startsWith(tab.to)) || TAB_ITEMS[0]
        , [pathname]);

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Pendaftaran', href: '/kelola/kerja-praktik/pendaftaran' },
        { label: activeTab.label }
    ], [activeTab.label]);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Pendaftaran Kerja Praktik');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const renderContent = () => {
        if (activeTab.label === "Verifikasi Proposal") {
            return <ProposalVerificationPanel />;
        }



        if (activeTab.label === "Daftar Mahasiswa") {
            return <InternshipListPanel />;
        }

        if (activeTab.label === "Daftar Dosen") {
            return <LecturerWorkloadPanel />;
        }

        if (activeTab.label === "Bimbingan") {
            return <GuidanceMasterPanel />;
        }

        if (activeTab.label === "CPMK") {
            return <InternshipCpmkPanel />;
        }

        return null;
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 text-2xl font-semibold">
                <FileText className="h-6 w-6 text-primary" />
                <h1>Pendaftaran Kerja Praktik</h1>
            </div>

            <TabsNav tabs={TAB_ITEMS} />

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
}
