/**
 * Jalaku — ImageCarousel (React Island)
 *
 * Carousel galeri foto produk interaktif.
 *
 * Fitur:
 * - Main image besar + thumbnail strip di bawah
 * - Click thumbnail untuk ganti gambar utama
 * - Tombol prev/next
 * - Touch swipe support
 * - Smooth fade transition
 * - Fallback jika tidak ada foto
 */

import { useState, useRef, useCallback } from "react";

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface ImageCarouselProps {
  images: ProductImage[];
  productName: string;
}

export default function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  const totalImages = sortedImages.length;

  const goTo = useCallback((index: number) => {
    if (index === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [activeIndex, isTransitioning]);

  const goPrev = () => goTo(activeIndex > 0 ? activeIndex - 1 : totalImages - 1);
  const goNext = () => goTo(activeIndex < totalImages - 1 ? activeIndex + 1 : 0);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Fallback — no images
  if (totalImages === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100">
        <div className="text-center space-y-3">
          <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-text-muted">Belum ada foto</p>
        </div>
      </div>
    );
  }

  const currentImage = sortedImages[activeIndex];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImage.image_url}
          alt={`${productName} — foto ${activeIndex + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? "opacity-70" : "opacity-100"}`}
        />

        {/* Image counter */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
          <span className="text-xs font-medium text-white">
            {activeIndex + 1} / {totalImages}
          </span>
        </div>

        {/* Prev / Next buttons */}
        {totalImages > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-text hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Foto sebelumnya"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-text hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Foto berikutnya"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {totalImages > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => goTo(idx)}
              className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                idx === activeIndex
                  ? "border-primary shadow-md shadow-primary/20 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-200"
              }`}
              aria-label={`Lihat foto ${idx + 1}`}
            >
              <img
                src={img.image_url}
                alt={`${productName} — thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
