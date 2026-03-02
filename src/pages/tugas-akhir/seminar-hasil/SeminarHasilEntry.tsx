import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/shared'

export default function SeminarHasilEntry() {
  const navigate = useNavigate()
  const { isStudent, isAdmin, isDosen } = useRole()

  useEffect(() => {
    if (isStudent()) {
      navigate('/tugas-akhir/seminar/student', { replace: true })
    } else if (isAdmin()) {
      navigate('/tugas-akhir/seminar/admin', { replace: true })
    } else if (isDosen()) {
      navigate('/tugas-akhir/seminar/lecturer', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [isStudent, isAdmin, isDosen, navigate])

  return null
}