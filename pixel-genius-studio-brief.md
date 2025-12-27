# 📁 PROJECT BRIEF: "Pixel-Genius Studio"

## 1. Executive Summary

Membangun aplikasi web drawing tool berbasis React & Canvas yang tumbuh bersama pengguna. Aplikasi ini memiliki fitur **"Switch Mode"**:

- **Junior Mode**: Untuk fase bermain (Kelas 1-3 SD)
- **Pro Mode**: Untuk fase berkarya serius (Kelas 4-6 SD), dengan fitur setara software grafis ringan (Layers, Pixel Art, Filters)

**Target Vibe**: Windows 95/98 Retro Aesthetic (Nostalgik tapi Modern)

---

## 2. User Persona & Fase Penggunaan

| Fase | Rentang Usia | Karakteristik User | Kebutuhan Fitur |
|------|--------------|-------------------|-----------------|
| **Fase 1 (Junior)** | Kelas 1-3 SD | Suka visual instan, motorik kasar, perhatian pendek | Kuas Ajaib, Stempel, UI Besar, Suara Lucu |
| **Fase 2 (Pro)** | Kelas 4-6 SD | Mulai detail, ingin meniru style anime/game, paham logika | Layering, Grid (Pixel Art), Save Project, Undo/Redo |

---

## 3. Tech Stack Recommendation (Front-End Focused)

### Core Technologies

- **Core**: React.js (Vite) + TypeScript (Opsional, tapi disarankan)
- **Graphics Engine**: Konva.js (`react-konva`)
  - **Alasan**: Menangani sistem Layering, Z-Index, dan Object Manipulation (geser/resize bentuk) jauh lebih mudah daripada Raw Canvas API
- **State Management**: Zustand
  - **Alasan**: Ringan dan mudah untuk manage state kompleks (History Stack, Array of Layers)
- **Styling**: Tailwind CSS (Layout) + 98.css (Retro Components)
- **Algorithms**: Custom functions untuk Flood Fill (Scanline algorithm) dan Filters

---

## 4. Scope of Work (Fitur Dual-Mode)

### A. Global Features (Selalu Ada)

- **Infinite Canvas / Responsive Stage**: Area gambar menyesuaikan layar
- **Mode Switcher**: Tombol fisik di UI untuk ganti antara "Level 1 (Junior)" dan "Level 100 (Pro)"
- **Export**: Download as PNG/JPG

### B. JUNIOR MODE (Hidden Complexity)

UI sangat minimalis. Panel Layer disembunyikan (otomatis gambar di Layer 1).

#### Magic Brushes:
- **Rainbow**: Warna hsl cycling
- **Sparkles**: Partikel bintang mengikuti cursor
- **Mirror Drawing (Mandala)**: 2x atau 4x simetri axis

#### Additional Features:
- **Sticker Stamp**: Klik untuk menempel aset gambar (Emoji/Hewan)
- **Sound FX**: Feedback audio saat klik tools

### C. PRO MODE (Full Complexity)

UI menampilkan semua panel kontrol.

#### Layer System (The Core):
- Add, Delete, Hide/Show, Opacity Slider
- Drag & Drop urutan Layer

#### Pixel Art Grid:
- Snap-to-grid brush
- Toggle visual grid lines

#### Advanced Tools:
- **Flood Fill (Bucket)**: Algoritma cat tumpah
- **Eyedropper**: Ambil warna dari canvas
- **Shapes (Vector-like)**: Rectangle & Circle yang bisa di-resize/rotate setelah digambar (Fitur Konva)
- **Filter Effects**: Tombol instan (Pixelate, Blur, Grayscale)
- **History**: Unlimited Undo/Redo stack

---

## 5. Struktur Data (State Schema)

Ini gambaran bagaimana Anda mengatur data di Zustand store:

```javascript
{
  mode: 'junior' | 'pro',
  
  // Canvas Setup
  stageSize: { width: 800, height: 600 },
  
  // Aktifitas saat ini
  activeTool: 'brush', // brush, eraser, bucket, shape
  brushColor: '#000000',
  brushSize: 5,
  
  // CORE: Array of Layers
  layers: [
    { 
      id: 'layer-1', 
      name: 'Background', 
      visible: true, 
      locked: false, 
      opacity: 1, 
      data: [...] 
    },
    { 
      id: 'layer-2', 
      name: 'Outline', 
      visible: true, 
      locked: false, 
      opacity: 1, 
      data: [...] 
    }
  ],
  activeLayerId: 'layer-2',
  
  // History untuk Undo/Redo
  historyStep: 0,
  historyStack: [...]
}
```

---

## 6. Development Roadmap (Sprints)

Agar tidak kewalahan, kerjakan bertahap:

### Sprint 1: The Foundation (Minggu 1)

- [ ] Init Project (Vite + React)
- [ ] Setup react-konva Stage & Layer
- [ ] Buat fitur gambar dasar (Freehand Line)
- [ ] Implementasi UI dasar dengan tema Windows 98

### Sprint 2: The Junior Hook (Minggu 2)

- [ ] Buat "Rainbow Brush" (Logic warna dinamis)
- [ ] Buat "Mirror Mode" (Logic duplikasi koordinat)
- [ ] Tambahkan Sound FX sederhana

**Milestone**: Kasih coba ke keponakan (Test drive fase 1)

### Sprint 3: The Pro Logic (Minggu 3-4)

- [ ] Layer Manager: Logic untuk tambah/hapus array layer
- [ ] Flood Fill: Implementasi algoritma pewarnaan pixel
- [ ] Undo/Redo: State management history
- [ ] Implementasi Switch Mode UI (Hide/Show panels)

### Sprint 4: Polish & Deploy (Minggu 5)

- [ ] Responsiveness check
- [ ] Save/Load Project (Export JSON)
- [ ] Deploy ke Vercel/Netlify

---

## 7. Tantangan Teknis (Developer Notes) ⚠️

### Flood Fill di Konva

**Masalah**: Konva berbasis Obyek/Vektor, sedangkan Flood Fill bekerja pada Pixel (Raster).

**Solusi**: Anda harus mengambil snapshot layer aktif menjadi gambar raster sementara → jalankan algoritma flood fill → kembalikan hasilnya ke canvas sebagai Image Object baru.

### Performance Undo/Redo

**Masalah**: Menyimpan full snapshot canvas setiap kali undo akan memakan RAM browser.

**Solusi**: Batasi history stack (misal maks 20 langkah) atau simpan perubahan (delta) saja jika memungkinkan.

### Mobile/Tablet Support

**Masalah**: Event `mousedown` berbeda dengan `touchstart`. 

**Solusi**: Pastikan handle kedua event tersebut agar bisa dimainkan di iPad/Tablet (anak-anak sering pakai tablet).

---

## 8. Next Steps

1. Review dan validasi brief ini dengan stakeholder
2. Setup development environment
3. Mulai Sprint 1: Foundation
4. Iterasi dan testing dengan target user (anak-anak SD)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-27  
**Status**: Ready for Development
