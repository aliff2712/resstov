// js/app.js
import { renderMenu, filterMenuByCategory } from './ui.js'; // Tambahkan filterMenuByCategory ke import
import { renderOrder, showQrisModal, showStruk } from './ui.js';
import * as Order from './order.js';
import * as Payment from './payment.js';
import { menu } from './menu.js';

document.addEventListener('DOMContentLoaded', () => {
  // initial render
  renderMenu(menu);
  renderOrder();

  // ===== Fungsi untuk filter menu berdasarkan kategori =====
  window.filterMenu = function(kategori) {
    // Filter menu menggunakan fungsi dari ui.js
    filterMenuByCategory(kategori, menu);
    
    // Update class 'active' pada button kategori
    document.querySelectorAll('.kategori button').forEach(btn => btn.classList.remove('active'));
    // Cari button yang diklik berdasarkan kategori (asumsi onclick="filterMenu('all')" dll.)
    const clickedBtn = document.querySelector(`.kategori button[onclick="filterMenu('${kategori}')"]`);
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }
  };

  // ===== PENTING: Tambahkan event listener untuk menu items =====
  // Pastikan fungsi ini dipanggil setiap kali menu di-render ulang
  window.addMenuToCart = function(item) {
    Order.addItem(item);
    renderOrder();
    
    // Play sound jika ada
    const klikSound = document.getElementById('klikSound');
    if (klikSound) {
      klikSound.play().catch(() => {});
    }
    
    // Tampilkan notifikasi floating
    showFloatingNotification(`✓ ${item.nama} ditambahkan`);
  };

  // Fungsi untuk mengurangi item di order
  window.decreaseItem = function(nama) {
    Order.decreaseItem(nama);
    renderOrder();
    
    // Play sound jika ada (opsional, bisa gunakan klikSound atau sound lain)
    const klikSound = document.getElementById('klikSound');
    if (klikSound) {
      klikSound.play().catch(() => {});
    }
    
    // Tampilkan notifikasi floating
    showFloatingNotification(`✓ ${nama} dikurangi`);
  };

  // Fungsi untuk menambah item di order (menggunakan addItem yang sudah ada)
  window.increaseItem = function(nama) {
    // Cari item dari menu berdasarkan nama untuk mendapatkan data lengkap
    const item = menu.find(m => m.nama === nama);
    if (item) {
      Order.addItem(item);
      renderOrder();
      
      // Play sound jika ada
      const klikSound = document.getElementById('klikSound');
      if (klikSound) {
        klikSound.play().catch(() => {});
      }
      
      // Tampilkan notifikasi floating
      showFloatingNotification(`✓ ${nama} ditambahkan`);
    }
  };

  // attach payment-card click handlers (by delegation)
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', () => {
      const metode = card.querySelector('h4')?.innerText || card.dataset.metode;
      Payment.setPaymentMethod(metode);
      
      // UI visual active
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // show/hide cash input
      const uangSection = document.getElementById('uangBayarSection');
      const kembalianEl = document.getElementById('kembalian');
      
      if (metode && metode.toLowerCase() === 'tunai') {
        uangSection.classList.add('show');
      } else {
        uangSection.classList.remove('show');
        kembalianEl.classList.remove('show');
        document.getElementById('uangBayar').value = '';
      }
    });
  });

  // tombol Pesan Sekarang: open modal for QRIS or process tunai
  const pesanBtn = document.getElementById('pesanSekarang');
  if (pesanBtn) {
    pesanBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const nama = document.getElementById('nama_Pemesan').value.trim();
      const opsi = document.getElementById('opsiPengantaran').value;
      const alamat = document.getElementById('alamatPengantaran').value.trim();
      const waktu = document.getElementById('waktuPesanan').value;
      const total = Order.getTotal();
      const itemsCount = Order.getItems().length;

      // validate menggunakan Payment module
      const check = Payment.validateCheckout({
        nama,
        pesananCount: itemsCount,
        opsiPengantaran: opsi,
        alamat,
        waktu
      });
      
      if (!check.ok) {
        alert(check.message);
        return;
      }

      const metodeNow = Payment.getPaymentMethod();

      if (metodeNow === 'Tunai') {
        // cash flow
        const uang = Number(document.getElementById('uangBayar').value || 0);
        const res = Payment.processCashPayment({ total, uangDibayarkan: uang });
        
        if (!res.ok) {
          const kembalianEl = document.getElementById('kembalian');
          kembalianEl.innerHTML = '❌ Uang tidak cukup!';
          kembalianEl.style.background = 'linear-gradient(135deg, #ff9999 0%, #ff6b6b 100%)';
          kembalianEl.classList.add('show');
          return;
        }
        
        // Tampilkan kembalian jika tunai
        const kembalianEl = document.getElementById('kembalian');
        kembalianEl.innerHTML = `💰 Kembalian: <strong>Rp ${res.kembalian.toLocaleString()}</strong>`;
        kembalianEl.style.background = 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)';
        kembalianEl.classList.add('show');
        
        const pembayaranData = {
          nama_pemesan: nama,
          metode: 'Tunai',
          total,
          uang: res.uang,
          kembalian: res.kembalian,
          opsiAntar: opsi,
          alamat,
          waktu,
          items: Order.getItems().map(p => ({ 
            nama: p.nama, 
            jumlah: p.jumlah, 
            subtotal: p.harga * p.jumlah 
          }))
        };
        
        // show struk
        showStruk(pembayaranData);
        
        // Play success sound
        const successSound = document.getElementById('successSound');
        if (successSound) {
          successSound.play().catch(() => {});
        }
        
      } else {
        // QRIS flow (all e-wallets map to QRIS)
        const pembayaranData = {
          nama_pemesan: nama,
          metode: metodeNow,
          total,
          uang: total,
          kembalian: 0,
          opsiAntar: opsi,
          alamat,
          waktu,
          items: Order.getItems().map(p => ({ 
            nama: p.nama, 
            jumlah: p.jumlah, 
            subtotal: p.harga * p.jumlah 
          }))
        };
        
        showQrisModal(total, pembayaranData);
      }
    });
  }

  // close struk popup (tutupStruk)
  window.tutupStruk = function() {
    const popup = document.getElementById('popupStruk');
    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');
    
    // Reset form dan order
    resetForm();
    Order.clearOrder();
    renderOrder();
  };

  // print function from global context (used in HTML)
  window.cetakStruk = function() {
    const isiStruk = document.getElementById('strukDetail').innerHTML;
    const jendelaCetak = window.open("", "_blank", "width=400,height=600");
    jendelaCetak.document.write(`
      <html>
        <head>
          <title>Struk Pesanan - Resttov</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            h2 {
              text-align: center;
              color: #667eea;
              border-bottom: 2px solid #667eea;
              padding-bottom: 10px;
            }
            p {
              margin: 8px 0;
              display: flex;
              justify-content: space-between;
            }
            hr {
              border: none;
              border-top: 2px dashed #999;
              margin: 15px 0;
            }
            .struk-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            strong { color: #333; }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid #667eea;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h2>🧾 Resttov - Struk Pesanan</h2>
          ${isiStruk}
          <div class="footer">
            <p>Terima kasih telah memesan di Resttov! 🍔</p>
            <small>Dicetak pada: ${new Date().toLocaleString('id-ID')}</small>
          </div>
        </body>
      </html>
    `);
    jendelaCetak.document.close();
    jendelaCetak.focus();
    setTimeout(() => jendelaCetak.print(), 300);
  };

  // Reset order button
  window.resetOrder = function() {
    const resetSound = document.getElementById('resetSound');
    if (resetSound) {
      resetSound.play().catch(() => {});
    }
    
    Order.clearOrder();
    renderOrder();
    resetForm();
  };

  // Toggle alamat section
  window.toggleAlamat = function() {
    const opsi = document.getElementById('opsiPengantaran').value;
    const alamatSection = document.getElementById('alamatSection');
    alamatSection.style.display = (opsi === 'Antar ke Rumah') ? 'block' : 'none';
  };

  // Set minimum datetime to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const waktuInput = document.getElementById('waktuPesanan');
  if (waktuInput) {
    waktuInput.min = now.toISOString().slice(0, 16);
  }
});

// Helper function: Reset form
function resetForm() {
  document.getElementById('nama_Pemesan').value = '';
  document.getElementById('opsiPengantaran').value = '';
  document.getElementById('alamatPengantaran').value = '';
  document.getElementById('waktuPesanan').value = '';
  document.getElementById('uangBayar').value = '';
  document.getElementById('alamatSection').style.display = 'none';
  
  const kembalianEl = document.getElementById('kembalian');
  kembalianEl.classList.remove('show');
  kembalianEl.innerHTML = '';
  
  const uangBayarSection = document.getElementById('uangBayarSection');
  uangBayarSection.classList.remove('show');
  
  document.querySelectorAll('.payment-card').forEach(card => {
    card.classList.remove('active');
  });
  
  // Reset payment method
  Payment.setPaymentMethod('');
}

// Helper function: Show floating notification
function showFloatingNotification(message) {
  const floating = document.createElement('div');
  floating.className = 'floating-add';
  floating.textContent = message;
  floating.style.position = 'fixed';
  floating.style.top = '100px';
  floating.style.left = '50%';
  floating.style.transform = 'translateX(-50%)';
  floating.style.zIndex = '9999';
  
  document.body.appendChild(floating);
  
  setTimeout(() => floating.remove(), 1000);
}
