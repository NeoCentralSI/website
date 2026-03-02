import { useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '@/components/layout/ProtectedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LecturerThesisSeminar() {
	const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>()

	const breadcrumbs = useMemo(
		() => [
			{ label: 'Tugas Akhir', href: '/tugas-akhir' },
			{ label: 'Seminar Hasil (Dosen)' },
		],
		[]
	)

	useEffect(() => {
		setBreadcrumbs(breadcrumbs)
		setTitle('Seminar Hasil (Dosen)')
	}, [setBreadcrumbs, setTitle, breadcrumbs])

	return (
		<Card>
			<CardHeader>
				<CardTitle>Seminar Hasil Dosen</CardTitle>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Halaman awal dosen untuk approval ketersediaan sebagai penguji dan melihat detail seminar mahasiswa bimbingan.
			</CardContent>
		</Card>
	)
}
