"""
Generate hit_badge.png (fist) and blk_badge.png (shield) to match existing badge style.
Style: golden crown, heraldic shield, laurel wreaths, banner with stars.
"""
import cairosvg
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "badges")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_badge(central_element_svg: str, glow_color: str, output_name: str):
    """Render a full badge SVG with the given central element and glow color."""

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- Background warm golden glow -->
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="48%">
      <stop offset="0%"  stop-color="#f5e4b8" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#f0d9a0" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <!-- Outer shield gradient (cream/ivory) -->
    <linearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#e9e1cc"/>
      <stop offset="100%" stop-color="#d4c8a8"/>
    </linearGradient>

    <!-- Inner shield gradient (lighter cream) -->
    <linearGradient id="shieldInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#f0eadc"/>
      <stop offset="100%" stop-color="#e0d6bc"/>
    </linearGradient>

    <!-- Crown gradient (gold) -->
    <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFE566"/>
      <stop offset="50%"  stop-color="#F5C400"/>
      <stop offset="100%" stop-color="#D4A000"/>
    </linearGradient>

    <!-- Crown highlight -->
    <linearGradient id="crownHighlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFF0A0"/>
      <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
    </linearGradient>

    <!-- Laurel gold -->
    <linearGradient id="laurelGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#E8A800"/>
      <stop offset="100%" stop-color="#F5C400"/>
    </linearGradient>

    <!-- Banner gold -->
    <linearGradient id="bannerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#F5C400"/>
      <stop offset="50%" stop-color="#E0A800"/>
      <stop offset="100%" stop-color="#C89000"/>
    </linearGradient>

    <!-- Glow for central element -->
    <radialGradient id="elementGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="{glow_color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="{glow_color}" stop-opacity="0"/>
    </radialGradient>

    <!-- Drop shadow filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
    </filter>

    <!-- Soft shadow for shield -->
    <filter id="shieldShadow" x="-15%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>

  </defs>

  <!-- ─── Background glow ─── -->
  <circle cx="512" cy="512" r="490" fill="url(#bgGlow)"/>

  <!-- ─── Laurel wreaths ─── -->
  <!-- Left laurel -->
  <g fill="url(#laurelGrad)" stroke="#9A7000" stroke-width="0.8">
    <!-- 10 leaves arranged in an arc on the left side -->
    <ellipse cx="238" cy="530" rx="22" ry="10" transform="rotate(-15 238 530)"/>
    <ellipse cx="212" cy="498" rx="22" ry="10" transform="rotate(-35 212 498)"/>
    <ellipse cx="196" cy="462" rx="22" ry="10" transform="rotate(-55 196 462)"/>
    <ellipse cx="191" cy="423" rx="22" ry="10" transform="rotate(-72 191 423)"/>
    <ellipse cx="198" cy="385" rx="22" ry="10" transform="rotate(-88 198 385)"/>
    <ellipse cx="215" cy="350" rx="22" ry="10" transform="rotate(-105 215 350)"/>
    <ellipse cx="242" cy="320" rx="22" ry="10" transform="rotate(-120 242 320)"/>
    <ellipse cx="275" cy="297" rx="22" ry="10" transform="rotate(-135 275 297)"/>
    <ellipse cx="312" cy="282" rx="20" ry="9" transform="rotate(-148 312 282)"/>
    <ellipse cx="352" cy="275" rx="18" ry="8" transform="rotate(-158 352 275)"/>
    <!-- Stem line -->
    <path d="M 350,570 Q 230,480 310,280" stroke="#C49A00" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Right laurel (mirror) -->
  <g fill="url(#laurelGrad)" stroke="#9A7000" stroke-width="0.8">
    <ellipse cx="786" cy="530" rx="22" ry="10" transform="rotate(15 786 530)"/>
    <ellipse cx="812" cy="498" rx="22" ry="10" transform="rotate(35 812 498)"/>
    <ellipse cx="828" cy="462" rx="22" ry="10" transform="rotate(55 828 462)"/>
    <ellipse cx="833" cy="423" rx="22" ry="10" transform="rotate(72 833 423)"/>
    <ellipse cx="826" cy="385" rx="22" ry="10" transform="rotate(88 826 385)"/>
    <ellipse cx="809" cy="350" rx="22" ry="10" transform="rotate(105 809 350)"/>
    <ellipse cx="782" cy="320" rx="22" ry="10" transform="rotate(120 782 320)"/>
    <ellipse cx="749" cy="297" rx="22" ry="10" transform="rotate(135 749 297)"/>
    <ellipse cx="712" cy="282" rx="20" ry="9" transform="rotate(148 712 282)"/>
    <ellipse cx="672" cy="275" rx="18" ry="8" transform="rotate(158 672 275)"/>
    <path d="M 674,570 Q 794,480 714,280" stroke="#C49A00" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>

  <!-- ─── Shield (outer black) ─── -->
  <path filter="url(#shieldShadow)"
    d="M 290,255
       Q 290,220 320,218
       L 704,218
       Q 734,218 734,255
       L 734,520
       Q 726,640 512,770
       Q 298,640 290,520
       Z"
    fill="#1a1a1a" stroke="#111" stroke-width="4"/>

  <!-- Shield (outer cream) -->
  <path
    d="M 300,260
       Q 300,232 324,232
       L 700,232
       Q 724,232 724,260
       L 724,518
       Q 716,632 512,755
       Q 308,632 300,518
       Z"
    fill="url(#shieldFill)" stroke="#b0a080" stroke-width="2"/>

  <!-- Shield (inner accent line) -->
  <path
    d="M 320,268
       Q 320,246 338,246
       L 686,246
       Q 704,246 704,268
       L 704,514
       Q 696,620 512,738
       Q 328,620 320,514
       Z"
    fill="url(#shieldInner)" stroke="#c8b888" stroke-width="1.5"/>

  <!-- ─── Central element (fist or shield) ─── -->
  <!-- Glow behind it -->
  <circle cx="512" cy="490" r="160" fill="url(#elementGlow)"/>

  {central_element_svg}

  <!-- ─── Banner ─── -->
  <!-- Left ribbon fold -->
  <path d="M 310,690 L 280,720 L 310,720 Z" fill="#9A6E00"/>
  <!-- Right ribbon fold -->
  <path d="M 714,690 L 744,720 L 714,720 Z" fill="#9A6E00"/>

  <!-- Banner body -->
  <path
    d="M 305,668
       L 305,712
       Q 305,722 315,722
       L 709,722
       Q 719,722 719,712
       L 719,668
       Q 719,658 709,658
       L 315,658
       Q 305,658 305,668
       Z"
    fill="url(#bannerGrad)" stroke="#7A5800" stroke-width="2"/>

  <!-- Banner highlight strip -->
  <rect x="310" y="658" width="404" height="10" rx="2" fill="#FFE566" opacity="0.45"/>

  <!-- Stars in banner -->
  <!-- Star 1 (left) -->
  <polygon points="422,688 428,676 434,688 446,688 437,696 440,708 428,701 416,708 419,696 410,688"
    fill="#c8a800" stroke="#8a7000" stroke-width="0.5" opacity="0.85"/>
  <!-- Star 2 (center) -->
  <polygon points="506,688 512,676 518,688 530,688 521,696 524,708 512,701 500,708 503,696 494,688"
    fill="#c8a800" stroke="#8a7000" stroke-width="0.5" opacity="0.85"/>
  <!-- Star 3 (right) -->
  <polygon points="590,688 596,676 602,688 614,688 605,696 608,708 596,701 584,708 587,696 578,688"
    fill="#c8a800" stroke="#8a7000" stroke-width="0.5" opacity="0.85"/>

  <!-- Bottom shield tip -->
  <path
    d="M 430,722 L 512,770 L 594,722 Z"
    fill="#9A6E00" stroke="#7A5800" stroke-width="1.5"/>

  <!-- ─── Crown ─── -->
  <!-- Crown base band -->
  <rect x="355" y="250" width="314" height="52" rx="6"
    fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2.5"/>
  <rect x="358" y="252" width="308" height="18" rx="4" fill="url(#crownHighlight)" opacity="0.5"/>

  <!-- Crown spire left -->
  <polygon points="378,252 360,165 406,200"
    fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Crown spire right -->
  <polygon points="646,252 664,165 618,200"
    fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Crown spire center (tallest) -->
  <polygon points="472,252 512,130 552,252"
    fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2.5" stroke-linejoin="round"/>

  <!-- Crown orb left -->
  <circle cx="435" cy="196" r="20" fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2"/>
  <circle cx="429" cy="190" r="7" fill="#FFE566" opacity="0.7"/>
  <!-- Crown orb right -->
  <circle cx="589" cy="196" r="20" fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2"/>
  <circle cx="583" cy="190" r="7" fill="#FFE566" opacity="0.7"/>
  <!-- Crown orb center top -->
  <circle cx="512" cy="128" r="14" fill="url(#crownGrad)" stroke="#9A7000" stroke-width="2"/>
  <circle cx="507" cy="122" r="5" fill="#FFE566" opacity="0.7"/>
  <!-- Crown orb spire left top -->
  <circle cx="360" cy="163" r="10" fill="url(#crownGrad)" stroke="#9A7000" stroke-width="1.5"/>
  <!-- Crown orb spire right top -->
  <circle cx="664" cy="163" r="10" fill="url(#crownGrad)" stroke="#9A7000" stroke-width="1.5"/>

</svg>"""
    return svg


# ───────────────────────────────────────────────
# HIT BADGE — clenched fist
# ───────────────────────────────────────────────

# A stylized fist: fingers at top, palm below, thumb to the left
FIST_SVG = """
  <g transform="translate(512, 490)" filter="url(#shadow)">
    <!-- Finger row (4 rectangles with rounded tops) -->
    <rect x="-88" y="-120" width="34" height="80" rx="17" ry="17" fill="#CC3520" stroke="#8B1500" stroke-width="3"/>
    <rect x="-48" y="-135" width="34" height="95" rx="17" ry="17" fill="#CC3520" stroke="#8B1500" stroke-width="3"/>
    <rect x="-10" y="-132" width="34" height="92" rx="17" ry="17" fill="#CC3520" stroke="#8B1500" stroke-width="3"/>
    <rect x="28" y="-120" width="34" height="80" rx="17" ry="17" fill="#CC3520" stroke="#8B1500" stroke-width="3"/>

    <!-- Palm / knuckle block -->
    <rect x="-96" y="-55" width="156" height="110" rx="18" ry="18" fill="#CC3520" stroke="#8B1500" stroke-width="3"/>

    <!-- Thumb (left side, angled down) -->
    <rect x="-128" y="-30" width="50" height="34" rx="17" ry="17"
      transform="rotate(-20 -103 -13)"
      fill="#CC3520" stroke="#8B1500" stroke-width="3"/>

    <!-- Knuckle line highlights -->
    <line x1="-88" y1="-52" x2="-56" y2="-52" stroke="#FF6650" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <line x1="-48" y1="-52" x2="-16" y2="-52" stroke="#FF6650" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <line x1="-10" y1="-52" x2="22" y2="-52" stroke="#FF6650" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <line x1="28" y1="-52" x2="58" y2="-52" stroke="#FF6650" stroke-width="4" stroke-linecap="round" opacity="0.7"/>

    <!-- Wrist / base -->
    <rect x="-90" y="52" width="140" height="32" rx="12" ry="12" fill="#AA2A14" stroke="#8B1500" stroke-width="2"/>

    <!-- Impact lines (speed lines around fist) -->
    <line x1="75" y1="-110" x2="115" y2="-130" stroke="#FF4422" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <line x1="88" y1="-70"  x2="132" y2="-72"  stroke="#FF4422" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <line x1="78" y1="-30"  x2="120" y2="-18"  stroke="#FF4422" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <line x1="-100" y1="-120" x2="-135" y2="-145" stroke="#FF4422" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <line x1="-110" y1="-75" x2="-148" y2="-78" stroke="#FF4422" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  </g>
"""

# ───────────────────────────────────────────────
# BLK BADGE — inner shield / defensive shield
# ───────────────────────────────────────────────

SHIELD_SVG = """
  <g transform="translate(512, 490)" filter="url(#shadow)">
    <!-- Outer shield (dark purple outline) -->
    <path d="M 0,-135
             Q -120,-135 -120,-60
             L -120,50
             Q -90,120 0,155
             Q 90,120 120,50
             L 120,-60
             Q 120,-135 0,-135 Z"
      fill="#4c1d6e" stroke="#2a0e40" stroke-width="5"/>

    <!-- Inner shield face (purple gradient) -->
    <path d="M 0,-118
             Q -100,-118 -100,-55
             L -100,44
             Q -74,108 0,138
             Q 74,108 100,44
             L 100,-55
             Q 100,-118 0,-118 Z"
      fill="#7c3aed" stroke="#5b21b6" stroke-width="2"/>

    <!-- Shield shine / highlight -->
    <path d="M -30,-105 Q -80,-80 -82,-40 L -60,-40 Q -58,-70 -20,-95 Z"
      fill="#a78bfa" opacity="0.5"/>

    <!-- Inner cross / boss emblem -->
    <!-- Vertical bar -->
    <rect x="-14" y="-70" width="28" height="130" rx="8" fill="#c4b5fd" opacity="0.9"/>
    <!-- Horizontal bar -->
    <rect x="-68" y="-20" width="136" height="28" rx="8" fill="#c4b5fd" opacity="0.9"/>

    <!-- Center boss circle -->
    <circle cx="0" cy="10" r="26" fill="#ddd6fe" stroke="#7c3aed" stroke-width="3"/>
    <circle cx="0" cy="10" r="14" fill="#7c3aed"/>

    <!-- Shield border shine -->
    <path d="M 0,-118
             Q -100,-118 -100,-55
             L -100,44
             Q -74,108 0,138"
      fill="none" stroke="#a78bfa" stroke-width="3" opacity="0.5"/>
  </g>
"""

# ───────────────────────────────────────────────
# Generate the PNGs
# ───────────────────────────────────────────────

badges = [
    ("hit_badge.png", FIST_SVG, "#CC3520"),
    ("blk_badge.png", SHIELD_SVG, "#7c3aed"),
]

from PIL import Image, ImageFilter
import io

def remove_white_bg_and_add_glow(png_bytes: bytes, glow_rgb=(210, 160, 50)) -> bytes:
    """
    Mirrors the Pillow post-processing used on the other badges:
    1. Flood-fill from corners to remove white background → alpha channel
    2. Add a warm golden radial glow behind the artwork
    """
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    w, h = img.size

    # — Step 1: flood-fill white → transparent from all 4 corners —
    from PIL import ImageDraw
    # Work in RGBA; flood-fill each corner to mask the white background
    mask = Image.new("L", (w, h), 0)
    temp = img.copy().convert("RGB")

    # Use ImageDraw flood fill to find edge-connected white pixels
    # We'll do it by comparing to a threshold instead (more reliable)
    px = img.load()
    visited = [[False] * h for _ in range(w)]
    from collections import deque

    def flood(x0, y0, threshold=240):
        q = deque()
        q.append((x0, y0))
        while q:
            x, y = q.popleft()
            if x < 0 or x >= w or y < 0 or y >= h:
                continue
            if visited[x][y]:
                continue
            visited[x][y] = True
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)  # transparent
                q.append((x + 1, y)); q.append((x - 1, y))
                q.append((x, y + 1)); q.append((x, y - 1))

    flood(0, 0)
    flood(w - 1, 0)
    flood(0, h - 1)
    flood(w - 1, h - 1)

    # — Step 2: add warm golden radial glow behind the artwork —
    glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(glow_layer)

    cx, cy = w // 2, h // 2
    max_r = int(min(w, h) * 0.46)
    for r in range(max_r, 0, -1):
        alpha = int(160 * (1 - r / max_r) ** 1.6)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*glow_rgb, alpha),
        )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=28))

    # Composite: glow behind, badge on top
    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result = Image.alpha_composite(result, glow_layer)
    result = Image.alpha_composite(result, img)

    out = io.BytesIO()
    result.save(out, format="PNG")
    return out.getvalue()


for filename, element_svg, glow_color in badges:
    svg_str = make_badge(element_svg, glow_color, filename)
    out_path = os.path.join(OUTPUT_DIR, filename)

    # Render SVG → PNG bytes
    png_bytes = cairosvg.svg2png(bytestring=svg_str.encode(), output_width=1024, output_height=1024)

    # Apply Pillow post-processing (transparent bg + glow)
    final_bytes = remove_white_bg_and_add_glow(png_bytes)

    with open(out_path, "wb") as f:
        f.write(final_bytes)
    print(f"✓ Generated {out_path}")

print("Done.")
