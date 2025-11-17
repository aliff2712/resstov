// js/ui.js
import * as Order from './order.js';

/**
 * Render menu items to grid
 * @param {Array} menuData - Array of menu items
 */
export function renderMenu(menuData) {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  grid.innerHTML = '';

  menuData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      <img src="${item.gambar}" alt="${escapeHtml(item.nama)}" style="max-width:100%; height:120px; object-fit:cover; border-radius:10px;">
      <h4>${escapeHtml(item.nama)}</h4>
      <p>Rp${Number(item.harga).toLocaleString()}</p>
    `;

    // klik menu menambah item (menyertakan object lengkap via window.addMenuToCart)
    div.onclick = () => {
      if (window.addMenuToCart) {
        window.addMenuToCart(item);
      }
    };

    grid.appendChild(div);
  });
}

/**
 * Render order list and total
 */
export function renderOrder() {
  const orderList = document.getElementById('orderList');
  const totalDisplay = document.getElementById('total');

  if (!orderList || !totalDisplay) return;

  const items = Order.getItems();
  const total = Order.getTotal();

  orderList.innerHTML = '';

  if (items.length === 0) {
    orderList.innerHTML = `
      <li class="text-center text-muted py-2">Belum ada pesanan</li>
    `;
    totalDisplay.textContent = "0";
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');

    li.className = "d-flex justify-content-between align-items-center py-2 border-bottom";

    li.innerHTML = `
      <div>
        <strong>${escapeHtml(item.nama)}</strong>
        <div class="text-muted small">x${item.jumlah}</div>
      </div>

      <div class="d-flex align-items-center gap-2">

        <!-- gunakan data-nama karena pasti ada -->
        <button class="btn btn-sm btn-outline-danger btnKurang" data-nama="${escapeHtml(item.nama)}" aria-label="Kurangi ${escapeHtml(item.nama)}">
          <i class="bi bi-dash-lg" aria-hidden="true"></i>
        </button>

        <span class="fw-bold">Rp${(item.harga * item.jumlah).toLocaleString()}</span>

        <button class="btn btn-sm btn-outline-success btnTambah" data-nama="${escapeHtml(item.nama)}" aria-label="Tambah ${escapeHtml(item.nama)}">
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
        </button>
        
      </div>
    `;

    orderList.appendChild(li);
  });

  totalDisplay.textContent = total.toLocaleString();

  // Event untuk tombol tambah — panggil window.increaseItem supaya menggunakan menu lookup di app.js
  document.querySelectorAll(".btnTambah").forEach(btn => {
    btn.onclick = () => {
      const nama = btn.dataset.nama;
      if (nama && window.increaseItem) {
        window.increaseItem(nama);
      } else {
        // fallback: kalau window.increaseItem tidak ada, coba Order.addItem dengan lookup nama
        Order.addItem({ nama }); // ini minimal, pastikan harga/id tetap ada di order.js kalau dipakai
        renderOrder();
      }
    };
  });

  // Event untuk tombol kurang — panggil window.decreaseItem
  document.querySelectorAll(".btnKurang").forEach(btn => {
    btn.onclick = () => {
      const nama = btn.dataset.nama;
      if (nama && window.decreaseItem) {
        window.decreaseItem(nama);
      } else {
        // fallback langsung ke module
        Order.decreaseItem(nama);
        renderOrder();
      }
    };
  });
}

/**
 * Show QRIS modal for payment
 * @param {Number} total - Total amount
 * @param {Object} pembayaranData - Payment data object
 */
export function showQrisModal(total, pembayaranData) {
  const qrisTotal = document.getElementById('qrisTotal');
  if (qrisTotal) {
    qrisTotal.textContent = total.toLocaleString();
  }

  const modalEl = document.getElementById('qrisModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const btnBayar = document.getElementById('btnBayarSekarang');
    if (btnBayar) {
      btnBayar.onclick = () => {
        modal.hide();

        showStruk(pembayaranData);

        Order.clearOrder();
        renderOrder();

        const successSound = document.getElementById('successSound');
        if (successSound) {
          successSound.play().catch(() => {});
        }
      };
    }
  }
}

/**
 * Show receipt popup
 * @param {Object} data - Payment data
 */
export function showStruk(data) {
  const waktuFormatted = new Date(data.waktu).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsHTML = (data.items || []).map(it => `
    <div class="struk-item">
      <span>${escapeHtml(it.nama)} x${it.jumlah}</span>
      <span>Rp${it.subtotal.toLocaleString()}</span>
    </div>
  `).join('');

  const strukHTML = `
    <p><strong>Nama Pemesan:</strong> <span>${escapeHtml(data.nama_pemesan)}</span></p>
    <p><strong>Waktu Pesanan:</strong> <span>${waktuFormatted}</span></p>
    <p><strong>Metode Pembayaran:</strong> <span>${escapeHtml(data.metode)}</span></p>
    <p><strong>Pengantaran:</strong> <span>${escapeHtml(data.opsiAntar)}</span></p>
    ${data.opsiAntar === 'Antar ke Rumah' ? `<p><strong>Alamat:</strong> <span>${escapeHtml(data.alamat)}</span></p>` : ''}

    <hr>

    <div class="struk-items">
      <p><strong>Detail Pesanan:</strong></p>
      ${itemsHTML}
    </div>

    <hr>

    <p style="font-size:1.2em;"><strong>Total Pesanan:</strong> <span style="color:#f5576c;">Rp ${data.total.toLocaleString()}</span></p>

    ${data.metode === 'Tunai' ? `
      <p><strong>Uang Dibayar:</strong> <span>Rp ${data.uang.toLocaleString()}</span></p>
      <p><strong>Kembalian:</strong> <span style="color:#4caf50; font-weight:700;">Rp ${data.kembalian.toLocaleString()}</span></p>
    ` : `
      <p style="background:#e3f2fd; padding:10px; border-radius:8px; text-align:center; margin-top:10px;">
        <strong>✅ Pembayaran berhasil melalui ${escapeHtml(data.metode)}</strong><br>
        <small style="color:#666;">Total: Rp ${data.total.toLocaleString()}</small>
      </p>
    `}
  `;

  const strukDetail = document.getElementById('strukDetail');
  if (strukDetail) {
    strukDetail.innerHTML = strukHTML;
  }

  const popup = document.getElementById('popupStruk');
  if (popup) {
    popup.style.display = 'flex';
    popup.setAttribute('aria-hidden', 'false');
  }
}

/**
 * Filter menu by category
 */
export function filterMenuByCategory(kategori, allMenu) {
  if (kategori === 'all') {
    renderMenu(allMenu);
  } else {
    const filtered = allMenu.filter(m => m.kategori === kategori);
    renderMenu(filtered);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
