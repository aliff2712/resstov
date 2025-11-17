// js/menu.js

export const menu = [
  { 
    nama: 'Burger', 
    harga: 25000, 
    kategori: 'makanan', 
    gambar: 'burger.jpg' 
  },
  { 
    nama: 'Kentang Goreng', 
    harga: 15000, 
    kategori: 'makanan', 
    gambar: 'kentang.jpg' 
  },
  { 
    nama: 'Cola', 
    harga: 10000, 
    kategori: 'minuman', 
    gambar: 'cola.jpg' 
  },
  { 
    nama: 'Es Krim Sundae', 
    harga: 12000, 
    kategori: 'dessert', 
    gambar: 'eskrim.jpg' 
  },
  { 
    nama: 'Ayam Goreng', 
    harga: 25000, 
    kategori: 'makanan', 
    gambar: 'ayam.jpg' 
  },
  { 
    nama: 'Lemonade', 
    harga: 8000, 
    kategori: 'minuman', 
    gambar: 'lemonade.jpg' 
  },
  { 
    nama: 'Puding Coklat', 
    harga: 9000, 
    kategori: 'dessert', 
    gambar: 'puding.jpg' 
  },
  { 
    nama: 'Nasi Goreng', 
    harga: 20000, 
    kategori: 'makanan', 
    gambar: 'nasigoreng.jpg' 
  },
  { 
    nama: 'Teh Manis', 
    harga: 7000, 
    kategori: 'minuman', 
    gambar: 'tehmanis.jpg' 
  },
  { 
    nama: 'Kue Lapis', 
    harga: 11000, 
    kategori: 'dessert', 
    gambar: 'kuelapis.jpg' 
  }
];

/**
 * Get menu by category
 * @param {String} kategori - Category name ('all', 'makanan', 'minuman', 'dessert')
 * @returns {Array} Filtered menu items
 */
export function getMenuByCategory(kategori) {
  if (kategori === 'all') {
    return menu;
  }
  return menu.filter(item => item.kategori === kategori);
}