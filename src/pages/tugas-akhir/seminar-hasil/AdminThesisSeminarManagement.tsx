import { useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminThesisSeminarManagement() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil (Admin)' },
		],
		[]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil (Admin)')
	}, [setBreadcrumbs, setTitle, breadcrumbs])

	return (
		<Card>
			<CardHeader>
				<CardTitle>Manajemen Seminar Hasil</CardTitle>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Halaman awal admin untuk validasi berkas seminar hasil dan pengelolaan jadwal seminar.
			</CardContent>
		</Card>
	)
}
