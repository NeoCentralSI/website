import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { changePasswordAPI, updateProfileAPI } from "@/services/auth.service";
import { Eye, EyeOff, User, Lock, Phone, AlertCircle, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Profil() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  
  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profil" },
    ]);
    setTitle("Profil Saya");
  }, [setBreadcrumbs, setTitle]);

  const { user, refreshUser } = useAuth();
  
  // State untuk edit profil
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phoneNumber: "",
  });
  const [profileError, setProfileError] = useState("");

  // State untuk ubah password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // Initialize profile form dengan data user
  useEffect(() => {
    if (user) {
      setProfileForm({
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    if (!profileForm.phoneNumber) {
      setProfileError("Nomor telepon harus diisi");
      return;
    }

    if (!/^[0-9+\-() ]+$/.test(profileForm.phoneNumber)) {
      setProfileError("Format nomor telepon tidak valid");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfileAPI({ phoneNumber: profileForm.phoneNumber });
      toast.success("Profil berhasil diperbarui");
      // Refresh user data
      await refreshUser();
    } catch (err) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError("Gagal memperbarui profil");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Semua field harus diisi");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordAPI({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password berhasil diubah");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal mengubah password");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !user?.phoneNumber;

  return (
    <div className="p-6 max-w-7xl">
    

      {/* Alert if profile incomplete */}
      {isProfileIncomplete && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Data Belum Lengkap</h3>
            <p className="text-sm text-amber-700 mt-1">
              Mohon lengkapi data profil Anda untuk pengalaman yang lebih baik.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Informasi Akun */}
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Akun</h2>
              <p className="text-sm text-gray-600 mt-1">Data pribadi dan identitas Anda</p>
            </div>
          </div>

          {profileError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <p className="text-sm text-red-600">{profileError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2 block">Nama Lengkap</Label>
              <Input
                id="fullName"
                type="text"
                value={user?.fullName || ""}
                disabled
                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              />
            </div>
            
            <div>
              <Label htmlFor="identityNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                Nomor Identitas ({user?.identityType || "N/A"})
              </Label>
              <Input
                id="identityNumber"
                type="text"
                value={user?.identityNumber || ""}
                disabled
                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor Telepon {!user?.phoneNumber && <span className="text-red-500 ml-0.5">*</span>}
                </div>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                placeholder="Contoh: 081234567890"
                disabled={isSavingProfile}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Status Verifikasi
                </div>
              </Label>
              <div className="mt-1.5">
                <Badge 
                  className={user?.isVerified 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {user?.isVerified ? "✓ Terverifikasi" : "Belum Terverifikasi"}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </div>
              </Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge
                      key={role.id}
                      className={role.status === "active" 
                        ? "capitalize bg-orange-100 text-orange-700 hover:bg-orange-100" 
                        : "capitalize bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">Tidak ada role</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={isSavingProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>

        {/* Right Column - Keamanan Akun */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="bg-red-100 p-2 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Keamanan Akun</h2>
              <p className="text-sm text-gray-600 mt-1">Ubah password untuk meningkatkan keamanan</p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                Password Saat Ini
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••••••••"
                  disabled={isChangingPassword}
                  className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min. 6 karakter"
                  disabled={isChangingPassword}
                  className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Ketik ulang password"
                  disabled={isChangingPassword}
                  className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setError("");
                }}
                disabled={isChangingPassword}
                className="px-6 py-2 border-gray-300 hover:bg-gray-50"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              >
                {isChangingPassword ? "Menyimpan..." : "Ubah Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Student/Lecturer Information - Below Grid */}
      {user?.student && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Mahasiswa</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Tahun Masuk</Label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.student.enrollmentYear || <span className="text-gray-400 italic">Belum diisi</span>}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">SKS Selesai</Label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.student.sksCompleted !== undefined ? `${user.student.sksCompleted} SKS` : <span className="text-gray-400 italic">Belum diisi</span>}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Status Mahasiswa</Label>
                <div className="mt-1">
                  {user.student.status ? (
                    <Badge variant={user.student.status === "Aktif" ? "default" : "secondary"}>
                      {user.student.status}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Belum diisi</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.lecturer && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dosen</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Kelompok Keilmuan</Label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.lecturer.scienceGroup || <span className="text-gray-400 italic">Belum diisi</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
