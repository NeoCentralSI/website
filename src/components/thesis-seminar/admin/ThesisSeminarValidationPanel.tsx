import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { AdminSeminarTable } from '@/components/seminar/AdminSeminarTable'
import { ValidationModal } from '@/components/seminar/ValidationModal'
import type { AdminSeminarListItem } from '@/types/seminar.types'

export function ThesisSeminarValidationPanel() {
	const { setBreadcrumbs } = useOutletContext<LayoutContext>()
	const [selectedSeminar, setSelectedSeminar] = useState<AdminSeminarListItem | null>(null)
	const [validationOpen, setValidationOpen] = useState(false)

	useEffect(() => {
		setBreadcrumbs([
			{ label: 'Tugas Akhir' },
			{ label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil/validasi' },
			{ label: 'Validasi' },
		])
	}, [setBreadcrumbs])

	const handleValidate = (seminar: AdminSeminarListItem) => {
		setSelectedSeminar(seminar)
		setValidationOpen(true)
	}

	return (
		<div className="space-y-4">


			<AdminSeminarTable onValidate={handleValidate} />

			<ValidationModal
				seminar={selectedSeminar}
				open={validationOpen}
				onOpenChange={setValidationOpen}
			/>
		</div>
	)
}
