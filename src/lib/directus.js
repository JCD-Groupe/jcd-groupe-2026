import { createDirectus, rest } from "@directus/sdk";

// Astro récupère automatiquement l'URL selon l'environnement
export const directus = createDirectus(
  import.meta.env.PUBLIC_DIRECTUS_URL,
).with(rest());
