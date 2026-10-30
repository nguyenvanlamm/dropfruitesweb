"""Render src/static/og-image.png (1200x630) from the game's own art.

    python3 -m venv .venv && . .venv/bin/activate && pip install pillow
    python scripts/og-image.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "src" / "static"
W, H = 1200, 630

img = Image.new("RGB", (W, H), "#150f1e")
px = img.load()
top, bottom = (0x2B, 0x1E, 0x3A), (0x15, 0x0F, 0x1E)
for y in range(H):
    t = y / H
    row = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
    for x in range(W):
        px[x, y] = row

glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((720, -260, 1400, 420), fill=(122, 74, 170, 110))
gd.ellipse((-200, 380, 500, 900), fill=(240, 180, 94, 40))
glow = glow.filter(ImageFilter.GaussianBlur(90))
img = Image.alpha_composite(img.convert("RGBA"), glow)


def paste(name, size, xy, angle=0):
    fruit = Image.open(STATIC / "assets" / "fruits" / f"{name}.png").convert("RGBA")
    # Resize premultiplied, or transparent pixels bleed a halo around the art.
    fruit = fruit.crop(fruit.getbbox()).convert("RGBa")
    fruit = fruit.resize((size, size), Image.LANCZOS).rotate(angle, expand=True, resample=Image.BICUBIC).convert("RGBA")
    # Pad the shadow canvas so the blur isn't clipped into a visible square.
    pad = 40
    alpha = Image.new("L", (fruit.width + 2 * pad, fruit.height + 2 * pad), 0)
    alpha.paste(fruit.getchannel("A").point(lambda a: a * 0.45), (pad, pad))
    shadow = Image.new("RGBA", alpha.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(14)))
    img.alpha_composite(shadow, (xy[0] - pad, xy[1] + 16 - pad))
    img.alpha_composite(fruit, xy)


# The app icon in the right half — the vendor, the tipped pole and both
# baskets — with a few of the chain's fruit around it.
icon = Image.open(STATIC / "assets" / "img" / "app-icon-1024.png").convert("RGBA").resize((400, 400), Image.LANCZOS)
mask = Image.new("L", icon.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 399, 399), radius=90, fill=255)
icon.putalpha(mask)
pad = 40
alpha = Image.new("L", (icon.width + 2 * pad, icon.height + 2 * pad), 0)
alpha.paste(mask.point(lambda a: a * 0.5), (pad, pad))
shadow = Image.new("RGBA", alpha.size, (0, 0, 0, 0))
shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(18)))
img.alpha_composite(shadow, (740 - pad, 115 + 20 - pad))
img.alpha_composite(icon, (740, 115))
paste("jackfruit", 150, (1040, 430), 10)
paste("mangosteen", 104, (640, 470), -8)
paste("lychee", 84, (1080, 40), 12)
paste("kumquat", 70, (700, 60), -10)

font_path = str(STATIC / "assets" / "fonts" / "fredoka_wdth_wght.ttf")


def font(size, weight):
    f = ImageFont.truetype(font_path, size)
    try:
        f.set_variation_by_axes([weight, 100])
    except Exception:
        pass
    return f


d = ImageDraw.Draw(img)
d.text((80, 256), "Fruit Mischief", font=font(96, 700), fill="#fff6e9")
d.text((84, 378), "Carry the fruit.", font=font(46, 600), fill="#e9def5")
d.text((84, 434), "Keep the balance.", font=font(46, 700), fill="#ffd166")
pill = "Coming soon to iPhone"
pill_font = font(28, 600)
pw = d.textlength(pill, font=pill_font)
d.rounded_rectangle((84, 522, 84 + pw + 52, 574), radius=26, fill="#f0b45e")
d.text((110, 530), pill, font=pill_font, fill="#2b1e3a")

img.convert("RGB").save(STATIC / "og-image.png", optimize=True)
print("wrote", STATIC / "og-image.png")
