"""Generate a src/layouts/<id>.ts data file from a macOS layout fixture.

  python3 scripts/generate-layout.py ArabicPC ar-pc > src/layouts/ar-pc.ts

Keys that type the same as US QWERTY are omitted, as are digits on non-Latin layouts
(users keep the digits they typed), mirrored bracket pairs, and --skip entries.
The result is hand-finished with metadata (label, chip, script, platform) and checked by layouts.test.ts.
"""
import argparse
import json
import unicodedata
from pathlib import Path

FIXTURES = Path(__file__).resolve().parent.parent / "src" / "layouts" / "fixtures"
ROWS = [
    ["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal"],
    ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"],
    ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"],
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"],
]
MIRRORED = {"()", ")(", "<>", "><", "{}", "}{", "[]", "]["}


def load(name: str) -> dict:
    return json.loads((FIXTURES / f"com.apple.keylayout.{name}.json").read_text())


def literal(char: str | None) -> str:
    if char is None:
        return "null"
    if all(unicodedata.category(c) == "Mn" for c in char):
        return "'" + "".join(f"\\u{ord(c):04X}" for c in char) + "'"
    return "'" + char.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("macos_id")
    parser.add_argument("layout_id")
    parser.add_argument("--latin", action="store_true", help="keep every key, including digits")
    parser.add_argument("--skip", nargs="*", default=[], help="layer:Code entries to leave unmapped")
    args = parser.parse_args()

    os_layout, us = load(args.macos_id), load("US")
    skip = set(args.skip)

    def pick(layer: str, code: str) -> str | None:
        char = os_layout[layer][code]
        if args.latin:
            return char or None
        if (not char or char == us[layer][code] or (layer == "base" and code.startswith("Digit"))
                or us[layer][code] + char in MIRRORED or f"{layer}:{code}" in skip):
            return None
        return char

    print(f"  keys: {{")
    for row in ROWS:
        entries = []
        for code in row:
            base, shift = pick("base", code), pick("shift", code)
            if base is not None or shift is not None:
                entries.append(f"{code}: [{literal(base)}, {literal(shift)}]")
        if entries:
            print("    " + ", ".join(entries) + ",")
    print("  },")


if __name__ == "__main__":
    main()
