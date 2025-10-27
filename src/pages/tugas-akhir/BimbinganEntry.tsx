import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

export default function BimbinganEntry() {
  const navigate = useNavigate();
  const { isStudent, isDosen } = useRole();

  useEffect(() => {
    // Redirect based on role
    if (isStudent()) {
      navigate("/tugas-akhir/bimbingan/student", { replace: true });
    } else if (isDosen()) {
      navigate("/tugas-akhir/bimbingan/lecturer/requests", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [isStudent, isDosen, navigate]);

  return null;
}
