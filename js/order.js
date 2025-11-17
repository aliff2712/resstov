// js/order.js
let pesanan = [];

/** Add item (increments jumlah jika sudah ada) */
export function addItem(item) {
  const existing = pesanan.find(p => p.nama === item.nama);
  if (existing) existing.jumlah++;
  else pesanan.push({ ...item, jumlah: 1 });
}

/** Remove item entirely */
export function removeItem(nama) {
  pesanan = pesanan.filter(p => p.nama !== nama);
}

/** Decrease quantity */
export function decreaseItem(nama) {
  const it = pesanan.find(p => p.nama === nama);
  if (!it) return;
  it.jumlah--;
  if (it.jumlah <= 0) removeItem(nama);
}

/** Get items copy */
export function getItems() {
  return pesanan.map(p => ({ ...p }));
}

/** Clear order */
export function clearOrder() {
  pesanan = [];
}

/** Get total price (number) */
export function getTotal() {
  return pesanan.reduce((sum, p) => sum + (p.harga * p.jumlah), 0);
}