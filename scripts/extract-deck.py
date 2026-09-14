#!/usr/bin/env python3
"""Pull participants and portraits out of the BH26 self-introduction deck.

The deck is a .pptx export kept in data/ and git-ignored (it is ~128 MB, over
GitHub's per-file limit). Every participant slide follows the same template, so
each field is read from a known slot rather than by guessing:

    title placeholder            the person's name
    body placeholder, top strip  affiliation and country
    body placeholder, left       "Research background and interests:" / "Skills:"
    plain text box, right        "Coding:" / "Message:"
    picture, top-left ~square    the portrait

Writes people.json (raw text, one record per slide) next to the deck, and
crops/resizes each portrait into photos/. Curating that raw text into data.js
is a separate, deliberate step -- this script never writes data.js.

    python3 scripts/extract-deck.py [--deck data/BH26-people.pptx] [--no-photos]
"""

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import unicodedata
import zipfile
from pathlib import Path

# The portrait slot in the template, in EMU (914400 per inch). Generous
# bounds, because people nudge the placeholder around.
SLOT_MAX_X, SLOT_MAX_Y, SLOT_MIN_W = 1_600_000, 800_000, 400_000
# The affiliation strip runs along the top, right of the portrait: wide and
# short. The width test keeps the "Coding:" column, which also starts high on
# some slides, out of the affiliation.
STRIP_MAX_Y, STRIP_MIN_X, STRIP_MIN_W = 800_000, 1_500_000, 3_000_000
# A handful of slides use plain text boxes with no placeholders. There the name
# is whatever sits in the template's title row.
TITLE_MIN_Y, TITLE_MAX_Y = 400_000, 1_100_000

SECTIONS = {
    "interests": r"research background(?:\s*and\s*interests)?|background and interests",
    "skills": r"skills?",
    "coding": r"coding",
    "message": r"message",
}
PHOTO_PX = 480
VERTICAL_TAB = ""  # PowerPoint's soft line break inside a paragraph


def paragraphs(xml):
    """Text of each <a:p>, runs joined, blanks dropped."""
    out = []
    for p in re.findall(r"<a:p>(.*?)</a:p>", xml, re.S):
        t = "".join(html.unescape(m) for m in re.findall(r"<a:t>(.*?)</a:t>", p, re.S))
        t = t.replace(VERTICAL_TAB, " ").strip()
        if t:
            out.append(t)
    return out


def frame(node):
    """(x, y, w, h) of a shape, or None when it inherits its position."""
    m = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/><a:ext cx="(\d+)" cy="(\d+)"', node)
    return tuple(map(int, m.groups())) if m else None


def split_sections(lines):
    """Group lines under the template's section headings."""
    out, cur = {}, None
    for line in lines:
        head = re.match(r"^\s*([A-Za-z ]{3,40}?)\s*[:：]\s*(.*)$", line)
        label = None
        if head:
            for key, pat in SECTIONS.items():
                if re.fullmatch(pat, head.group(1).strip(), re.I):
                    label = key
                    break
        if label:
            cur = label
            out.setdefault(cur, [])
            if head.group(2).strip():
                out[cur].append(head.group(2).strip())
        elif cur:
            out[cur].append(re.sub(r"^[-•·*]\s*", "", line))
        else:
            out.setdefault("_lead", []).append(line)
    return out


def parse_slide(xml):
    name, strip, bodies, boxes, titleish = None, [], [], [], []
    for sp in re.findall(r"<p:sp>.*?</p:sp>", xml, re.S):
        ph = re.search(r'<p:ph[^>]*type="([^"]*)"', sp)
        kind = ph.group(1) if ph else None
        lines, box = paragraphs(sp), frame(sp)
        if not lines:
            continue
        if kind in ("title", "ctrTitle"):
            name = name or lines[0]
            continue
        if box and box[1] < STRIP_MAX_Y and box[0] > STRIP_MIN_X \
                and box[2] > STRIP_MIN_W:
            strip += lines
            continue
        if box and TITLE_MIN_Y < box[1] < TITLE_MAX_Y and box[0] > STRIP_MIN_X:
            titleish.append((box[1], lines[0]))
        if kind == "body":
            bodies.append((box, lines))
        else:
            boxes.append((box, lines))

    if not name and titleish:
        name = min(titleish)[1]
    if not name and strip:
        # Slides that fold the name into the affiliation strip.
        name = strip[0]
    if not name:
        # Fully free-form slide: take the topmost line on it.
        top = sorted((b for b in bodies + boxes if b[0]), key=lambda b: b[0][1])
        if top:
            name = top[0][1][0]

    # Left to right, so "interests/skills" is read before "coding/message".
    ordered = sorted(bodies + boxes, key=lambda b: (b[0][0] if b[0] else 1 << 40))
    merged = []
    for _, lines in ordered:
        merged += lines
    return name, strip, split_sections(merged), [lines for _, lines in ordered]


def portrait(xml, rels):
    """Media path and crop of the picture sitting in the template's slot."""
    best = None
    for pic in re.findall(r"<p:pic>.*?</p:pic>", xml, re.S):
        emb = re.search(r'r:embed="([^"]+)"', pic)
        box = frame(pic)
        if not (emb and box):
            continue
        x, y, w, h = box
        if x < SLOT_MAX_X and y < SLOT_MAX_Y and w > SLOT_MIN_W:
            crop = re.search(r"<a:srcRect([^/>]*)/>", pic)
            rect = ({k: int(v) / 100000
                     for k, v in re.findall(r'(\w)="(-?\d+)"', crop.group(1))}
                    if crop else {})
            target = rels.get(emb.group(1))
            if target and (best is None or w * h > best[2]):
                best = (target, rect, w * h)
    return best[:2] if best else (None, None)


def slug(name, taken):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[（(].*?[)）]", " ", s)
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower() or "person"
    out, i = s, 2
    while out in taken:
        out, i = f"{s}-{i}", i + 1
    taken.add(out)
    return out


def crop_resize(src_bytes, rect, dest):
    """Apply the deck's crop, square it off, and downscale to a web JPEG."""
    tmp = dest.with_suffix(".src")
    tmp.write_bytes(src_bytes)
    try:
        args = ["magick", str(tmp) + "[0]"]
        left, right = rect.get("l", 0), rect.get("r", 0)
        top, bottom = rect.get("t", 0), rect.get("b", 0)
        if any((left, right, top, bottom)):
            # srcRect is a fraction of the source, so the geometry has to be
            # resolved against the real pixel size before -crop sees it.
            out = subprocess.run(["magick", "identify", "-format", "%w %h",
                                  str(tmp) + "[0]"],
                                 check=True, capture_output=True)
            w, h = (int(v) for v in out.stdout.decode().split())
            cw, ch = max(1, round(w * (1 - left - right))), max(1, round(h * (1 - top - bottom)))
            args += ["-crop", f"{cw}x{ch}+{round(w * left)}+{round(h * top)}", "+repage"]
        args += ["-resize", f"{PHOTO_PX}x{PHOTO_PX}^", "-gravity", "center",
                 "-extent", f"{PHOTO_PX}x{PHOTO_PX}", "-strip",
                 "-quality", "82", str(dest)]
        subprocess.run(args, check=True, capture_output=True)
    finally:
        tmp.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--deck", help="default: the most recent data/*.pptx")
    ap.add_argument("--out", default="data/people.json")
    ap.add_argument("--photos", default="photos")
    ap.add_argument("--no-photos", action="store_true")
    args = ap.parse_args()

    # Exports arrive with whatever name the organisers gave them, so default to
    # the newest one rather than a fixed filename -- and say which was picked.
    if args.deck:
        deck = Path(args.deck)
        if not deck.exists():
            sys.exit(f"{deck} not found.")
    else:
        decks = sorted(Path("data").glob("*.pptx"), key=lambda p: p.stat().st_mtime)
        if not decks:
            sys.exit("No data/*.pptx found. The deck is git-ignored; export it there first.")
        # data/ now holds more than one kind of deck. Taking the newest outright
        # would happily read the projects deck as if it were people.
        named = [p for p in decks if re.search(r"people|introduc", p.name, re.I)]
        if named:
            deck = named[-1]
        else:
            deck = decks[-1]
            others = [p for p in decks if re.search(r"group|project|hack", p.name, re.I)]
            if others and deck in others:
                sys.exit(f"{deck.name} looks like a projects deck, not a people deck.\n"
                         "Pass --deck explicitly, or use scripts/extract-projects.py.")
        if len(decks) > 1:
            print(f"{len(decks)} decks in data/; picked the newest people deck")
    print(f"reading {deck}")
    if not args.no_photos and not shutil.which("magick"):
        sys.exit("ImageMagick ('magick') not found. Install it, or pass --no-photos.")

    zf = zipfile.ZipFile(deck)
    targets = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"',
                              zf.read("ppt/_rels/presentation.xml.rels").decode()))
    pres = zf.read("ppt/presentation.xml").decode()
    slides = [targets[r] for r in re.findall(r'<p:sldId[^>]*r:id="([^"]+)"', pres)]

    photodir = Path(args.photos)
    if not args.no_photos:
        photodir.mkdir(exist_ok=True)

    people, photos, taken, skipped = [], {}, set(), []
    for i, target in enumerate(slides, start=1):
        path = "ppt/" + target.lstrip("/").replace("../", "")
        xml = zf.read(path).decode()
        relpath = path.replace("slides/", "slides/_rels/") + ".rels"
        rels = {k: "ppt/" + v.replace("../", "")
                for k, v in re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"',
                                       zf.read(relpath).decode())}
        name, strip, sec, raw = parse_slide(xml)

        if not name or not re.search(r"[A-Za-z぀-鿿]", name):
            skipped.append((i, "no title"))
            continue
        if re.fullmatch(r"tem\s*plate|self-introduction", name.strip(), re.I):
            skipped.append((i, "template"))
            continue
        # Section dividers land in the title row too. They read like sentences:
        # long, many words, and usually punctuated.
        if len(name) > 60 or len(name.split()) > 8 or name.rstrip().endswith(":"):
            skipped.append((i, "not a name"))
            continue

        pid = slug(name, taken)
        media, rect = portrait(xml, rels)
        rec = {"id": pid, "slide": i, "name": name, "affiliation": strip,
               "interests": sec.get("interests", []), "skills": sec.get("skills", []),
               "coding": sec.get("coding", []), "message": sec.get("message", []),
               "other": sec.get("_lead", []), "raw": raw}
        if media and not args.no_photos:
            dest = photodir / f"{pid}.jpg"
            try:
                crop_resize(zf.read(media), rect, dest)
                photos[pid] = str(dest)
                rec["photo"] = str(dest)
            except subprocess.CalledProcessError as exc:
                print(f"  slide {i} ({name}): photo failed - "
                      f"{exc.stderr.decode()[:120]}")
        elif not media:
            print(f"  slide {i} ({name}): no portrait in the template slot")
        people.append(rec)

    Path(args.out).write_text(json.dumps(people, ensure_ascii=False, indent=1))
    if not args.no_photos:
        Path("photos.json").write_text(json.dumps(photos, ensure_ascii=False, indent=1))
    print(f"\n{len(people)} people -> {args.out}")
    print(f"{len(photos)} portraits -> {photodir}/")
    print("skipped: " + (", ".join(f"slide {n} ({why})" for n, why in skipped) or "none"))


if __name__ == "__main__":
    main()
