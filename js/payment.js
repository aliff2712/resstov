// js/payment.js
let metodePembayaran = ''; // 'Tunai' or 'QRIS' (non-tunai mapped as QRIS)
let lastPaymentResult = null;

/** Set payment method. For e-wallets (Gopay/OVO/DANA/ShopeePay) we map to 'QRIS' */
export function setPaymentMethod(metode) {
  if (!metode) metodePembayaran = '';
  else {
    const m = metode.toLowerCase();
    if (m === 'tunai') metodePembayaran = 'Tunai';
    else metodePembayaran = 'QRIS';
  }
}

/** Get current payment method */
export function getPaymentMethod() {
  return metodePembayaran;
}

/**
 * Validate required fields for checkout
 * @param {Object} params
 * @returns {Object} { ok: boolean, message: string }
 */
export function validateCheckout({ nama, pesananCount, opsiPengantaran, alamat, waktu }) {
  if (!nama) return { ok: false, message: 'Silakan masukkan nama pemesan.' };
  if (!pesananCount || pesananCount === 0) return { ok: false, message: 'Keranjang pesanan masih kosong.' };
  if (!opsiPengantaran) return { ok: false, message: 'Silakan pilih opsi pengantaran.' };
  if (opsiPengantaran === 'Antar ke Rumah' && (!alamat || alamat.trim() === '')) {
    return { ok: false, message: 'Masukkan alamat pengantaran.' };
  }
  if (!waktu) return { ok: false, message: 'Pilih waktu pesanan.' };
  if (!metodePembayaran) return { ok: false, message: 'Pilih metode pembayaran terlebih dahulu.' };
  return { ok: true };
}

/** Process cash payment (Tunai) */
export function processCashPayment({ total, uangDibayarkan }) {
  const uang = Number(uangDibayarkan) || 0;
  if (isNaN(uang) || uang < total) {
    return { ok: false, message: 'Uang tidak cukup.' };
  }
  const kembalian = uang - total;
  lastPaymentResult = { success: true, metode: 'Tunai', uang, kembalian, total };
  return { ok: true, kembalian, uang };
}

/** For QRIS: we only prepare the payload (dummy) */
export function prepareQrisPayload({ total, orderId = null }) {
  // Dummy payload: in real use, you may call server to generate dynamic QR
  lastPaymentResult = { success: false, metode: 'QRIS', total, orderId };
  return {
    dataUrl: `data:image/png;base64,QR_BASE64_PLACEHOLDER`, // replace in ui.js with real base64
    total
  };
}``

export function getLastPaymentResult() {
  return lastPaymentResult;
}
