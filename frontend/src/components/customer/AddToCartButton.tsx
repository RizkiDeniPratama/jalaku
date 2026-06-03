/**
 * Jalaku — AddToCartButton (React Island)
 *
 * Tombol "Tambah ke Keranjang" di halaman detail produk.
 * Menggunakan cartStore untuk menambah item.
 */

import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cartItems, addToCart, initCart } from "../../stores/cartStore";

interface AddToCartButtonProps {
  productId: string;
  slug: string;
  nama: string;
  harga: number;
  satuan: string;
  stok: number;
  imageUrl?: string;
}

export default function AddToCartButton({
  productId, slug, nama, harga, satuan, stok, imageUrl
}: AddToCartButtonProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const items = useStore($cartItems);

  useEffect(() => {
    initCart();
  }, []);

  const existingItem = items.find((i) => i.product_id === productId);
  const currentInCart = existingItem?.jumlah || 0;
  const maxQty = Math.max(1, stok - currentInCart);

  function handleAdd() {
    addToCart(
      { product_id: productId, slug, nama, harga, satuan, image_url: imageUrl },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    setQty(1);
  }

  function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  if (stok <= 0) {
    return (
      <div className="space-y-3">
        <button disabled className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed">
          Stok Habis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Qty Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text">Jumlah:</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 flex items-center justify-center text-text-light hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={(e) => {
              const v = Number(e.target.value);
              setQty(Math.max(1, Math.min(maxQty, v)));
            }}
            className="w-14 h-10 text-center text-sm font-semibold text-text border-x border-gray-200 focus:outline-none"
          />
          <button
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            className="w-10 h-10 flex items-center justify-center text-text-light hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <span className="text-sm text-text-muted">{satuan}</span>
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-text-light">Subtotal</span>
        <span className="text-lg font-bold text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
          {formatRupiah(harga * qty)}
        </span>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAdd}
        disabled={added}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 cursor-pointer relative overflow-hidden group ${
          added
            ? "bg-success"
            : "hover:shadow-lg hover:shadow-primary/25"
        }`}
        style={!added ? { background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" } : undefined}
      >
        {!added && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {added ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Ditambahkan!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Tambah ke Keranjang
            </>
          )}
        </span>
      </button>

      {/* Cart info */}
      {currentInCart > 0 && (
        <p className="text-xs text-text-muted text-center animate-fade-in">
          Sudah ada {currentInCart} {satuan} di keranjang •{" "}
          <a href="/checkout" className="text-primary font-medium hover:underline">
            Lihat keranjang
          </a>
        </p>
      )}
    </div>
  );
}
