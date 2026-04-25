import { useEffect, useMemo } from 'react'
import { useOutletContext, useLocation, Navigate } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { TabsNav } from '@/components/ui/tabs-nav'
import { ThesisSeminarValidationPanel } from '@/components/thesis-seminar/admin/ThesisSeminarValidationPanel'
import { ThesisSeminarArchivePanel } from '@/components/thesis-seminar/admin/ThesisSeminarArchivePanel'

export default function AdminThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const location = useLocation()

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir' },
			{ label: 'Seminar Hasil' },
		],
		[]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle(undefined)
	}, [setBreadcrumbs, setTitle, breadcrumbs])

	const tabs = [
		{ label: 'Validasi', to: '/tugas-akhir/seminar-hasil/validasi', end: true },
		{ label: 'Arsip', to: '/tugas-akhir/seminar-hasil/arsip', end: true },
	]

	// Handle redirect from base URL to default tab
	if (location.pathname === '/tugas-akhir/seminar-hasil') {
		return <Navigate to="/tugas-akhir/seminar-hasil/validasi" replace />
	}

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Administrasi Seminar Hasil</h1>
				<p className="text-gray-500">Validasi berkas pendaftaran mahasiswa dan manajemen arsip seminar hasil</p>
			</div>

			<TabsNav tabs={tabs} />

			{location.pathname.includes('/validasi') && <ThesisSeminarValidationPanel />}
			{location.pathname.includes('/arsip') && <ThesisSeminarArchivePanel />}
		</div>
	)
}
