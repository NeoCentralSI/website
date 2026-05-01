import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { LocalTabsNav } from '@/components/ui/tabs-nav'
import { AdminThesisSeminarValidationPanel } from '@/components/thesis-seminar/AdminThesisSeminarValidationPanel'
import { AdminThesisSeminarArchivePanel } from '@/components/thesis-seminar/AdminThesisSeminarArchivePanel'

export default function AdminThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const [activeTab, setActiveTab] = useState('validation');

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
			{ label: activeTab === 'archive' ? 'Arsip' : 'Validasi' },
		],
		[activeTab]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil')
	}, [breadcrumbs, setBreadcrumbs, setTitle])

	const tabs = [
		{ label: 'Validasi', value: 'validation' },
		{ label: 'Arsip', value: 'archive' },
	]

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Administrasi Seminar Hasil</h1>
				<p className="text-muted-foreground">Validasi berkas pendaftaran mahasiswa dan manajemen arsip seminar hasil</p>
			</div>

			<LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

			{activeTab === 'validation' && <AdminThesisSeminarValidationPanel />}
			{activeTab === 'archive' && <AdminThesisSeminarArchivePanel />}
		</div>
	)
}
