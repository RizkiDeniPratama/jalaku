/**
 * Jalaku — Cart Store (Nano Stores)
 *
 * State keranjang belanja yang reaktif dan persisted ke localStorage.
 * Digunakan oleh CartBadge (Header) dan CartManager (Checkout).
 *
 * Operasi: addToCart, removeFromCart, updateQty, clearCart
 */

import { atom, computed } from "nanostores";

export interface CartItem {
  product_id: string;
  slug: string;
  nama: string;
  harga: number;
  satuan: string;
  jumlah: number;
  image_url?: string;
}

const STORAGE_KEY = "jalaku_cart";

/** Atom utama — daftar item di keranjang */
export const $cartItems = atom<CartItem[]>([]);

/** Computed — jumlah total item di keranjang */
export const $cartCount = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.jumlah, 0)
);

/** Computed — total harga seluruh item */
export const $cartTotal = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.harga * item.jumlah, 0)
);

/**
 * Inisialisasi keranjang dari localStorage.
 * Panggil sekali saat aplikasi dimuat di client.
 */
export function initCart(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        $cartItems.set(parsed);
      }
    }
  } catch {
    // Ignore — localStorage mungkin tidak tersedia
  }
}

/** Persist ke localStorage setiap kali cart berubah */
function persistCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

// Auto-persist
$cartItems.listen(persistCart);

/**
 * Tambah item ke keranjang.
 * Jika produk sudah ada, jumlahnya ditambahkan.
 */
export function addToCart(
  item: Omit<CartItem, "jumlah">,
  qty = 1
): void {
  const items = $cartItems.get();
  const existing = items.find((i) => i.product_id === item.product_id);

  if (existing) {
    $cartItems.set(
      items.map((i) =>
        i.product_id === item.product_id
          ? { ...i, jumlah: i.jumlah + qty }
          : i
      )
    );
  } else {
    $cartItems.set([...items, { ...item, jumlah: qty }]);
  }
}

/** Hapus item dari keranjang */
export function removeFromCart(productId: string): void {
  $cartItems.set($cartItems.get().filter((i) => i.product_id !== productId));
}

/** Update jumlah item tertentu */
export function updateQty(productId: string, jumlah: number): void {
  if (jumlah <= 0) return removeFromCart(productId);
  $cartItems.set(
    $cartItems.get().map((i) =>
      i.product_id === productId ? { ...i, jumlah } : i
    )
  );
}

/** Kosongkan seluruh keranjang */
export function clearCart(): void {
  $cartItems.set([]);
}
