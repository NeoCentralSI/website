import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { TabsNav } from '@/components/ui/tabs-nav'
import { AdminThesisSeminarValidationPanel } from '@/components/thesis-seminar/AdminThesisSeminarValidationPanel'
import { AdminThesisSeminarArchivePanel } from '@/components/thesis-seminar/AdminThesisSeminarArchivePanel'

export default function AdminThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const navigate = useNavigate()
	const location = useLocation()
	const activeTab = location.pathname.includes('/arsip') ? 'archive' : 'validation'

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil/validasi' },
			{ label: activeTab === 'archive' ? 'Arsip' : 'Validasi' },
		],
		[activeTab]
	)

	useEffect(() => {
		if (
			location.pathname === '/tugas-akhir/seminar-hasil' ||
			location.pathname === '/tugas-akhir/seminar-hasil/'
		) {
			navigate('/tugas-akhir/seminar-hasil/validasi', { replace: true })
		}
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil')
	}, [breadcrumbs, location.pathname, navigate, setBreadcrumbs, setTitle])

	const tabs = [
		{ label: 'Validasi', to: '/tugas-akhir/seminar-hasil/validasi' },
		{ label: 'Arsip', to: '/tugas-akhir/seminar-hasil/arsip' },
	]

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Administrasi Seminar Hasil</h1>
				<p className="text-gray-500">Validasi berkas pendaftaran mahasiswa dan manajemen arsip seminar hasil</p>
			</div>

			<TabsNav tabs={tabs} />

			{activeTab === 'validation' && <AdminThesisSeminarValidationPanel />}
			{activeTab === 'archive' && <AdminThesisSeminarArchivePanel />}
		</div>
	)
}
