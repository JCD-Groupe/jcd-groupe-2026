// src/utils/formatters.ts

export const fetchSvgContent = async (id: string): Promise<string | null> => {
  if (!id) return null;
  try {
    const response = await fetch(
      `${import.meta.env.PUBLIC_DIRECTUS_URL}/assets/${id}`,
    );
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error(`Erreur chargement SVG (${id}):`, error);
    return null;
  }
};

export function hexToRgbChannels(hex: string): string {
  if (!hex) return "0, 0, 0";
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}
