import React from 'react';
import {
  Utensils,
  UtensilsCrossed,
  Coffee,
  Sandwich,
  Apple,
  Wine,
  Beer,
  Car,
  Fuel,
  Bus,
  Bike,
  Train,
  Plane,
  Truck,
  ShoppingBag,
  Shirt,
  Package,
  Tag,
  Scissors,
  Zap,
  Home,
  Wifi,
  Smartphone,
  Receipt,
  Flame,
  Wrench,
  HeartPulse,
  Heart,
  Dumbbell,
  Hospital,
  Pill,
  Stethoscope,
  Film,
  Tv,
  Gamepad2,
  Camera,
  Laptop,
  Music,
  Trophy,
  Wallet,
  PiggyBank,
  CreditCard,
  Banknote,
  Landmark,
  CircleDollarSign,
  Coins,
  Briefcase,
  GraduationCap,
  Book,
  Baby,
  Gift,
  Sparkles,
  Smile,
  Scale,
  Shield,
  Watch,
  Layers
} from 'lucide-react';

export const iconMap = {
  Utensils,
  UtensilsCrossed,
  Coffee,
  Sandwich,
  Apple,
  Wine,
  Beer,
  Car,
  Fuel,
  Bus,
  Bike,
  Train,
  Plane,
  Truck,
  ShoppingBag,
  Shirt,
  Package,
  Tag,
  Scissors,
  Zap,
  Home,
  Wifi,
  Smartphone,
  Receipt,
  Flame,
  Wrench,
  HeartPulse,
  Heart,
  Dumbbell,
  Hospital,
  Pill,
  Stethoscope,
  Film,
  Tv,
  Gamepad2,
  Camera,
  Laptop,
  Music,
  Trophy,
  Wallet,
  PiggyBank,
  CreditCard,
  Banknote,
  Landmark,
  CircleDollarSign,
  Coins,
  Briefcase,
  GraduationCap,
  Book,
  Baby,
  Gift,
  Sparkles,
  Smile,
  Scale,
  Shield,
  Watch,
  Layers
};

// 52 Curated Open-Source Lucide Vector Icons
export const AVAILABLE_VECTOR_ICONS = [
  // Kuliner & Minum
  { name: 'Utensils', label: 'Makan & Resto', group: 'Kuliner' },
  { name: 'UtensilsCrossed', label: 'Kuliner Spesial', group: 'Kuliner' },
  { name: 'Coffee', label: 'Kopi & Kafe', group: 'Kuliner' },
  { name: 'Sandwich', label: 'Snack / Roti', group: 'Kuliner' },
  { name: 'Apple', label: 'Buah & Makanan Sehat', group: 'Kuliner' },
  { name: 'Wine', label: 'Nongkrong / Bar', group: 'Kuliner' },
  { name: 'Beer', label: 'Minuman / Pesta', group: 'Kuliner' },

  // Transportasi & Perjalanan
  { name: 'Car', label: 'Mobil / Ojol', group: 'Transport' },
  { name: 'Fuel', label: 'Bensin & SPBU', group: 'Transport' },
  { name: 'Bus', label: 'Busway / Angkot', group: 'Transport' },
  { name: 'Bike', label: 'Sepeda / Motor', group: 'Transport' },
  { name: 'Train', label: 'KRL / Kereta Api', group: 'Transport' },
  { name: 'Plane', label: 'Pesawat & Liburan', group: 'Transport' },
  { name: 'Truck', label: 'Pindahan / Ekspedisi', group: 'Transport' },

  // Belanja & Fashion
  { name: 'ShoppingBag', label: 'Belanja & Mall', group: 'Belanja' },
  { name: 'Shirt', label: 'Pakaian & Fashion', group: 'Belanja' },
  { name: 'Package', label: 'Paket / Olshop', group: 'Belanja' },
  { name: 'Tag', label: 'Diskon & Promo', group: 'Belanja' },
  { name: 'Scissors', label: 'Potong Rambut / Salon', group: 'Belanja' },

  // Tagihan, Rumah & Utilitas
  { name: 'Zap', label: 'Listrik PLN', group: 'Tagihan' },
  { name: 'Home', label: 'Sewa Rumah / Kost', group: 'Tagihan' },
  { name: 'Wifi', label: 'Internet & WiFi', group: 'Tagihan' },
  { name: 'Smartphone', label: 'Pulsa & Paket Data', group: 'Tagihan' },
  { name: 'Receipt', label: 'Struk / Tagihan Bulanan', group: 'Tagihan' },
  { name: 'Flame', label: 'Gas LPG', group: 'Tagihan' },
  { name: 'Wrench', label: 'Servis / Reparasi', group: 'Tagihan' },

  // Kesehatan & Olahraga
  { name: 'HeartPulse', label: 'Kesehatan & Medis', group: 'Kesehatan' },
  { name: 'Pill', label: 'Obat & Apotek', group: 'Kesehatan' },
  { name: 'Stethoscope', label: 'Dokter / Checkup', group: 'Kesehatan' },
  { name: 'Hospital', label: 'Rumah Sakit', group: 'Kesehatan' },
  { name: 'Dumbbell', label: 'Gym & Fitness', group: 'Kesehatan' },
  { name: 'Heart', label: 'Perawatan Diri', group: 'Kesehatan' },

  // Hiburan & Gadget
  { name: 'Film', label: 'Bioskop & Film', group: 'Hiburan' },
  { name: 'Tv', label: 'Streaming / TV', group: 'Hiburan' },
  { name: 'Gamepad2', label: 'Game & Top-up', group: 'Hiburan' },
  { name: 'Music', label: 'Musik / Spotify', group: 'Hiburan' },
  { name: 'Camera', label: 'Fotografi / Hobi', group: 'Hiburan' },
  { name: 'Laptop', label: 'Elektronik / Laptop', group: 'Hiburan' },
  { name: 'Trophy', label: 'Prestasi / Lomba', group: 'Hiburan' },

  // Finansial & Kerja
  { name: 'Wallet', label: 'Dompet & Kas', group: 'Finansial' },
  { name: 'PiggyBank', label: 'Tabungan Masa Depan', group: 'Finansial' },
  { name: 'CreditCard', label: 'Kartu Kredit / Paylater', group: 'Finansial' },
  { name: 'Banknote', label: 'Tarik Tunai', group: 'Finansial' },
  { name: 'Coins', label: 'Investasi & Emas', group: 'Finansial' },
  { name: 'Landmark', label: 'Pajak & Bank', group: 'Finansial' },
  { name: 'Briefcase', label: 'Bisnis / Kantor', group: 'Finansial' },

  // Pendidikan & Keluarga
  { name: 'GraduationCap', label: 'Kuliah & Sekolah', group: 'Pendidikan' },
  { name: 'Book', label: 'Buku & Kursus', group: 'Pendidikan' },
  { name: 'Baby', label: 'Perlengkapan Bayi', group: 'Keluarga' },
  { name: 'Gift', label: 'Hadiah / Sedekah', group: 'Sosial' },
  { name: 'Sparkles', label: 'Skincare & Kecantikan', group: 'Lifestyle' },
  { name: 'Layers', label: 'Lain-lain', group: 'Umum' }
];

// 60+ Curated Vibrant Emojis for Instant Recognition & Colorful UI
export const AVAILABLE_EMOJI_ICONS = [
  // Makanan & Minuman
  { emoji: '🍔', label: 'Burger / Makanan Cepat Saji', group: 'Kuliner' },
  { emoji: '☕', label: 'Kopi & Nongkrong', group: 'Kuliner' },
  { emoji: '🍕', label: 'Pizza & Camilan', group: 'Kuliner' },
  { emoji: '🍜', label: 'Bakso / Mie / Ramen', group: 'Kuliner' },
  { emoji: '🍱', label: 'Nasi Kotak / Katering', group: 'Kuliner' },
  { emoji: '🍰', label: 'Kue & Dessert', group: 'Kuliner' },
  { emoji: '🍹', label: 'Minuman / Jus / Boba', group: 'Kuliner' },
  { emoji: '🍦', label: 'Es Krim & Manisan', group: 'Kuliner' },
  { emoji: '🥩', label: 'Daging & Steak', group: 'Kuliner' },
  { emoji: '🥪', label: 'Sarapan & Roti', group: 'Kuliner' },
  { emoji: '🍣', label: 'Sushi & Kuliner Jepang', group: 'Kuliner' },
  { emoji: '🥗', label: 'Salad & Diet', group: 'Kuliner' },

  // Belanja & Fashion
  { emoji: '🛒', label: 'Belanja Supermarket', group: 'Belanja' },
  { emoji: '🛍️', label: 'Belanja Mall & Olshop', group: 'Belanja' },
  { emoji: '👕', label: 'Pakaian & Kaos', group: 'Belanja' },
  { emoji: '👗', label: 'Gaun & Fashion Wanita', group: 'Belanja' },
  { emoji: '👟', label: 'Sepatu & Sneakers', group: 'Belanja' },
  { emoji: '💄', label: 'Skincare & Kosmetik', group: 'Belanja' },
  { emoji: '💍', label: 'Perhiasan & Aksesoris', group: 'Belanja' },
  { emoji: '📦', label: 'Paket & Ekspedisi', group: 'Belanja' },

  // Transportasi & Bensin
  { emoji: '🚗', label: 'Mobil & Bensin', group: 'Transport' },
  { emoji: '⛽', label: 'SPBU & Bahan Bakar', group: 'Transport' },
  { emoji: '🛵', label: 'Motor & Ojek Online', group: 'Transport' },
  { emoji: '🚆', label: 'Kereta KRL / MRT', group: 'Transport' },
  { emoji: '🚌', label: 'Bus & Angkutan', group: 'Transport' },
  { emoji: '✈️', label: 'Pesawat & Liburan', group: 'Transport' },
  { emoji: '🚕', label: 'Taksi / Grab Car', group: 'Transport' },
  { emoji: '🚲', label: 'Sepeda Gowes', group: 'Transport' },
  { emoji: '🅿️', label: 'Parkir Kendaraan', group: 'Transport' },

  // Tagihan & Rumah Tangga
  { emoji: '⚡', label: 'Listrik & Token PLN', group: 'Tagihan' },
  { emoji: '🏠', label: 'Sewa Rumah / Kost', group: 'Tagihan' },
  { emoji: '💧', label: 'Air PDAM & Galon', group: 'Tagihan' },
  { emoji: '📶', label: 'WiFi & Internet Rumah', group: 'Tagihan' },
  { emoji: '📱', label: 'Pulsa & Kuota HP', group: 'Tagihan' },
  { emoji: '🧾', label: 'Tagihan Bulanan', group: 'Tagihan' },
  { emoji: '🔧', label: 'Reparasi & Bengkel', group: 'Tagihan' },
  { emoji: '🧹', label: 'Kebersihan & Laundry', group: 'Tagihan' },

  // Hiburan, Gadget & Hobi
  { emoji: '🎬', label: 'Bioskop & Film', group: 'Hiburan' },
  { emoji: '🎮', label: 'Game Console & PC', group: 'Hiburan' },
  { emoji: '🍿', label: 'Nonton & Bioskop', group: 'Hiburan' },
  { emoji: '🎧', label: 'Musik, Konser & Audio', group: 'Hiburan' },
  { emoji: '⚽', label: 'Olahraga & Futsal', group: 'Hiburan' },
  { emoji: '🏋️', label: 'Gym & Fitness', group: 'Hiburan' },
  { emoji: '📸', label: 'Kamera & Konten', group: 'Hiburan' },
  { emoji: '💻', label: 'Laptop & Software', group: 'Hiburan' },
  { emoji: '🎨', label: 'Seni & Hobi Kreatif', group: 'Hiburan' },
  { emoji: '🎟️', label: 'Tiket Acara & Wisata', group: 'Hiburan' },

  // Kesehatan & Medis
  { emoji: '💊', label: 'Obat & Vitamin', group: 'Kesehatan' },
  { emoji: '🩺', label: 'Konsultasi Dokter', group: 'Kesehatan' },
  { emoji: '🏥', label: 'Rumah Sakit & Klinik', group: 'Kesehatan' },
  { emoji: '🦷', label: 'Dokter Gigi', group: 'Kesehatan' },
  { emoji: '🩹', label: 'P3K & Perawatan', group: 'Kesehatan' },
  { emoji: '🧘', label: 'Yoga & Meditasi', group: 'Kesehatan' },

  // Finansial, Edukasi & Lainnya
  { emoji: '📚', label: 'Buku & Kuliah', group: 'Edukasi' },
  { emoji: '🎓', label: 'Kursus & Sertifikasi', group: 'Edukasi' },
  { emoji: '💰', label: 'Tabungan & Dana Darurat', group: 'Finansial' },
  { emoji: '💳', label: 'Cicilan & Kartu Kredit', group: 'Finansial' },
  { emoji: '📈', label: 'Saham & Kripto', group: 'Finansial' },
  { emoji: '🎁', label: 'Kado & Traktir Teman', group: 'Sosial' },
  { emoji: '🐱', label: 'Kucing & Hewan Piaraan', group: 'Peliharaan' },
  { emoji: '👶', label: 'Susu Bayi & Anak', group: 'Keluarga' },
  { emoji: '🏷️', label: 'Kategori Lain-lain', group: 'Umum' }
];

// Backward-compatibility alias
export const AVAILABLE_CATEGORY_ICONS = AVAILABLE_VECTOR_ICONS;

// Helper to detect if a string is an emoji
export const isEmojiString = (str) => {
  if (!str) return false;
  if (iconMap[str]) return false;
  return /\p{Extended_Pictographic}/u.test(str) || str.length <= 4;
};

export const CategoryIcon = ({ name, size = 18, className = '', color }) => {
  if (!name) {
    return <Tag size={size} className={className} style={color ? { color } : undefined} />;
  }

  // If name is an emoji
  if (isEmojiString(name)) {
    return (
      <span
        className={`category-emoji-badge ${className}`}
        style={{
          fontSize: `${Math.round(size * 1.15)}px`,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif'
        }}
        role="img"
        aria-label={name}
      >
        {name}
      </span>
    );
  }

  // If name is a Lucide Vector icon
  const IconComponent = iconMap[name] || Tag;
  return <IconComponent size={size} className={className} style={color ? { color } : undefined} />;
};

export default CategoryIcon;
