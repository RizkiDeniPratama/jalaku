import React, { useState } from "react";
import { ShoppingBag, X, Trash2, MessageCircle } from "lucide-react";
import { useCartStore } from "../../lib/store";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const cart = useCartStore((state) => state.cart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  // Fungsi untuk format Rupiah
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleCheckoutWA = () => {
    // 1. Nomor tujuan (Ganti dengan nomor ortumu, pastikan pakai 62 tanpa tanda + atau angka 0 di depan)
    const nomorWA = "082266529201";

    // 2. Menyusun daftar belanjaan dari keranjang (Zustand)
    const daftarBelanja = cart
      .map(
        (item) =>
          `- ${item.qty}x ${item.name} (${formatRupiah(item.price * item.qty)})`,
      )
      .join("\n"); // '\n' artinya enter / baris baru

    // 3. Menyusun template pesan lengkap
    const pesan = `Assalamualaikum Jalaku! Saya mau pesan:\n\n${daftarBelanja}\n\n*Total: ${formatRupiah(getTotalPrice())}*\n\nAlamat Pengiriman: \n(Tulis alamat lengkap di sini)\n\nMohon segera diproses ya. Terima kasih!`;

    // 4. Menerjemahkan teks agar aman dibaca oleh URL browser (mengubah spasi jadi %20, dll)
    const pesanEncoded = encodeURIComponent(pesan);

    // 5. Membuat link WhatsApp dan membukanya di tab baru
    const linkWA = `https://wa.me/${nomorWA}?text=${pesanEncoded}`;
    window.open(linkWA, "_blank");
  };

  return (
    <>
      {/* TOMBOL FLOATING DI POJOK KANAN BAWAH */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:bg-orange-700 transition-transform hover:scale-105 z-40 flex items-center justify-center"
      >
        <div className="relative">
          <ShoppingBag size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-orange-600">
              {cart.reduce((total, item) => total + item.qty, 0)}
            </span>
          )}
        </div>
      </button>

      {/* OVERLAY GELAP (Muncul kalau isOpen true) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* PANEL LACI KERANJANG DI SEBELAH KANAN */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header Laci */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-orange-600" /> Pesanan Saya
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Isi Keranjang */}
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
              <p>Keranjang masih kosong.</p>
              <p className="text-sm">Yuk, pilih menu hari ini!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-gray-50 pb-4"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.qty} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">
                      {formatRupiah(item.price * item.qty)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bagian Bawah (Checkout) */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-orange-600">
                {formatRupiah(getTotalPrice())}
              </span>
            </div>

            {/* Tombol ke WA (Logic API nya menyusul) */}
            <button
              onClick={handleCheckoutWA}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-200"
            >
              <MessageCircle size={20} />
              Pesan via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
