/**
 * KOLO paleta boja — preuzeto iz UI mockupa
 * Sve vrednosti odgovaraju standardnim Tailwind CSS bojama.
 * Koristiti Tailwind klase (green-700, gray-50...) gde je moguće.
 * Ovaj fajl je za inline stilove i dinamičke vrednosti.
 */

export const colors = {
  green900: "#14532d",
  green700: "#15803d",
  green600: "#16a34a",
  green500: "#22c55e",
  green100: "#dcfce7",
  green50:  "#f0fdf4",

  amber500: "#f59e0b",
  amber400: "#fbbf24",
  amber100: "#fef3c7",
  amber50:  "#fffbeb",

  red500: "#ef4444",
  red100: "#fee2e2",
  red50:  "#fef2f2",

  blue500: "#3b82f6",
  blue50:  "#eff6ff",

  gray900: "#111827",
  gray700: "#374151",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  gray50:  "#f9fafb",

  white: "#ffffff",
} as const;

export type ColorKey = keyof typeof colors;
