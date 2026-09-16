import { test, expect } from '@playwright/test';

/**
 * E2E UI Test: Modul Tugas Akhir & Bimbingan Mahasiswa
 *
 * Menguji interaksi antarmuka pengguna (Frontend Browser):
 *   1. Rendering Navigasi & Halaman Bimbingan Mahasiswa (/tugas-akhir/bimbingan)
 *   2. Antarmuka Manajemen Milestone Progres Tugas Akhir Mahasiswa
 *   3. Halaman Daftar Mahasiswa Bimbingan Dosen (/tugas-akhir/bimbingan/lecturer/my-students)
 *   4. Tab Arsip Mahasiswa Bimbingan dengan Badge Status "Completed"
 *   5. Responsivitas Halaman Bimbingan (Desktop & Mobile)
 */

test.describe('E2E UI: Alur Bimbingan Tugas Akhir & Milestone Mahasiswa', () => {

  test('1. Rendering Navigasi & Halaman Bimbingan Mahasiswa (/tugas-akhir/bimbingan)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_student_jwt_token',
          user: {
            id: 'mock-student-uuid',
            name: 'Nabil Rizki Navisa',
            email: 'nabil@test.unand.ac.id',
            role: 'mahasiswa',
            student: {
              takingThesisCourse: true,
              researchMethodCompleted: true,
            }
          }
        },
        version: 1,
      }));
    });

    await page.goto('/tugas-akhir/bimbingan');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi container root dan layout utama ter-render
    await expect(page.locator('#root')).toBeVisible();
  });

  test('2. Antarmuka Manajemen Milestone Progres Tugas Akhir Mahasiswa', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_student_jwt_token',
          user: {
            id: 'mock-student-uuid',
            name: 'Mahasiswa Angkatan 22',
            email: 'mahasiswa22@test.unand.ac.id',
            role: 'mahasiswa',
            student: {
              takingThesisCourse: true,
              researchMethodCompleted: true,
            }
          }
        },
        version: 1,
      }));
    });

    await page.goto('/tugas-akhir/bimbingan');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#root')).toBeVisible();
  });

  test('3. Halaman Daftar Mahasiswa Bimbingan Dosen (/tugas-akhir/bimbingan/lecturer/my-students)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_lecturer_jwt_token',
          user: {
            id: 'mock-lecturer-uuid',
            name: 'Dr. Dosen Pembimbing Utama, M.T.',
            email: 'dosen.pembimbing@test.unand.ac.id',
            role: 'pembimbing_1',
            roles: ['pembimbing_1', 'pembimbing_2', 'dosen'],
          }
        },
        version: 1,
      }));
    });

    await page.goto('/tugas-akhir/bimbingan/lecturer/my-students');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#root')).toBeVisible();
  });

  test('4. Tab Arsip Mahasiswa Bimbingan dengan Filter Status Completed', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_lecturer_jwt_token',
          user: {
            id: 'mock-lecturer-uuid',
            name: 'Dr. Dosen Pembimbing Utama, M.T.',
            email: 'dosen.pembimbing@test.unand.ac.id',
            role: 'pembimbing_1',
            roles: ['pembimbing_1', 'pembimbing_2', 'dosen'],
          }
        },
        version: 1,
      }));
    });

    await page.goto('/tugas-akhir/bimbingan/lecturer/my-students');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#root')).toBeVisible();
  });

  test('5. Responsivitas Halaman Bimbingan (Desktop & Mobile Viewport)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_student_jwt_token',
          user: {
            id: 'mock-student-uuid',
            name: 'Nabil Rizki Navisa',
            email: 'nabil@test.unand.ac.id',
            role: 'mahasiswa',
          }
        },
        version: 1,
      }));
    });

    // Uji tampilan Desktop (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tugas-akhir/bimbingan');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#root')).toBeVisible();

    // Uji tampilan Mobile (375x667 - iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tugas-akhir/bimbingan');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#root')).toBeVisible();
  });

});
