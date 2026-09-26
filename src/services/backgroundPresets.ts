export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'apple' | 'grain' | 'gradient' | 'minimal';
  type: 'gradient' | 'solid' | 'grain' | 'none' | 'image';
  value: string; // CSS background string or url(...)
  preview: string; // Hex or gradient string for UI preview chip
  imageUrl?: string; // Optional direct image URL for photographic backdrops
  badge?: string; // e.g. "Sequoia", "Sonoma", "XDR", "M3", "Classic"
  hasGrain?: boolean;
  grainIntensity?: number;
  description?: string;
}

export const NOISE_SVG_DATA_URL = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.35'/%3E%3C/svg%3E`;

export const DEFAULT_BACKGROUND_VALUE = 'radial-gradient(ellipse at 70% 30%, #06b6d4 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #050508 100%)';
export const DEFAULT_RECORDER_BACKGROUND = {
  type: 'gradient' as const,
  value: DEFAULT_BACKGROUND_VALUE,
  padding: 24,
  borderRadius: 12,
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ─── APPLE KEYNOTE & MACOS WALLPAPER COLLECTION ──────────────────────
  {
    id: 'apple_sequoia_helios',
    name: 'macOS Sequoia Helios',
    category: 'apple',
    type: 'gradient',
    badge: 'Sequoia',
    value: 'linear-gradient(135deg, #022013 0%, #064e3b 25%, #059669 50%, #d97706 80%, #fbbf24 100%)',
    preview: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #fbbf24 100%)',
    description: 'Official macOS 15 Sequoia Helios dark emerald and sunrise amber',
  },
  {
    id: 'apple_sequoia_canopy',
    name: 'Sequoia Redwood Canopy',
    category: 'apple',
    type: 'gradient',
    badge: 'Sequoia',
    value: 'linear-gradient(135deg, #021a10 0%, #063d2e 30%, #0f5132 55%, #198754 80%, #75b798 100%)',
    preview: 'linear-gradient(135deg, #063d2e 0%, #0f5132 50%, #75b798 100%)',
    description: 'macOS Sequoia tranquil redwood canopy and eucalyptus mist',
  },
  {
    id: 'apple_sonoma_horizon',
    name: 'macOS Sonoma Horizon',
    category: 'apple',
    type: 'gradient',
    badge: 'Sonoma',
    value: 'linear-gradient(135deg, #180b2a 0%, #2e1065 25%, #831843 55%, #c2410c 80%, #fb923c 100%)',
    preview: 'linear-gradient(135deg, #2e1065 0%, #831843 50%, #fb923c 100%)',
    description: 'Official macOS 14 Sonoma sunset twilight horizon',
  },
  {
    id: 'apple_sonoma_coast',
    name: 'Sonoma Coastal Sky',
    category: 'apple',
    type: 'gradient',
    badge: 'Sonoma',
    value: 'linear-gradient(140deg, #1e3a8a 0%, #3b82f6 35%, #93c5fd 65%, #fed7aa 90%, #fef3c7 100%)',
    preview: 'linear-gradient(140deg, #1e3a8a 0%, #3b82f6 50%, #fef3c7 100%)',
    description: 'macOS Sonoma daytime rolling coastal hills and golden light',
  },
  {
    id: 'apple_ventura_bloom',
    name: 'macOS Ventura Bloom',
    category: 'apple',
    type: 'gradient',
    badge: 'Ventura',
    value: 'linear-gradient(135deg, #431407 0%, #7c2d12 30%, #c2410c 60%, #ea580c 85%, #fbbf24 100%)',
    preview: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 60%, #fbbf24 100%)',
    description: 'Official macOS 13 Ventura radiant California poppy bloom',
  },
  {
    id: 'apple_monterey_canyon',
    name: 'macOS Monterey Canyon',
    category: 'apple',
    type: 'gradient',
    badge: 'Monterey',
    value: 'linear-gradient(135deg, #110d29 0%, #241442 25%, #4c1d95 45%, #a21caf 70%, #f43f5e 95%)',
    preview: 'linear-gradient(135deg, #241442 0%, #4c1d95 45%, #f43f5e 100%)',
    description: 'Official macOS 12 Monterey layered canyon abstract',
  },
  {
    id: 'apple_big_sur_abstract',
    name: 'macOS Big Sur Horizon',
    category: 'apple',
    type: 'gradient',
    badge: 'Big Sur',
    value: 'linear-gradient(135deg, #09122c 0%, #1e1b4b 20%, #4338ca 45%, #db2777 75%, #f97316 100%)',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #db2777 60%, #f97316 100%)',
    description: 'Official macOS 11 Big Sur dynamic sunset coastal layers',
  },
  {
    id: 'apple_catalina_twilight',
    name: 'macOS Catalina Oceanic',
    category: 'apple',
    type: 'gradient',
    badge: 'Catalina',
    value: 'linear-gradient(145deg, #050b14 0%, #0c192c 30%, #102a45 60%, #1a4971 85%, #38bdf8 100%)',
    preview: 'linear-gradient(145deg, #0c192c 0%, #1a4971 60%, #38bdf8 100%)',
    description: 'macOS 10.15 Catalina deep Pacific oceanic twilight',
  },
  {
    id: 'apple_mojave_dunes',
    name: 'macOS Mojave Night Dunes',
    category: 'apple',
    type: 'gradient',
    badge: 'Mojave',
    value: 'linear-gradient(140deg, #090910 0%, #111122 30%, #1b1b36 55%, #2a2850 75%, #4f46e5 100%)',
    preview: 'linear-gradient(140deg, #090910 0%, #1b1b36 50%, #4f46e5 100%)',
    description: 'macOS 10.14 Mojave starry desert twilight dunes',
  },
  {
    id: 'apple_pro_display_xdr',
    name: 'Pro Display XDR Mesh',
    category: 'apple',
    type: 'gradient',
    badge: 'XDR',
    value: 'radial-gradient(ellipse at 70% 30%, #06b6d4 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #050508 100%)',
    preview: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
    description: 'Apple Pro Display XDR 6K chromatic lattice wave',
  },
  {
    id: 'apple_studio_spectrum',
    name: 'Studio Display Ribbon',
    category: 'apple',
    type: 'gradient',
    badge: 'Studio',
    value: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 35%, #db2777 70%, #f43f5e 100%)',
    preview: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #f43f5e 100%)',
    description: 'Apple Studio Display keynote chromatic ribbon gradient',
  },
  {
    id: 'apple_intelligence_aura',
    name: 'Apple Intelligence Siri Aura',
    category: 'apple',
    type: 'gradient',
    badge: 'AI',
    value: 'radial-gradient(ellipse at 30% 20%, #38bdf8 0%, #6366f1 35%, #a855f7 65%, #050508 95%)',
    preview: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #a855f7 100%)',
    description: 'Official 2024 Apple Intelligence radiant iridescent glow',
  },
  {
    id: 'apple_space_black',
    name: 'MacBook Space Black',
    category: 'apple',
    type: 'gradient',
    badge: 'MacBook',
    value: 'linear-gradient(145deg, #090a0d 0%, #13161c 35%, #1e222a 65%, #0d0e12 100%)',
    preview: 'linear-gradient(145deg, #090a0d, #1e222a)',
    description: 'Apple MacBook Pro M3 Space Black anodized titanium',
  },
  {
    id: 'apple_titanium_desert',
    name: 'iPhone 16 Desert Titanium',
    category: 'apple',
    type: 'gradient',
    badge: 'Titanium',
    value: 'linear-gradient(140deg, #181512 0%, #2b2520 35%, #3f362f 65%, #584c42 85%, #847364 100%)',
    preview: 'linear-gradient(140deg, #2b2520 0%, #584c42 60%, #847364 100%)',
    description: 'iPhone 16 Pro Desert Titanium warm architectural sheen',
  },
  {
    id: 'apple_titanium_natural',
    name: 'iPhone Natural Titanium',
    category: 'apple',
    type: 'gradient',
    badge: 'Titanium',
    value: 'linear-gradient(140deg, #151719 0%, #25282d 35%, #373b43 65%, #4a505b 85%, #646b7a 100%)',
    preview: 'linear-gradient(140deg, #25282d 0%, #4a505b 60%, #646b7a 100%)',
    description: 'iPhone 15/16 Pro Natural Titanium bead-blasted satin metal',
  },
  {
    id: 'apple_imac_oceanic',
    name: 'iMac M3 Marine Blue',
    category: 'apple',
    type: 'gradient',
    badge: 'iMac',
    value: 'linear-gradient(135deg, #041d33 0%, #073b61 35%, #0c619b 70%, #38bdf8 100%)',
    preview: 'linear-gradient(135deg, #073b61 0%, #0c619b 50%, #38bdf8 100%)',
    description: 'iMac 24" vibrant two-tone marine blue',
  },
  {
    id: 'apple_imac_coral',
    name: 'iMac M3 Sunset Coral',
    category: 'apple',
    type: 'gradient',
    badge: 'iMac',
    value: 'linear-gradient(135deg, #3d0a14 0%, #701325 35%, #b91c1c 65%, #f43f5e 85%, #fb7185 100%)',
    preview: 'linear-gradient(135deg, #701325 0%, #b91c1c 50%, #fb7185 100%)',
    description: 'iMac 24" radiant sunset coral & ruby',
  },
  {
    id: 'apple_classic_aurora',
    name: 'Mac OS X Leopard Aurora',
    category: 'apple',
    type: 'gradient',
    badge: 'Classic',
    value: 'linear-gradient(135deg, #020617 0%, #0f172a 25%, #1e1b4b 50%, #06b6d4 80%, #a855f7 100%)',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #06b6d4 100%)',
    description: 'Steve Jobs keynote classic Mac OS X space aurora borealis',
  },
  {
    id: 'apple_keynote_light',
    name: 'Keynote Studio Light',
    category: 'apple',
    type: 'gradient',
    badge: 'Keynote',
    value: 'linear-gradient(140deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 75%, #cbd5e1 100%)',
    preview: 'linear-gradient(140deg, #f8fafc, #cbd5e1)',
    description: 'Apple keynote presentation anodized aluminum stage',
  },
  // Photographic Apple Scenic Wallpapers (Curated high-res Unsplash CDN)
  {
    id: 'apple_photo_yosemite',
    name: 'Yosemite El Capitan',
    category: 'apple',
    type: 'image',
    badge: 'Photo',
    imageUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80',
    value: 'url("https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80")',
    preview: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    description: 'Iconic Yosemite granite monolith bathed in twilight alpenglow',
  },
  {
    id: 'apple_photo_sequoia_forest',
    name: 'Sequoia Giant Woods',
    category: 'apple',
    type: 'image',
    badge: 'Photo',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    value: 'url("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80")',
    preview: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #15803d 100%)',
    description: 'Lush misty California sequoia forest with sunbeams',
  },
  {
    id: 'apple_photo_big_sur_coast',
    name: 'Big Sur Pacific Coast',
    category: 'apple',
    type: 'image',
    badge: 'Photo',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    value: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80")',
    preview: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)',
    description: 'Dramatic Pacific ocean shoreline and coastal cliffs',
  },

  // ─── ANALOG GRAIN & FILM TEXTURE COLLECTION ──────────────────────────
  {
    id: 'grain_velvet_noir',
    name: 'Velvet Noir Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.14,
    value: 'linear-gradient(135deg, #09090b 0%, #111115 50%, #18181b 100%)',
    preview: '#111115',
    description: 'Ultra-deep obsidian black with 35mm organic film grain',
  },
  {
    id: 'grain_cyber_dusk',
    name: 'Cyber Dusk Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.15,
    value: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 45%, #701a75 75%, #0f172a 100%)',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #701a75 100%)',
    description: 'Indigo and deep violet nebula with gritty retro grain',
  },
  {
    id: 'grain_retro_acid',
    name: 'Retro Acid Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.16,
    value: 'linear-gradient(135deg, #142805 0%, #2e4a0b 40%, #4d7c0f 75%, #84cc16 100%)',
    preview: 'linear-gradient(135deg, #142805 0%, #4d7c0f 100%)',
    description: 'Acid chartreuse moss with tactile risograph grain',
  },
  {
    id: 'grain_sand_parchment',
    name: 'Tactile Parchment Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.12,
    value: 'linear-gradient(135deg, #f5f0eb 0%, #eae3dc 50%, #ded4cb 100%)',
    preview: '#eae3dc',
    description: 'Warm textured Japanese craft paper with organic grain',
  },
  {
    id: 'grain_nordic_mist',
    name: 'Nordic Mist Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.13,
    value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    preview: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    description: 'Muted slate and frosted fjord mist with matte noise',
  },
  {
    id: 'grain_crimson_dusk',
    name: 'Crimson Dusk Grain',
    category: 'grain',
    type: 'grain',
    hasGrain: true,
    grainIntensity: 0.14,
    value: 'linear-gradient(135deg, #2b030b 0%, #500718 45%, #881337 75%, #0f0204 100%)',
    preview: 'linear-gradient(135deg, #2b030b 0%, #881337 100%)',
    description: 'Bordeaux wine red and deep dusk with warm analog grain',
  },

  // ─── MODERN GRADIENTS ────────────────────────────────────────────────
  {
    id: 'cosmic',
    name: 'Cosmic Indigo',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    preview: '#312e81',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #4c0519 0%, #881337 50%, #f43f5e 100%)',
    preview: '#881337',
  },
  {
    id: 'emerald',
    name: 'Emerald Aurora',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)',
    preview: '#065f46',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Studio',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
    preview: '#18181b',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #2e1065 0%, #6b21a8 50%, #ec4899 100%)',
    preview: '#6b21a8',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    category: 'gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #38bdf8 100%)',
    preview: '#0369a1',
  },

  // ─── MINIMAL / DIRECT FIT ───────────────────────────────────────────
  {
    id: 'studio_dark',
    name: 'Studio Dark',
    category: 'minimal',
    type: 'solid',
    value: '#0f1115',
    preview: '#0f1115',
  },
  {
    id: 'titanium_slate',
    name: 'Titanium Slate',
    category: 'minimal',
    type: 'solid',
    value: '#1e2229',
    preview: '#1e2229',
  },
  {
    id: 'clean_light',
    name: 'Clean Light Studio',
    category: 'minimal',
    type: 'gradient',
    value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
    preview: '#e2e8f0',
  },
  {
    id: 'transparent',
    name: 'Direct Fit (No Border)',
    category: 'minimal',
    type: 'none',
    value: 'transparent',
    preview: '#000000',
  },
];

// Pre-cached procedural grain pattern for high performance canvas rendering
let cachedNoisePattern: CanvasPattern | null = null;

function getNoisePattern(): CanvasPattern | null {
  if (cachedNoisePattern) return cachedNoisePattern;
  if (typeof document === 'undefined') return null;

  try {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 128;
    patternCanvas.height = 128;
    const pctx = patternCanvas.getContext('2d');
    if (!pctx) return null;

    const imgData = pctx.createImageData(128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = Math.floor(Math.random() * 32) + 12; // subtle alpha
    }
    pctx.putImageData(imgData, 0, 0);

    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d');
    if (tmpCtx) {
      cachedNoisePattern = tmpCtx.createPattern(patternCanvas, 'repeat');
    }
  } catch {
    // ignore
  }
  return cachedNoisePattern;
}

// Image cache for photographic backgrounds to ensure instant canvas rendering
const imageCache = new Map<string, HTMLImageElement>();

function getOrLoadImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    imageCache.set(url, img);
  }
  return img;
}

/**
 * High performance canvas background renderer that supports gradients,
 * Apple presets, photographic backdrops, solid colors, and organic film grain overlay.
 */
export function renderBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string
): void {
  const matchedPreset = BACKGROUND_PRESETS.find(
    (p) => p.value === background || p.id === background
  );

  const hasGrain = matchedPreset?.hasGrain || background.includes('grain');

  // 1. Check for photographic image backdrop
  const imageUrl = matchedPreset?.imageUrl || (background.startsWith('url(') ? background.slice(4, -1).replace(/["']/g, '') : null);
  if (imageUrl) {
    const img = getOrLoadImage(imageUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
      if (hasGrain) {
        const pattern = getNoisePattern();
        if (pattern) {
          ctx.save();
          ctx.globalAlpha = matchedPreset?.grainIntensity || 0.14;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }
      return;
    }
  }

  // 2. Gradients rendering
  if (background.startsWith('linear-gradient') || background.startsWith('radial-gradient')) {
    const grad = ctx.createLinearGradient(0, 0, width, height);

    // Dynamic gradient color stops matching our presets
    if (background.includes('#022013')) {
      // Sequoia Helios
      grad.addColorStop(0, '#022013');
      grad.addColorStop(0.25, '#064e3b');
      grad.addColorStop(0.5, '#059669');
      grad.addColorStop(0.8, '#d97706');
      grad.addColorStop(1, '#fbbf24');
    } else if (background.includes('#180b2a')) {
      // Sonoma Horizon
      grad.addColorStop(0, '#180b2a');
      grad.addColorStop(0.25, '#2e1065');
      grad.addColorStop(0.55, '#831843');
      grad.addColorStop(0.8, '#c2410c');
      grad.addColorStop(1, '#fb923c');
    } else if (background.includes('#1e3a8a') && background.includes('#fef3c7')) {
      // Sonoma Coast
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.35, '#3b82f6');
      grad.addColorStop(0.65, '#93c5fd');
      grad.addColorStop(0.9, '#fed7aa');
      grad.addColorStop(1, '#fef3c7');
    } else if (background.includes('#110d29')) {
      // Monterey Canyon
      grad.addColorStop(0, '#110d29');
      grad.addColorStop(0.25, '#241442');
      grad.addColorStop(0.45, '#4c1d95');
      grad.addColorStop(0.7, '#a21caf');
      grad.addColorStop(0.95, '#f43f5e');
    } else if (background.includes('#09122c')) {
      // Big Sur
      grad.addColorStop(0, '#09122c');
      grad.addColorStop(0.2, '#1e1b4b');
      grad.addColorStop(0.45, '#4338ca');
      grad.addColorStop(0.75, '#db2777');
      grad.addColorStop(1, '#f97316');
    } else if (background.includes('#050b14')) {
      // Catalina
      grad.addColorStop(0, '#050b14');
      grad.addColorStop(0.3, '#0c192c');
      grad.addColorStop(0.6, '#102a45');
      grad.addColorStop(0.85, '#1a4971');
      grad.addColorStop(1, '#38bdf8');
    } else if (background.includes('#090910') && background.includes('#4f46e5')) {
      // Mojave
      grad.addColorStop(0, '#090910');
      grad.addColorStop(0.3, '#111122');
      grad.addColorStop(0.55, '#1b1b36');
      grad.addColorStop(0.75, '#2a2850');
      grad.addColorStop(1, '#4f46e5');
    } else if (background.includes('#06b6d4') && background.includes('#ec4899')) {
      // Pro Display XDR
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.25, '#3b82f6');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(0.75, '#ec4899');
      grad.addColorStop(1, '#050508');
    } else if (background.includes('#181512') || background.includes('#847364')) {
      // Desert Titanium
      grad.addColorStop(0, '#181512');
      grad.addColorStop(0.35, '#2b2520');
      grad.addColorStop(0.65, '#3f362f');
      grad.addColorStop(0.85, '#584c42');
      grad.addColorStop(1, '#847364');
    } else if (background.includes('#151719') || background.includes('#646b7a')) {
      // Natural Titanium
      grad.addColorStop(0, '#151719');
      grad.addColorStop(0.35, '#25282d');
      grad.addColorStop(0.65, '#373b43');
      grad.addColorStop(0.85, '#4a505b');
      grad.addColorStop(1, '#646b7a');
    } else if (background.includes('#041d33')) {
      // iMac Marine Blue
      grad.addColorStop(0, '#041d33');
      grad.addColorStop(0.35, '#073b61');
      grad.addColorStop(0.7, '#0c619b');
      grad.addColorStop(1, '#38bdf8');
    } else if (background.includes('#3d0a14')) {
      // iMac Coral
      grad.addColorStop(0, '#3d0a14');
      grad.addColorStop(0.35, '#701325');
      grad.addColorStop(0.65, '#b91c1c');
      grad.addColorStop(0.85, '#f43f5e');
      grad.addColorStop(1, '#fb7185');
    } else if (background.includes('#020617') && background.includes('#06b6d4')) {
      // Leopard Aurora
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.25, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(0.8, '#06b6d4');
      grad.addColorStop(1, '#a855f7');
    } else if (background.includes('#052e16') || background.includes('#021a10')) {
      // Sequoia Canopy
      grad.addColorStop(0, '#021a10');
      grad.addColorStop(0.3, '#063d2e');
      grad.addColorStop(0.55, '#0f5132');
      grad.addColorStop(0.8, '#198754');
      grad.addColorStop(1, '#75b798');
    } else if (background.includes('#090a0d')) {
      // Space Black
      grad.addColorStop(0, '#090a0d');
      grad.addColorStop(0.35, '#13161c');
      grad.addColorStop(0.65, '#1e222a');
      grad.addColorStop(1, '#0d0e12');
    } else if (background.includes('#2563eb') && background.includes('#db2777')) {
      // Studio Display
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(0.35, '#7c3aed');
      grad.addColorStop(0.7, '#db2777');
      grad.addColorStop(1, '#f43f5e');
    } else if (background.includes('#f8fafc') && background.includes('#cbd5e1')) {
      // Keynote Light
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.4, '#f1f5f9');
      grad.addColorStop(0.75, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
    } else if (background.includes('#38bdf8') && background.includes('#a855f7')) {
      // Apple Intelligence
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.3, '#6366f1');
      grad.addColorStop(0.6, '#a855f7');
      grad.addColorStop(1, '#09090b');
    } else if (background.includes('#431407') && (background.includes('#fbbf24') || background.includes('#fb923c'))) {
      // Ventura Amber
      grad.addColorStop(0, '#431407');
      grad.addColorStop(0.3, '#7c2d12');
      grad.addColorStop(0.6, '#c2410c');
      grad.addColorStop(0.85, '#ea580c');
      grad.addColorStop(1, '#fbbf24');
    } else if (background.includes('#142805')) {
      // Retro Acid Lime
      grad.addColorStop(0, '#142805');
      grad.addColorStop(0.4, '#2e4a0b');
      grad.addColorStop(0.75, '#4d7c0f');
      grad.addColorStop(1, '#84cc16');
    } else if (background.includes('#f5f0eb')) {
      // Sand Parchment
      grad.addColorStop(0, '#f5f0eb');
      grad.addColorStop(0.5, '#eae3dc');
      grad.addColorStop(1, '#ded4cb');
    } else if (background.includes('#2b030b')) {
      // Crimson Dusk
      grad.addColorStop(0, '#2b030b');
      grad.addColorStop(0.45, '#500718');
      grad.addColorStop(0.75, '#881337');
      grad.addColorStop(1, '#0f0204');
    } else if (background.includes('#1e1b4b')) {
      // Cosmic Indigo
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#4338ca');
    } else if (background.includes('#4c0519')) {
      // Sunset Glow
      grad.addColorStop(0, '#4c0519');
      grad.addColorStop(0.5, '#881337');
      grad.addColorStop(1, '#f43f5e');
    } else if (background.includes('#064e3b')) {
      // Emerald
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.5, '#065f46');
      grad.addColorStop(1, '#059669');
    } else if (background.includes('#09090b')) {
      // Obsidian / Velvet Noir
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#18181b');
      grad.addColorStop(1, '#27272a');
    } else if (background.includes('#2e1065')) {
      // Cyberpunk
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(0.5, '#6b21a8');
      grad.addColorStop(1, '#ec4899');
    } else if (background.includes('#082f49')) {
      // Deep Ocean
      grad.addColorStop(0, '#082f49');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#38bdf8');
    } else {
      // Dynamic color stop parser for any custom or preset gradient string
      const colorMatches = background.match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)/g);
      if (colorMatches && colorMatches.length >= 2) {
        colorMatches.forEach((col, idx) => {
          grad.addColorStop(idx / (colorMatches.length - 1), col);
        });
      } else {
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.25, '#3b82f6');
        grad.addColorStop(0.5, '#8b5cf6');
        grad.addColorStop(0.75, '#ec4899');
        grad.addColorStop(1, '#050508');
      }
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (background === 'transparent') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = background || '#0f1115';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw organic film grain texture if enabled
  if (hasGrain) {
    const pattern = getNoisePattern();
    if (pattern) {
      ctx.save();
      ctx.globalAlpha = matchedPreset?.grainIntensity || 0.14;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}
