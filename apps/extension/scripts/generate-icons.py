"""Render the toolbar/store icons. Run: npm run icons (requires Pillow with FreeType)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent.parent
SIZES = (16, 32, 48, 128)
CANVAS = 1024
OUT_DIR = ROOT / "public" / "icons"
STORE_ICON = REPO_ROOT / "docs" / "store" / "store-icon-128.png"
# Chrome Web Store: 128×128 file with 96×96 artwork and 16px transparent padding on each side.
STORE_ARTWORK = 96
# The logo glyph uses Plex (OFL allows it in artwork); SF Arabic's license does not.
FONT_FILE = Path("@fontsource", "ibm-plex-sans-arabic", "files", "ibm-plex-sans-arabic-arabic-600-normal.woff")
# npm workspaces hoist dependencies to the repository root; an app-level copy wins if one exists.
FONT = next(
    (path for path in (ROOT / "node_modules" / FONT_FILE, REPO_ROOT / "node_modules" / FONT_FILE) if path.exists()),
    REPO_ROOT / "node_modules" / FONT_FILE,
)
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
    store = Image.new("RGBA", (128, 128))
    offset = (128 - STORE_ARTWORK) // 2
    store.paste(master.resize((STORE_ARTWORK, STORE_ARTWORK), Image.LANCZOS), (offset, offset))
    store.save(STORE_ICON, optimize=True)
    print(f"Wrote {len(SIZES)} icons to {OUT_DIR} and the store icon to {STORE_ICON}")


if __name__ == "__main__":
    main()
