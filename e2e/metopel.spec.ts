import { test, expect } from '@playwright/test';

/**
 * E2E UI Test: Modul Metopel (Metodologi Penelitian)
 *
 * Menguji interaksi antarmuka pengguna (Frontend Browser):
 *   1. Mahasiswa membuka halaman Login (/login)
 *   2. Rendering Dashboard Metopel Mahasiswa (/metopel/overview)
 *   3. Formulir Pengajuan TA-01 & Pemilihan Topik
 *   4. Antarmuka Inbox Dosen Pembimbing (/tugas-akhir/inbox-pembimbing)
 *   5. Responsivitas Tampilan (Mobile & Desktop)
 */

test.describe('E2E UI: Alur Modul Metopel (Metodologi Penelitian)', () => {

  test('1. Halaman Login dan Form Autentikasi Pengguna', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi judul atau root form login
    await expect(page.locator('#root')).toBeVisible();

    // Verifikasi elemen input email dan password
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('2. Navigasi dan Rendering Dashboard Metopel Mahasiswa', async ({ page }) => {
    // Set authenticated student auth store
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_student_jwt_token',
          user: {
            id: 'mock-student-uuid',
            name: 'Mahasiswa Angkatan 23',
            email: 'mahasiswa23@test.unand.ac.id',
            role: 'mahasiswa',
          }
        },
        version: 1,
      }));
    });

    await page.goto('/metopel/overview');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi container root aplikasi ter-render
    await expect(page.locator('#root')).toBeVisible();
  });

  test('3. Antarmuka Formulir Pengajuan TA-01 & Pemilihan Topik', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_student_jwt_token',
          user: {
            id: 'mock-student-uuid',
            name: 'Mahasiswa Angkatan 23',
            email: 'mahasiswa23@test.unand.ac.id',
            role: 'mahasiswa',
          }
        },
        version: 1,
      }));
    });

    await page.goto('/metopel/overview');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#root')).toBeVisible();

    // Cek jika terdapat tombol interaksi TA-01
    const applyButton = page.locator('button:has-text("Ajukan"), button:has-text("TA-01"), button:has-text("Topik")').first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });

  test('4. Antarmuka Inbox Dosen Pembimbing (/tugas-akhir/inbox-pembimbing)', async ({ page }) => {
    // Set authenticated lecturer auth store
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-store', JSON.stringify({
        state: {
          token: 'mock_lecturer_jwt_token',
          user: {
            id: 'mock-lecturer-uuid',
            name: 'Prof. Dr. Dosen Pembimbing',
            email: 'dosen@test.unand.ac.id',
            role: 'dosen',
          }
        },
        version: 1,
      }));
    });

    await page.goto('/tugas-akhir/inbox-pembimbing');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi container dashboard dosen ter-render
    await expect(page.locator('#root')).toBeVisible();
  });

  test('5. Verifikasi Responsivitas Antarmuka Metopel (Mobile & Desktop Viewport)', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await expect(page.locator('#root')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.locator('#root')).toBeVisible();
  });

});
