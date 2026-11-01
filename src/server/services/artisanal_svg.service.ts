/**
 * BHAIRAVI Creations Digital Platform
 * Premium Artisanal SVG Visual Engine
 * Generates bespoke, luxury vector visuals for 3D-printed creations & catalog items.
 * Target: src/server/services/artisanal_svg.service.ts
 */

export function generateArtisanalSvg(filename: string): string {
  const lower = filename.toLowerCase();
  const baseName = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const title = baseName.length > 0
    ? baseName.charAt(0).toUpperCase() + baseName.slice(1)
    : 'Artisanal Creation';

  // 1. Raw Print Technical Slice (PDP Before/After comparison)
  if (lower.includes('raw_print') || lower.includes('raw')) {
    return generateRawPrintSvg();
  }

  // 2. Vighnaharta Ganesha
  if (lower.includes('ganesha')) {
    return generateGaneshaSvg();
  }

  // 3. Dhyana Shiva
  if (lower.includes('shiva') || lower.includes('dhyana')) {
    return generateShivaSvg();
  }

  // 4. Mandir Sacred Geometry Jali Panel
  if (lower.includes('jali') || lower.includes('mandir')) {
    return generateJaliSvg();
  }

  // 5. Radha Krishna / Cylindrical Lithophane Lamp
  if (lower.includes('radha') || lower.includes('krishna') || lower.includes('lithophane')) {
    return generateLithophaneSvg(lower.includes('radha') ? 'Radha Krishna Divine Flute' : 'Custom 360° Memory');
  }

  // 6. Fibonacci Lotus Planter
  if (lower.includes('lotus') || lower.includes('planter')) {
    return generatePlanterSvg();
  }

  // 7. Fluted Bud Vase
  if (lower.includes('vase') || lower.includes('fluted')) {
    return generateVaseSvg();
  }

  // 8. Konark Sun Temple Wheel
  if (lower.includes('konark') || lower.includes('wheel') || lower.includes('surya')) {
    return generateKonarkSvg();
  }

  // 9. Rajasthani Haveli Jharokha
  if (lower.includes('haveli') || lower.includes('jharokha')) {
    return generateHaveliSvg();
  }

  // 10. Parametric Desk Organizer / Sculpture
  if (lower.includes('desk') || lower.includes('organizer') || lower.includes('sculpture')) {
    return generateDeskOrganizerSvg();
  }

  // Default Editorial Luxury Creation
  return generateDefaultAtelierSvg(title);
}

function generateGaneshaSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="halo-glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#D97706" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#92400E" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="25%" stop-color="#D97706"/>
      <stop offset="60%" stop-color="#92400E"/>
      <stop offset="100%" stop-color="#451A03"/>
    </linearGradient>
    <linearGradient id="patina-acc" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="50%" stop-color="#14B8A6"/>
      <stop offset="100%" stop-color="#5EEAD4"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Luxury Obsidian Studio Background -->
  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Halo Atmosphere -->
  <circle cx="400" cy="360" r="320" fill="url(#halo-glow)"/>

  <!-- Ornate Mandir Arch & Sacred Geometry Aura -->
  <g stroke="#D97706" stroke-opacity="0.25" fill="none" stroke-width="1.2">
    <circle cx="400" cy="350" r="220"/>
    <circle cx="400" cy="350" r="200" stroke-dasharray="4,6"/>
    <circle cx="400" cy="350" r="160"/>
    <!-- 12 Radiating Rays -->
    <path d="M 400 130 L 400 150 M 400 550 L 400 570 M 180 350 L 200 350 M 600 350 L 620 350" stroke-width="2"/>
    <path d="M 245 195 L 260 210 M 555 505 L 540 490 M 245 505 L 260 490 M 555 195 L 540 210" stroke-width="2"/>
  </g>

  <!-- Lord Ganesha Silhouette in Bronze Patina -->
  <g transform="translate(400, 350)" filter="url(#soft-shadow)">
    <!-- Lotus Plinth Base -->
    <path d="M -160 170 Q 0 140 160 170 C 180 200 -180 200 -160 170 Z" fill="url(#bronze-grad)"/>
    <path d="M -140 160 C -90 130 -30 140 0 165 C 30 140 90 130 140 160" fill="none" stroke="#FDE68A" stroke-width="2"/>

    <!-- Mukuta Crown -->
    <path d="M 0 -190 L 30 -120 L 45 -70 L -45 -70 L -30 -120 Z" fill="url(#bronze-grad)"/>
    <circle cx="0" cy="-195" r="7" fill="#FDE68A"/>
    <path d="M -25 -100 L 0 -130 L 25 -100 Z" fill="#FDE68A" fill-opacity="0.7"/>

    <!-- Large Ears with Gold Filigree -->
    <path d="M -45 -70 C -150 -90 -160 30 -60 50 Z" fill="url(#bronze-grad)"/>
    <path d="M 45 -70 C 150 -90 160 30 60 50 Z" fill="url(#bronze-grad)"/>
    <path d="M -130 -10 C -120 20 -80 30 -60 40" fill="none" stroke="#14B8A6" stroke-width="2.5" stroke-dasharray="3,3"/>
    <path d="M 130 -10 C 120 20 80 30 60 40" fill="none" stroke="#14B8A6" stroke-width="2.5" stroke-dasharray="3,3"/>

    <!-- Head & Temple -->
    <path d="M -45 -70 C -40 -20 40 -20 45 -70 C 35 -85 -35 -85 -45 -70 Z" fill="url(#bronze-grad)"/>
    
    <!-- Trishul / Tilak on Forehead -->
    <path d="M 0 -65 L 0 -35 M -12 -58 Q -6 -45 0 -40 Q 6 -45 12 -58" fill="none" stroke="#FDE68A" stroke-width="2.5"/>
    <circle cx="0" cy="-30" r="3" fill="#EF4444"/>

    <!-- Trunk Curved to Left with Modak Laddu -->
    <path d="M -18 -20 C -25 20 -35 70 -65 80 C -95 90 -105 50 -85 40 C -75 35 -65 45 -65 55" fill="none" stroke="url(#bronze-grad)" stroke-width="24" stroke-linecap="round"/>
    <!-- Golden Modak on Trunk Tip -->
    <circle cx="-65" cy="55" r="10" fill="#FDE68A"/>

    <!-- Tusks: Broken left, whole right -->
    <path d="M 20 -15 L 38 -5" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
    <path d="M -20 -15 L -28 -10" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>

    <!-- Torso, Draped Angavastram & Rounded Udara -->
    <ellipse cx="0" cy="80" rx="90" ry="75" fill="url(#bronze-grad)"/>
    <!-- Yajnopavita Sacred Thread with Verdigris Patina -->
    <path d="M -45 20 Q 0 70 50 120" fill="none" stroke="url(#patina-acc)" stroke-width="3" stroke-dasharray="4,2"/>

    <!-- Abhaya Mudra Blessing Hand (Right) -->
    <circle cx="95" cy="40" r="24" fill="url(#bronze-grad)"/>
    <path d="M 95 30 L 95 50 M 87 35 L 87 48 M 103 35 L 103 48" stroke="#FDE68A" stroke-width="2"/>
    <!-- Sacred Om in Palm -->
    <circle cx="95" cy="40" r="6" fill="#FDE68A" fill-opacity="0.9"/>
  </g>

  <!-- Editorial Top Studio Badge -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FDE68A" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">0.12mm FDM PRECISION</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Vighnaharta Ganesha Idol</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#D97706" text-anchor="middle" letter-spacing="2">ANTIQUE BRONZE PATINA • VERDIGRIS HIGHLIGHTS</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Individually Triple Wet-Sanded &amp; Hand-Gilded in Ludhiana</text>
  </g>
</svg>`;
}

function generateShivaSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="celestial-glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1E3A8A" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shiva-obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="30%" stop-color="#334155"/>
      <stop offset="70%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="silver-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
    <filter id="dhyana-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect width="800" height="800" fill="#030712"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Cosmic Halo -->
  <circle cx="400" cy="350" r="300" fill="url(#celestial-glow)"/>

  <!-- Subtle Sacred Geometric Concentric Rings -->
  <g stroke="#38BDF8" stroke-opacity="0.18" fill="none" stroke-width="1">
    <circle cx="400" cy="340" r="240"/>
    <circle cx="400" cy="340" r="190" stroke-dasharray="3,6"/>
    <circle cx="400" cy="340" r="140"/>
  </g>

  <!-- Dhyana Shiva Sculpture Silhouette -->
  <g transform="translate(400, 340)" filter="url(#dhyana-shadow)">
    <!-- Base Pedestal / Broad Meditative Shoulders -->
    <path d="M -190 180 C -130 110 -80 90 0 95 C 80 90 130 110 190 180 Z" fill="url(#shiva-obsidian)"/>
    <path d="M -150 170 C -90 120 90 120 150 170" fill="none" stroke="#64748B" stroke-width="2"/>

    <!-- Vasuki Serpent coiled around divine neck -->
    <path d="M -65 50 Q -30 75 0 65 Q 40 55 60 75" fill="none" stroke="#059669" stroke-width="14" stroke-linecap="round"/>
    <circle cx="68" cy="73" r="10" fill="#10B981"/>
    <circle cx="70" cy="71" r="2" fill="#FFFFFF"/>

    <!-- Rudraksha Beads Mala -->
    <g fill="#B45309" stroke="#78350F" stroke-width="1">
      <circle cx="-50" cy="85" r="7"/>
      <circle cx="-32" cy="98" r="7"/>
      <circle cx="-12" cy="105" r="7"/>
      <circle cx="10" cy="106" r="7"/>
      <circle cx="30" cy="100" r="7"/>
      <circle cx="48" cy="88" r="7"/>
    </g>

    <!-- Strong Neck & Jawline -->
    <path d="M -38 0 L -38 60 C -15 75 15 75 38 60 L 38 0 Z" fill="url(#shiva-obsidian)"/>

    <!-- Serene Face in Deep Dhyana Meditation -->
    <path d="M -55 -80 C -55 20 -20 45 0 45 C 20 45 55 20 55 -80 Z" fill="url(#shiva-obsidian)"/>
    
    <!-- Closed Meditative Eyelids & Calming Brow -->
    <path d="M -38 -20 Q -24 -12 -12 -20" fill="none" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 12 -20 Q 24 -12 38 -20" fill="none" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Aquiline Nose & Serene Lips -->
    <path d="M 0 -25 L -3 0 L 0 5" fill="none" stroke="#64748B" stroke-width="2"/>
    <path d="M -12 16 Q 0 22 12 16" fill="none" stroke="#94A3B8" stroke-width="2.5"/>

    <!-- Tripundra Sacred Ash (3 Horizontal Lines) on Forehead -->
    <path d="M -26 -52 L 26 -52" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round"/>
    <path d="M -30 -47 L 30 -47" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round"/>
    <path d="M -26 -42 L 26 -42" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round"/>
    <!-- Vertical Third Eye in Center -->
    <ellipse cx="0" cy="-47" rx="3.5" ry="6" fill="#DC2626"/>

    <!-- Matted Locks (Jatamukuta) Topknot -->
    <path d="M -60 -80 C -70 -130 -40 -180 0 -190 C 40 -180 70 -130 60 -80 Z" fill="url(#shiva-obsidian)"/>
    <path d="M -40 -110 Q 0 -140 40 -110" fill="none" stroke="#64748B" stroke-width="2"/>
    <path d="M -30 -145 Q 0 -165 30 -145" fill="none" stroke="#64748B" stroke-width="2"/>

    <!-- Hand-Detailed Crescent Moon (Chandra) on Left of Locks -->
    <path d="M -45 -155 C -35 -145 -35 -125 -45 -115 C -25 -120 -25 -150 -45 -155 Z" fill="url(#silver-leaf)" filter="url(#soft-shadow)"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#38BDF8" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">COLD-CAST MARBLE RESIN</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Dhyana Shiva Meditative Bust</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#38BDF8" text-anchor="middle" letter-spacing="2">OBSIDIAN WASH • SILVER LEAF CHANDRA</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Honeycomb Structural Infill • Balanced Heft Hand-Sculpted in Ludhiana</text>
  </g>
</svg>`;
}

function generateJaliSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="jali-light" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#FDE047" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#B45309" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#1C1917" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold-leaf-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="40%" stop-color="#CA8A04"/>
      <stop offset="70%" stop-color="#854D0E"/>
      <stop offset="100%" stop-color="#FEF08A"/>
    </linearGradient>
    <pattern id="sacred-jali-grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="none"/>
      <!-- Mughal 8-pointed star polygon -->
      <polygon points="40,10 48,28 66,20 58,38 76,46 58,54 66,72 48,64 40,82 32,64 14,72 22,54 4,46 22,38 14,20 32,28" fill="#1C1917" stroke="#CA8A04" stroke-width="1.5"/>
      <circle cx="40" cy="46" r="8" fill="#FEF08A" fill-opacity="0.2" stroke="#EAB308" stroke-width="1"/>
      <circle cx="0" cy="0" r="12" fill="none" stroke="#CA8A04" stroke-width="1.5"/>
      <circle cx="80" cy="0" r="12" fill="none" stroke="#CA8A04" stroke-width="1.5"/>
      <circle cx="0" cy="80" r="12" fill="none" stroke="#CA8A04" stroke-width="1.5"/>
      <circle cx="80" cy="80" r="12" fill="none" stroke="#CA8A04" stroke-width="1.5"/>
    </pattern>
  </defs>

  <rect width="800" height="800" fill="#0C0A09"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#292524" stroke-width="1.5"/>

  <!-- Backlit Warm Puja Glow -->
  <circle cx="400" cy="350" r="320" fill="url(#jali-light)"/>

  <!-- Main Ornate Jali Frame -->
  <g transform="translate(160, 110)">
    <!-- Outer Heavy Gilded Border Frame -->
    <rect width="480" height="480" rx="12" fill="#1C1917" stroke="url(#gold-leaf-border)" stroke-width="10"/>
    <rect x="18" y="18" width="444" height="444" rx="6" fill="#0C0A09" stroke="#EAB308" stroke-width="2" stroke-dasharray="8,4"/>

    <!-- Inner Lattice Repeating Screen -->
    <rect x="26" y="26" width="428" height="428" rx="4" fill="url(#sacred-jali-grid)"/>

    <!-- 4 Corner Brass Rosettes -->
    <circle cx="10" cy="10" r="14" fill="url(#gold-leaf-border)"/>
    <circle cx="470" cy="10" r="14" fill="url(#gold-leaf-border)"/>
    <circle cx="10" cy="470" r="14" fill="url(#gold-leaf-border)"/>
    <circle cx="470" cy="470" r="14" fill="url(#gold-leaf-border)"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1C1917" stroke="#44403C" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FEF08A" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1C1917" stroke="#44403C" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#A8A29E" letter-spacing="1.2" text-anchor="middle">SACRED GEOMETRY</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Mandir Sacred Geometry Jali Panel</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#EAB308" text-anchor="middle" letter-spacing="2">HAND-APPLIED GOLD LEAF EDGING • BACKLIT READY</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#78716C" text-anchor="middle">Architectural Puja Room Lattice • High-Density Biopolymer Crafted in Ludhiana</text>
  </g>
</svg>`;
}

function generateLithophaneSvg(subTitle: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="lamp-3000k" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="35%" stop-color="#FDE68A" stop-opacity="0.7"/>
      <stop offset="65%" stop-color="#F59E0B" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="walnut-wood" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350F"/>
      <stop offset="45%" stop-color="#451A03"/>
      <stop offset="85%" stop-color="#291002"/>
    </linearGradient>
    <linearGradient id="litho-shade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F8FAFC" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC" stop-opacity="0.85"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#050811"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <!-- 3000K Ambient Night Illumination -->
  <circle cx="400" cy="320" r="340" fill="url(#lamp-3000k)"/>

  <!-- Ambient Light Rays -->
  <g stroke="#FEF08A" stroke-opacity="0.15" stroke-width="1">
    <line x1="400" y1="320" x2="150" y2="100"/>
    <line x1="400" y1="320" x2="650" y2="100"/>
    <line x1="400" y1="320" x2="100" y2="320"/>
    <line x1="400" y1="320" x2="700" y2="320"/>
    <line x1="400" y1="320" x2="200" y2="520"/>
    <line x1="400" y1="320" x2="600" y2="520"/>
  </g>

  <!-- Lithophane Cylinder & Wooden Base -->
  <g transform="translate(400, 340)">
    <!-- Solid Walnut Turned Wooden Base Plinth -->
    <path d="M -130 140 L 130 140 L 150 175 L -150 175 Z" fill="url(#walnut-wood)"/>
    <ellipse cx="0" cy="140" rx="130" ry="18" fill="#5E2606"/>
    <ellipse cx="0" cy="175" rx="150" ry="20" fill="#291002"/>

    <!-- Curved Cylindrical Lithophane Shade -->
    <path d="M -110 140 L -110 -140 Q 0 -170 110 -140 L 110 140 Q 0 165 -110 140 Z" fill="url(#litho-shade)" stroke="#FEF3C7" stroke-width="2"/>
    <ellipse cx="0" cy="-140" rx="110" ry="16" fill="#FFFBEB" stroke="#FDE68A" stroke-width="2"/>

    <!-- Subtle Divine Flute & Sacred Peacock Feather Silhouette -->
    <g transform="translate(0, -10)" stroke="#78350F" fill="none" stroke-width="2" opacity="0.6">
      <!-- Divine Flute Bansuri -->
      <line x1="-70" y1="-30" x2="70" y2="10" stroke="#92400E" stroke-width="4" stroke-linecap="round"/>
      <circle cx="-50" cy="-25" r="2" fill="#78350F"/>
      <circle cx="-30" cy="-20" r="2" fill="#78350F"/>
      <circle cx="-10" cy="-14" r="2" fill="#78350F"/>
      <circle cx="10" cy="-9" r="2" fill="#78350F"/>
      <circle cx="30" cy="-3" r="2" fill="#78350F"/>
      <!-- Peacock Feather Eye -->
      <ellipse cx="-45" cy="-60" rx="18" ry="26" fill="#FDE68A" fill-opacity="0.4" stroke="#D97706" stroke-width="1.5"/>
      <circle cx="-45" cy="-55" r="8" fill="#1E3A8A" fill-opacity="0.5"/>
    </g>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FDE047" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">8K SLA PHOTOPOLYMER</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${subTitle} Lithophane Lamp</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#F59E0B" text-anchor="middle" letter-spacing="2">WARM 3000K LED • HAND-TURNED WALNUT BASE</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Micron Translucency Matrix • Hand-Assembled in Ludhiana</text>
  </g>
</svg>`;
}

function generatePlanterSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="nature-glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#064E3B" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="terracotta-stone" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="45%" stop-color="#C2410C"/>
      <stop offset="85%" stop-color="#9A3412"/>
      <stop offset="100%" stop-color="#7C2D12"/>
    </linearGradient>
    <linearGradient id="succulent-green" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6EE7B7"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <circle cx="400" cy="350" r="320" fill="url(#nature-glow)"/>

  <!-- Parametric Fibonacci Spirals in Background -->
  <g stroke="#EA580C" stroke-opacity="0.18" fill="none" stroke-width="1.2">
    <path d="M 400 350 A 50 50 0 0 1 450 400 A 100 100 0 0 1 350 500 A 200 200 0 0 1 150 300 A 350 350 0 0 1 500 -50"/>
    <circle cx="400" cy="350" r="180" stroke-dasharray="4,6"/>
  </g>

  <!-- Lotus Planter 3D Form -->
  <g transform="translate(400, 360)">
    <!-- Drainage Saucer Base Tray -->
    <ellipse cx="0" cy="150" rx="160" ry="28" fill="#7C2D12"/>
    <ellipse cx="0" cy="144" rx="150" ry="24" fill="url(#terracotta-stone)"/>

    <!-- Parametric Spiral Lotus Petals (Layered Infill) -->
    <!-- Outer Tier -->
    <path d="M -130 110 C -150 30 -80 -20 -40 20 C -20 70 -90 100 -130 110 Z" fill="#9A3412"/>
    <path d="M 130 110 C 150 30 80 -20 40 20 C 20 70 90 100 130 110 Z" fill="#9A3412"/>
    
    <!-- Mid Tier -->
    <path d="M -90 120 C -120 50 -40 0 0 40 C -10 90 -60 115 -90 120 Z" fill="#C2410C"/>
    <path d="M 90 120 C 120 50 40 0 0 40 C 10 90 60 115 90 120 Z" fill="#C2410C"/>

    <!-- Center Bowl Pot -->
    <ellipse cx="0" cy="115" rx="100" ry="30" fill="url(#terracotta-stone)"/>

    <!-- Echeveria Succulent Rosette Resting Inside -->
    <g transform="translate(0, 45)">
      <polygon points="0,-45 14,-15 45,-15 20,6 30,35 0,18 -30,35 -20,6 -45,-15 -14,-15" fill="url(#succulent-green)"/>
      <circle cx="0" cy="0" r="14" fill="#A7F3D0"/>
    </g>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FB923C" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">FIBONACCI SPIRAL</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Parametric Lotus Planter</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#FB923C" text-anchor="middle" letter-spacing="2">TERRACOTTA MINERAL WASH • INTEGRATED DRAINAGE</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Mathematically Optimized Airflow • Biodegradable PLA+ Made in Ludhiana</text>
  </g>
</svg>`;
}

function generateVaseSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="alabaster-spot" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="50%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.3"/>
    </radialGradient>
    <linearGradient id="ceramic-white" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="35%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <circle cx="400" cy="350" r="300" fill="url(#alabaster-spot)" opacity="0.12"/>

  <!-- Vase & Botanical Sprigs -->
  <g transform="translate(400, 360)">
    <!-- Botanical Eucalyptus Leaves from Neck -->
    <g stroke="#10B981" stroke-width="2" fill="none">
      <path d="M 0 -130 Q -30 -190 -60 -240"/>
      <path d="M 0 -130 Q 30 -200 70 -250"/>
      <ellipse cx="-45" cy="-210" rx="12" ry="18" fill="#059669" fill-opacity="0.8"/>
      <ellipse cx="-20" cy="-170" rx="10" ry="15" fill="#10B981" fill-opacity="0.8"/>
      <ellipse cx="50" cy="-215" rx="12" ry="18" fill="#059669" fill-opacity="0.8"/>
      <ellipse cx="25" cy="-175" rx="10" ry="15" fill="#10B981" fill-opacity="0.8"/>
    </g>

    <!-- Ceramic Fluted Vase Body -->
    <path d="M -40 -130 C -40 -80 -100 20 -90 120 C -90 150 90 150 90 120 C 100 20 40 -80 40 -130 Z" fill="url(#ceramic-white)" stroke="#E2E8F0" stroke-width="2"/>
    <ellipse cx="0" cy="-130" rx="40" ry="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>

    <!-- Elegant Vertical Flutes / Ribs -->
    <path d="M -25 -128 C -25 -80 -70 20 -60 125" fill="none" stroke="#CBD5E1" stroke-width="2"/>
    <path d="M -10 -125 C -10 -80 -35 20 -30 130" fill="none" stroke="#CBD5E1" stroke-width="2"/>
    <path d="M 10 -125 C 10 -80 35 20 30 130" fill="none" stroke="#CBD5E1" stroke-width="2"/>
    <path d="M 25 -128 C 25 -80 70 20 60 125" fill="none" stroke="#CBD5E1" stroke-width="2"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#E2E8F0" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">WATERPROOF RESIN SEAL</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Fluted Artisanal Bud Vase</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle" letter-spacing="2">ALABASTER MATTE • INTERNAL RESIN LINING</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Neoclassical Architectural Geometry • Crafted in Ludhiana Studio</text>
  </g>
</svg>`;
}

function generateKonarkSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="sun-ochre" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#B45309" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sandstone-rock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="35%" stop-color="#B45309"/>
      <stop offset="70%" stop-color="#78350F"/>
      <stop offset="100%" stop-color="#451A03"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <circle cx="400" cy="340" r="320" fill="url(#sun-ochre)"/>

  <!-- Konark Surya Chakra (Sun Wheel with 16 Spokes) -->
  <g transform="translate(400, 340)">
    <!-- Base Plinth -->
    <rect x="-140" y="180" width="280" height="25" rx="6" fill="#451A03" stroke="#B45309" stroke-width="1.5"/>

    <!-- Outer Rim -->
    <circle cx="0" cy="0" r="175" fill="none" stroke="url(#sandstone-rock)" stroke-width="18"/>
    <circle cx="0" cy="0" r="162" fill="none" stroke="#FDE68A" stroke-width="2" stroke-dasharray="4,4"/>
    <circle cx="0" cy="0" r="145" fill="none" stroke="#B45309" stroke-width="8"/>

    <!-- Center Axle Hub -->
    <circle cx="0" cy="0" r="45" fill="url(#sandstone-rock)" stroke="#FDE68A" stroke-width="3"/>
    <circle cx="0" cy="0" r="24" fill="#451A03"/>
    <circle cx="0" cy="0" r="10" fill="#FDE68A"/>

    <!-- 16 Carved Relief Spokes -->
    ${Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16;
      return `<g transform="rotate(${angle})">
        <line x1="0" y1="45" x2="0" y2="145" stroke="#FDE68A" stroke-width="4"/>
        <circle cx="0" cy="95" r="8" fill="#B45309" stroke="#FDE68A" stroke-width="2"/>
      </g>`;
    }).join('\n')}
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#F59E0B" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">HERITAGE SCALE 1:24</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Konark Sun Temple Surya Chakra</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#F59E0B" text-anchor="middle" letter-spacing="2">WEATHERED SANDSTONE PATINA • 16-SPOKE ARCHAEOLOGICAL SCALE</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Multi-Part Additive Assembly • Hand-Distressed in Ludhiana</text>
  </g>
</svg>`;
}

function generateHaveliSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="walnut-stain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#92400E"/>
      <stop offset="50%" stop-color="#78350F"/>
      <stop offset="100%" stop-color="#451A03"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Rajasthani Haveli Jharokha Balcony Arch -->
  <g transform="translate(400, 350)">
    <!-- Ornate Cornice / Chhatri Roof Overhang -->
    <path d="M -160 -140 Q 0 -220 160 -140 L 140 -110 L -140 -110 Z" fill="url(#walnut-stain)" stroke="#B45309" stroke-width="2"/>
    <circle cx="0" cy="-215" r="8" fill="#FDE68A"/>

    <!-- Pillars (Carved Haveli Stambha) -->
    <rect x="-130" y="-110" width="22" height="200" rx="4" fill="url(#walnut-stain)"/>
    <rect x="108" y="-110" width="22" height="200" rx="4" fill="url(#walnut-stain)"/>

    <!-- Cusped Trifoil Rajput Arch -->
    <path d="M -108 -40 C -80 -120 -30 -110 0 -70 C 30 -110 80 -120 108 -40" fill="none" stroke="#FDE68A" stroke-width="4"/>

    <!-- Recessed Deity Alcove Screen -->
    <rect x="-105" y="-35" width="210" height="125" fill="#1C1917" stroke="#92400E" stroke-width="2"/>
    <!-- Jali Miniature Lattice on Screen -->
    <g stroke="#B45309" stroke-width="1" opacity="0.4">
      <line x1="-105" y1="0" x2="105" y2="0"/>
      <line x1="-105" y1="40" x2="105" y2="40"/>
      <line x1="-60" y1="-35" x2="-60" y2="90"/>
      <line x1="0" y1="-35" x2="0" y2="90"/>
      <line x1="60" y1="-35" x2="60" y2="90"/>
    </g>

    <!-- Projecting Balcony Balustrade -->
    <rect x="-140" y="90" width="280" height="40" rx="4" fill="url(#walnut-stain)" stroke="#B45309" stroke-width="2"/>
    <g fill="#FDE68A">
      <circle cx="-100" cy="110" r="4"/>
      <circle cx="-50" cy="110" r="4"/>
      <circle cx="0" cy="110" r="4"/>
      <circle cx="50" cy="110" r="4"/>
      <circle cx="100" cy="110" r="4"/>
    </g>

    <!-- Bottom Structural Corbel Brackets -->
    <polygon points="-120,130 -80,180 -120,180" fill="#451A03"/>
    <polygon points="120,130 80,180 120,180" fill="#451A03"/>
    <polygon points="-20,130 0,180 20,130" fill="#451A03"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FDE68A" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">REAL WOOD FIBER COMPOSITE</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Rajasthani Haveli Jharokha Shrine</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#F59E0B" text-anchor="middle" letter-spacing="2">30% RECYCLED PINE WOOD FIBER • ANTIQUE WALNUT STAIN</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Cusped Rajput Balcony Frame • Hand-Sanded Woodgrain in Ludhiana</text>
  </g>
</svg>`;
}

function generateDeskOrganizerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="charcoal-slate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="40%" stop-color="#334155"/>
      <stop offset="80%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Parametric Isometric Desk Sculpture -->
  <g transform="translate(400, 360)">
    <!-- Base Prism -->
    <polygon points="-160,80 0,160 160,80 0,0" fill="#334155" stroke="#64748B" stroke-width="2"/>
    <polygon points="-160,80 0,160 0,200 -160,120" fill="#1E293B" stroke="#475569" stroke-width="2"/>
    <polygon points="0,160 160,80 160,120 0,200" fill="#0F172A" stroke="#475569" stroke-width="2"/>

    <!-- Smartphone Angled Dock Well -->
    <polygon points="-100,30 -30,65 20,40 -50,5" fill="#0B0F19" stroke="#2563EB" stroke-width="2"/>

    <!-- Fountain Pen Hexagonal Well -->
    <polygon points="60,20 90,35 110,20 100,-10 70,-15 50,0" fill="#0B0F19" stroke="#38BDF8" stroke-width="2"/>
    <!-- Pen Barrel -->
    <line x1="80" y1="10" x2="120" y2="-90" stroke="#FDE68A" stroke-width="10" stroke-linecap="round"/>

    <!-- Business Card Angled Compartment -->
    <polygon points="-40,-10 20,20 60,0 0,-30" fill="#0B0F19" stroke="#64748B" stroke-width="2"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#38BDF8" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">MINERAL WEIGHTED CORE</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Parametric Desk Organizer &amp; Dock</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#38BDF8" text-anchor="middle" letter-spacing="2">FACETED OBSIDIAN FINISH • INTEGRATED PHONE DOCK</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Felt Footing &amp; Internal Ballast • Precision Crafted in Ludhiana</text>
  </g>
</svg>`;
}

function generateRawPrintSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="blueprint-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none"/>
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="1"/>
    </pattern>
    <pattern id="layer-slices" width="10" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="3" x2="10" y2="3" stroke="#0284C7" stroke-width="1.2" stroke-opacity="0.7"/>
    </pattern>
  </defs>

  <!-- Dark CAD Technical Workspace Background -->
  <rect width="800" height="800" fill="url(#blueprint-bg)"/>
  <rect width="800" height="800" fill="url(#cad-grid)"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#0284C7" stroke-width="2" stroke-dasharray="8,4"/>

  <!-- 3D Print Layer Lines Visualization (Honeycomb Infill & Extrusion Paths) -->
  <g transform="translate(400, 360)">
    <!-- Layered Additive 3D Hexagon Core -->
    <polygon points="0,-160 140,-80 140,80 0,160 -140,80 -140,-80" fill="url(#layer-slices)" stroke="#38BDF8" stroke-width="2"/>
    
    <!-- Coordinate Axis -->
    <line x1="0" y1="0" x2="0" y2="-190" stroke="#EF4444" stroke-width="2"/>
    <text x="8" y="-175" font-family="monospace" font-size="12" fill="#EF4444">Z (Height)</text>

    <line x1="0" y1="0" x2="180" y2="90" stroke="#10B981" stroke-width="2"/>
    <text x="185" y="95" font-family="monospace" font-size="12" fill="#10B981">X</text>

    <line x1="0" y1="0" x2="-180" y2="90" stroke="#3B82F6" stroke-width="2"/>
    <text x="-200" y="95" font-family="monospace" font-size="12" fill="#3B82F6">Y</text>

    <!-- Hotend Nozzle Extrusion Indicator -->
    <circle cx="0" cy="-60" r="8" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
    <line x1="0" y1="-80" x2="0" y2="-60" stroke="#F59E0B" stroke-width="4"/>
    <text x="15" y="-55" font-family="monospace" font-size="11" fill="#F59E0B">0.4mm Nozzle (210°C)</text>
  </g>

  <!-- Technical Overlay HUD -->
  <g transform="translate(48, 56)" font-family="monospace" font-size="12" fill="#38BDF8">
    <text x="0" y="0">LAYER_HEIGHT: 0.120mm (ULTRA-FINE)</text>
    <text x="0" y="20">INFILL_DENSITY: 25% GYROID MATRIX</text>
    <text x="0" y="40">STATUS: RAW PRE-FINISHING STAGE</text>
  </g>

  <g transform="translate(560, 56)" font-family="monospace" font-size="12" fill="#94A3B8" text-anchor="end">
    <text x="190" y="0">STUDIO: LUDHIANA, PB</text>
    <text x="190" y="20">CORE: BIODEGRADABLE PLA+</text>
    <text x="190" y="40">POST-PROC: PENDING</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Raw Additive Core (Pre-Finishing)</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#38BDF8" text-anchor="middle" letter-spacing="2">0.12mm LAYER RESOLUTION • BEFORE ARTISANAL PATINA</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Triple Wet-Sanding, Cold-Cast Priming &amp; Hand-Gilding Follow This Stage</text>
  </g>
</svg>`;
}

function generateDefaultAtelierSvg(title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="def-glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1E40AF" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold-accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#0B0F19"/>
  <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#1E293B" stroke-width="1.5"/>

  <circle cx="400" cy="350" r="300" fill="url(#def-glow)"/>

  <!-- Geometric 3D Form Icon -->
  <g transform="translate(400, 350)">
    <polygon points="0,-120 105,-60 105,60 0,120 -105,60 -105,-60" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <polygon points="0,-120 105,-60 0,0 -105,-60" fill="#334155" stroke="#475569" stroke-width="2"/>
    <polygon points="0,0 105,-60 105,60 0,120" fill="#1E293B" stroke="#475569" stroke-width="2"/>
    <polygon points="-105,-60 0,0 0,120 -105,60" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <circle cx="0" cy="0" r="16" fill="url(#gold-accent)"/>
  </g>

  <!-- Editorial Top Badges -->
  <g transform="translate(48, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#FDE68A" letter-spacing="1.2">BHAIRAVI ATELIER</text>
  </g>
  <g transform="translate(572, 48)">
    <rect width="180" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="90" y="17" font-family="'Inter', system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" letter-spacing="1.2" text-anchor="middle">LUDHIANA, PUNJAB</text>
  </g>

  <!-- Bottom Editorial Typography -->
  <g transform="translate(400, 680)">
    <text x="0" y="0" font-family="'Geist', system-ui, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${title}</text>
    <text x="0" y="26" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="600" fill="#2563EB" text-anchor="middle" letter-spacing="2">0.12mm ADDITIVE PRECISION • HAND-FINISHED</text>
    <text x="0" y="48" font-family="'Inter', system-ui, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">High-Density PLA / PLA Pro • Studio Crafted in Ludhiana, Punjab</text>
  </g>
</svg>`;
}
