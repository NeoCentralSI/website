import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { LocalTabsNav } from '@/components/ui/tabs-nav'
import { useRole } from '@/hooks/shared/useRole'
import { LecturerThesisSeminarSupervisorPanel } from '@/components/thesis-seminar/LecturerThesisSeminarSupervisorPanel'
import { LecturerThesisSeminarExaminerPanel } from '@/components/thesis-seminar/LecturerThesisSeminarExaminerPanel'
import { LecturerThesisSeminarAssignExaminerPanel } from '@/components/thesis-seminar/LecturerThesisSeminarAssignExaminerPanel'

export default function LecturerThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const { isKadep } = useRole()
	const [activeTab, setActiveTab] = useState('mahasiswa-bimbingan');

	const activeLabel = useMemo(() => {
		if (activeTab === 'mahasiswa-bimbingan') return 'Mahasiswa Bimbingan'
		if (activeTab === 'tetapkan-penguji') return 'Tetapkan Penguji'
		if (activeTab === 'menguji-mahasiswa') return 'Menguji Mahasiswa'
		return 'Seminar Hasil'
	}, [activeTab])

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
			{ label: 'Mahasiswa Bimbingan', value: 'mahasiswa-bimbingan' },
			{ label: 'Menguji Mahasiswa', value: 'menguji-mahasiswa' },
		]
		if (isKadep()) {
			t.push({ label: 'Tetapkan Penguji', value: 'tetapkan-penguji' })
		}
		return t
	}, [isKadep])

	const renderPanel = () => {
		if (activeTab === 'mahasiswa-bimbingan') {
			return <LecturerThesisSeminarSupervisorPanel />
		}
		if (activeTab === 'tetapkan-penguji') {
			return isKadep() ? <LecturerThesisSeminarAssignExaminerPanel /> : <LecturerThesisSeminarExaminerPanel />
		}
		if (activeTab === 'menguji-mahasiswa') {
			return <LecturerThesisSeminarExaminerPanel />
		}
		return null
	}

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Seminar Hasil</h1>
				<p className="text-muted-foreground">Pantau mahasiswa bimbingan, respon penugasan penguji, dan kelola penilaian seminar hasil</p>
			</div>

			<LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
			{renderPanel()}
		</div>
	)
}
