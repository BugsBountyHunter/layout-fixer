"""Render the toolbar/store icons. Run: npm run icons (requires Pillow with FreeType)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SIZES = (16, 32, 48, 128)
CANVAS = 1024
OUT_DIR = ROOT / "public" / "icons"
# The logo glyph uses Plex (OFL allows it in artwork); SF Arabic's license does not.
FONT = ROOT / "node_modules" / "@fontsource" / "ibm-plex-sans-arabic" / "files" / "ibm-plex-sans-arabic-arabic-600-normal.woff"
TILE = (0, 113, 227)  # --lf-accent in src/ui/tokens.css


def render() -> Image.Image:
    icon = Image.new("RGBA", (CANVAS, CANVAS))
    draw = ImageDraw.Draw(icon)
    draw.rounded_rectangle([0, 0, CANVAS - 1, CANVAS - 1], radius=CANVAS * 0.23, fill=TILE)
    glyph = ImageFont.truetype(str(FONT), int(CANVAS * 0.72))
    draw.text((CANVAS / 2, CANVAS * 0.53), "ع", font=glyph, fill="white", anchor="mm")
    return icon


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    master = render()
    for size in SIZES:
        master.resize((size, size), Image.LANCZOS).save(OUT_DIR / f"icon-{size}.png", optimize=True)
    print(f"Wrote {len(SIZES)} icons to {OUT_DIR}")


if __name__ == "__main__":
    main()
