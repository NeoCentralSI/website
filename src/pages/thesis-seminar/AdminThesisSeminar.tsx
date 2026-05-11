import { useEffect, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { LocalTabsNav } from '@/components/ui/tabs-nav'
import { AdminThesisSeminarVerificationPanel } from '@/components/thesis-seminar/AdminThesisSeminarVerificationPanel'
import { AdminThesisSeminarArchivePanel } from '@/components/thesis-seminar/AdminThesisSeminarArchivePanel'

export default function AdminThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const [searchParams, setSearchParams] = useSearchParams()
	const activeTab = searchParams.get('tab') || 'verifikasi'

	const setActiveTab = (tab: string) => {
		setSearchParams({ tab }, { replace: true })
	}

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
			{ label: activeTab === 'arsip' ? 'Arsip' : 'Verifikasi' },
		],
		[activeTab]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil')
	}, [breadcrumbs, setBreadcrumbs, setTitle])

	const tabs = [
		{ label: 'Verifikasi', value: 'verifikasi' },
		{ label: 'Arsip', value: 'arsip' },
	]

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Administrasi Seminar Hasil</h1>
				<p className="text-muted-foreground">Verifikasi berkas pendaftaran mahasiswa dan manajemen arsip seminar hasil</p>
			</div>

			<LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

			{activeTab === 'verifikasi' && <AdminThesisSeminarVerificationPanel />}
			{activeTab === 'arsip' && <AdminThesisSeminarArchivePanel />}
		</div>
	)
}
