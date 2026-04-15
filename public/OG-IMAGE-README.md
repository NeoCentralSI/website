# OG Image Generation Guide

## Current Status
- A placeholder SVG OG image has been created at `public/og-image.svg`
- For best compatibility, you should generate a PNG version

## Recommended Approach

### Option 1: Use Screenshot (Quick)
1. Open `public/og-image.svg` in a browser
2. Take a screenshot at 1200x630px
3. Save as `public/og-image.png`

### Option 2: Use Design Tools
**Using Figma/Canva:**
1. Create a new design: 1200 x 630 pixels
2. Add NeoCentral branding:
   - Logo
   - Title: "NeoCentral"
   - Subtitle: "Platform Digital untuk Kerja Praktek & Tugas Akhir"
   - Department: "Departemen Sistem Informasi — Universitas Andalas"
3. Use brand colors:
   - Primary: #F7931E (Orange)
   - Background: Dark gradient (#1a1a2e to #16213e)
4. Export as PNG to `public/og-image.png`

### Option 3: Automated (Recommended for CI/CD)
Add to your build process:
```bash
# Install puppeteer
npm install puppeteer

# Generate OG image from SVG
node generate-og-image.js
```

## Optimal Specifications
- **Dimensions**: 1200 x 630 pixels
- **Format**: PNG (better compression than JPEG for graphics)
- **File size**: < 300KB for faster loading
- **Content**: Logo + Title + Brief description

## Why This Matters
- Open Graph images are shown when your site is shared on Facebook, LinkedIn, etc.
- Twitter Cards use the same image for Twitter shares
- First impression when someone shares your link on social media
