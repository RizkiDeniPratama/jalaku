/**
 * Jalaku — CartBadge (React Mini-Island)
 *
 * Badge kecil di Header yang menampilkan jumlah item keranjang.
 * Menggunakan Nano Stores agar reaktif lintas halaman.
 */

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cartCount, initCart } from "../../stores/cartStore";

export default function CartBadge() {
  const count = useStore($cartCount);

  useEffect(() => {
    initCart();
  }, []);

  return (
    <a
      href="/checkout"
      className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors group"
      aria-label={`Keranjang: ${count} item`}
    >
      <svg
        className="w-6 h-6 text-text group-hover:text-primary transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.75"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold px-1 animate-fade-in-scale">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
}
