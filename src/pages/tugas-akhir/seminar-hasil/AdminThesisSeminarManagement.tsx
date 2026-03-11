import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { AdminSeminarTable } from '@/components/seminar/AdminSeminarTable'
import { ValidationModal } from '@/components/seminar/ValidationModal'
import type { AdminSeminarListItem } from '@/types/seminar.types'

export default function AdminThesisSeminarManagement() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()
	const [selectedSeminar, setSelectedSeminar] = useState<AdminSeminarListItem | null>(null)
	const [validationOpen, setValidationOpen] = useState(false)

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir' },
			{ label: 'Seminar Hasil' },
		],
		[]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil')
	}, [setBreadcrumbs, setTitle, breadcrumbs])

	const handleValidate = (seminar: AdminSeminarListItem) => {
		setSelectedSeminar(seminar)
		setValidationOpen(true)
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">Seminar Hasil</h1>
					<p className="text-gray-500">Validasi berkas dan manajemen seminar hasil mahasiswa</p>
				</div>
			</div>

			<AdminSeminarTable onValidate={handleValidate} />

			<ValidationModal
				seminar={selectedSeminar}
				open={validationOpen}
				onOpenChange={setValidationOpen}
			/>
		</div>
	)
}
