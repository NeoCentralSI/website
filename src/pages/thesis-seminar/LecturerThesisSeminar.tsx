import { useEffect, useMemo } from 'react'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { TabsNav } from '@/components/ui/tabs-nav'
import { useRole } from '@/hooks/shared/useRole'
import { LecturerThesisSeminarSupervisorPanel } from '@/components/thesis-seminar/LecturerThesisSeminarSupervisorPanel'
import { LecturerThesisSeminarExaminerPanel } from '@/components/thesis-seminar/LecturerThesisSeminarExaminerPanel'
import { LecturerThesisSeminarAssignExaminerPanel } from '@/components/thesis-seminar/LecturerThesisSeminarAssignExaminerPanel'

export default function LecturerThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const { isKadep } = useRole()
	const { pathname } = useLocation()
	const navigate = useNavigate()

	// Redirect to default tab if base lecturer path is visited
	useEffect(() => {
		if (
			pathname === '/tugas-akhir/seminar-hasil' ||
			pathname === '/tugas-akhir/seminar-hasil/'
		) {
			navigate('/tugas-akhir/seminar-hasil/mahasiswa-bimbingan', { replace: true })
		}
	}, [pathname, navigate])

	const activeLabel = useMemo(() => {
		if (pathname.includes('/mahasiswa-bimbingan')) return 'Mahasiswa Bimbingan'
		if (pathname.includes('/tetapkan-penguji')) return 'Tetapkan Penguji'
		if (pathname.includes('/menguji-mahasiswa')) return 'Menguji Mahasiswa'
		return 'Seminar Hasil'
	}, [pathname])

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
			{ label: activeLabel },
		],
		[activeLabel]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs);
		setTitle('Seminar Hasil');
	}, [setBreadcrumbs, setTitle, breadcrumbs])

	const tabs = useMemo(() => {
		const t = [
			{ label: 'Mahasiswa Bimbingan', to: '/tugas-akhir/seminar-hasil/mahasiswa-bimbingan' },
			{ label: 'Menguji Mahasiswa', to: '/tugas-akhir/seminar-hasil/menguji-mahasiswa' },
		]
		if (isKadep()) {
			t.push({ label: 'Tetapkan Penguji', to: '/tugas-akhir/seminar-hasil/tetapkan-penguji' })
		}
		return t
	}, [isKadep])

	const renderPanel = () => {
		if (pathname.includes('/mahasiswa-bimbingan')) {
			return <LecturerThesisSeminarSupervisorPanel />
		}
		if (pathname.includes('/tetapkan-penguji')) {
			return isKadep() ? <LecturerThesisSeminarAssignExaminerPanel /> : <LecturerThesisSeminarExaminerPanel />
		}
		if (pathname.includes('/menguji-mahasiswa')) {
			return <LecturerThesisSeminarExaminerPanel />
		}
		return null
	}

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Seminar Hasil</h1>
				<p className="text-gray-500">Pantau mahasiswa bimbingan, respon penugasan penguji, dan kelola penilaian seminar hasil</p>
			</div>

			<TabsNav tabs={tabs} />
			{renderPanel()}
		</div>
	)
}
