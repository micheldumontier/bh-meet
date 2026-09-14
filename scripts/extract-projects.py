#!/usr/bin/env python3
"""Pull the hacking groups out of the BH26 projects deck.

The deck is a .pptx kept in data/ and git-ignored. Each project is one slide
following a template:

    title placeholder   the project name, sometimes with a #slack-channel
    body placeholder    "Participants", the roster, then "Description" and bullets

Bold runs in the roster mark the group lead. Section dividers ("Biomedical",
"Multi-omics", ...) are slides with a title and no body; every project after one
belongs to it.

Participant names are written however people felt like writing them -- first
names, surnames, initials, reversed order, typos -- so each is resolved against
the participant roster in people.jsonld and reported with the rule that matched.
Anything ambiguous or unmatched is left unresolved for a human, never guessed.

    python3 scripts/extract-projects.py [--deck data/...pptx]
"""

import argparse
import html
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

TEMPLATE_TITLE = "group topic"
# Lines that head a block rather than belong to one.
PARTICIPANT_HEAD = re.compile(r"^participants?\b", re.I)
DESCRIPTION_HEAD = re.compile(r"^(description|objectives?( this week)?|aims?|goals?)\b", re.I)
JOIN_LINE = re.compile(r"^(please join|join us|slack)\b", re.I)


def is_heading(text):
    return len(text) < 44 and text.rstrip().endswith(":")


def is_prose(text):
    """Several slides run straight from the roster into prose with no heading
    of any kind, so the roster has to end on shape rather than on a keyword.
    Names come in short comma-separated pieces; sentences do not."""
    pieces = [re.sub(r"\(.*?\)", " ", p) for p in split_top_level(text) if p.strip()]
    if not pieces:
        return False
    return max(len(p.split()) for p in pieces) > 5


def split_top_level(line):
    """Split on commas and semicolons outside parentheses, and on runs of
    whitespace -- "Evan Bolton (interested) Chipo Ruhwode" is two people, and
    "Bono (interested, especially C. hassaku)" is one."""
    out, buf, depth = [], "", 0
    for ch in line:
        if ch in "([\uff08":
            depth += 1
        elif ch in ")]\uff09":
            depth = max(0, depth - 1)
        if depth == 0 and ch in ",;":
            out.append(buf); buf = ""
        else:
            buf += ch
    out.append(buf)
    flat = []
    for piece in out:
        flat += [x for x in re.split(r"\s{2,}|\n", piece) if x.strip()]
    return flat


def fold(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]+", " ", s.lower()).strip()


def runs(paragraph):
    """[(bold, text)] for each run in an <a:p>."""
    out = []
    for r in re.findall(r"<a:r>(.*?)</a:r>", paragraph, re.S):
        text = "".join(html.unescape(m) for m in re.findall(r"<a:t>(.*?)</a:t>", r, re.S))
        if text.strip():
            out.append((re.search(r'<a:rPr[^>]*\bb="1"', r) is not None, text))
    return out


def shapes(xml):
    """[(placeholder kind, [(runs, text)])] for each shape holding text."""
    out = []
    for sp in re.findall(r"<p:sp>.*?</p:sp>", xml, re.S):
        ph = re.search(r'<p:ph[^>]*type="([^"]*)"', sp)
        kind = ph.group(1) if ph else "-"
        paras = []
        for p in re.findall(r"<a:p>(.*?)</a:p>", sp, re.S):
            rr = runs(p)
            if rr:
                paras.append((rr, "".join(t for _, t in rr).replace("", " ").strip()))
        if paras:
            out.append((kind, paras))
    return out


def parse_slide(xml):
    title, blocks = None, []
    for kind, paras in shapes(xml):
        if kind in ("title", "ctrTitle") and title is None:
            title = paras[0][1]
        elif kind == "body" or kind == "-":
            blocks.append(paras)

    people_raw, lead_raw, description = [], [], []
    for paras in blocks:
        # Headings scope to the shape they appear in; a stray "Description" in
        # one text box must not swallow the next box's roster.
        mode = None
        for rr, text in paras:
            if PARTICIPANT_HEAD.match(text):
                mode = "who"
                continue
            if DESCRIPTION_HEAD.match(text):
                mode = "what"
                continue
            if mode == "who":
                if JOIN_LINE.match(text):
                    continue
                if is_heading(text) or is_prose(text):
                    mode = "what"
                    description.append(text)
                    continue
                people_raw.append(text)
                lead_raw += [t for bold, t in rr if bold]
            elif mode == "what":
                description.append(text)
            elif text:
                description.append(text)

    if not people_raw:
        # No heading anywhere: take the one line that reads as a list of names
        # -- several short, capitalised, comma-separated pieces.
        best, best_n = None, 0
        for line in description:
            pieces = [re.sub(r"\(.*?\)", " ", p).strip() for p in split_top_level(line)]
            pieces = [p for p in pieces if p]
            if len(pieces) < 3:
                continue
            namey = [p for p in pieces
                     if len(p.split()) <= 4 and re.match(r"[A-Z\u00c0-\u024f]", p)]
            if len(namey) == len(pieces) and len(pieces) > best_n:
                best, best_n = line, len(pieces)
        if best:
            people_raw.append(best)
            description = [d for d in description if d != best]

    return title, people_raw, lead_raw, description


def split_names(line):
    """Split a roster line, keeping any parenthesised note with its name."""
    out = []
    for piece in split_top_level(line):
        piece = piece.strip(" .*…")
        if not piece:
            continue
        note = " ".join(re.findall(r"\((.*?)\)", piece)).strip()
        name = re.sub(r"\(.*?\)", " ", piece)
        name = re.sub(r"[←…#].*$", "", name).strip(" .*")
        name = re.sub(r"\s+", " ", name)
        if name:
            out.append((name, note))
    return out


def edits1(a, b):
    """At most one edit apart, transpositions included: the deck has
    "Takahahsi" for "Takahashi", which a plain edit distance calls two."""
    if a == b:
        return True
    if abs(len(a) - len(b)) > 1:
        return False
    if len(a) > len(b):
        a, b = b, a
    if len(a) < len(b):
        return any(a == b[:i] + b[i + 1:] for i in range(len(b)))
    diff = [i for i, (x, y) in enumerate(zip(a, b)) if x != y]
    if len(diff) == 1:
        return True
    if len(diff) == 2 and diff[1] == diff[0] + 1:
        i = diff[0]
        return a[i] == b[i + 1] and a[i + 1] == b[i]
    return False


class Roster:
    def __init__(self, people):
        self.people = people
        for p in people:
            p["_toks"] = fold(re.sub(r"\(.*?\)", " ", p["name"])).split()
            p["_full"] = " ".join(p["_toks"])
            # People are written on project slides by whatever they are called
            # in the room, which is often the nickname their own slide puts in
            # brackets: "Golf", "Sam", "Ruth".
            p["_alias"] = set(p["_toks"]) | set(fold(p["name"]).split())

    def resolve(self, raw):
        """(id, rule) or (None, why-not). Never guesses between two people."""
        toks = fold(raw).split()
        if not toks:
            return None, "empty"
        full = " ".join(toks)

        exact = [p for p in self.people if p["_full"] == full]
        if len(exact) == 1:
            return exact[0]["id"], "exact"

        # Every token given is part of the name: "Akira" -> Akira Kinjo,
        # "Bono" -> Hidemasa Bono, "Chen Jiangdong" -> reversed order.
        subset = [p for p in self.people if all(t in p["_alias"] for t in toks)]
        if len(subset) == 1:
            return subset[0]["id"], "subset"
        if len(subset) > 1:
            return None, "ambiguous: " + ", ".join(p["name"] for p in subset)

        # The slide gave a fuller name than the roster holds: the roster says
        # "Rutharra (Ruth)", the slide says "Rutharra Ghayadthri Manisekaran".
        over = [p for p in self.people if set(p["_toks"]) <= set(toks)]
        if len(over) == 1:
            return over[0]["id"], "fuller name"
        if len(over) > 1:
            return None, "ambiguous: " + ", ".join(p["name"] for p in over)

        # "Daniel P", "Nuria QR": leading name plus initials of the rest.
        initials = []
        for p in self.people:
            if not p["_toks"] or p["_toks"][0] != toks[0]:
                continue
            rest = "".join(toks[1:])
            if rest and rest == "".join(t[0] for t in p["_toks"][1:len(toks[1:]) + 1]):
                initials.append(p)
            elif rest and rest == "".join(t[0] for t in p["_toks"][1:]):
                initials.append(p)
        if len(initials) == 1:
            return initials[0]["id"], "initials"

        near = [p for p in self.people if edits1(p["_full"], full)]
        if len(near) == 1:
            return near[0]["id"], "typo"
        # One misspelt token against a full name of the same length.
        near2 = [p for p in self.people
                 if len(p["_toks"]) == len(toks)
                 and all(edits1(a, b) for a, b in zip(sorted(p["_toks"]), sorted(toks)))]
        if len(near2) == 1:
            return near2[0]["id"], "typo"

        # A shortening people actually use: "Rob" for Robert. Only when it is a
        # prefix of exactly one given name, and long enough not to be noise.
        if len(toks) == 1 and len(toks[0]) >= 3:
            pre = [p for p in self.people
                   if p["_toks"] and p["_toks"][0].startswith(toks[0])]
            if len(pre) == 1:
                return pre[0]["id"], "short form"
        return None, "no match"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--deck", help="default: the newest data/*.pptx naming groups or projects")
    ap.add_argument("--roster", default="people.jsonld")
    ap.add_argument("--out", default="data/projects.json")
    args = ap.parse_args()

    if args.deck:
        deck = Path(args.deck)
    else:
        cands = [p for p in Path("data").glob("*.pptx")
                 if re.search(r"group|project|hack", p.name, re.I)]
        if not cands:
            sys.exit("No data/*.pptx looks like a projects deck; pass --deck.")
        deck = max(cands, key=lambda p: p.stat().st_mtime)
    if not deck.exists():
        sys.exit(f"{deck} not found.")
    print(f"reading {deck}")

    doc = json.loads(Path(args.roster).read_text())
    people = [{"id": n["@id"].split("#")[-1], "name": n["name"]}
              for n in doc["@graph"] if n.get("@type") == "Person"]
    roster = Roster(people)
    print(f"roster: {len(people)} people from {args.roster}")

    zf = zipfile.ZipFile(deck)
    targets = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"',
                              zf.read("ppt/_rels/presentation.xml.rels").decode()))
    pres = zf.read("ppt/presentation.xml").decode()
    order = [targets[r] for r in re.findall(r'<p:sldId[^>]*r:id="([^"]+)"', pres)]

    projects, section, skipped, unresolved = [], None, [], []
    for i, target in enumerate(order, start=1):
        xml = zf.read("ppt/" + target.lstrip("/").replace("../", "")).decode()
        title, who, leads, desc = parse_slide(xml)
        if not title:
            skipped.append((i, "no title"))
            continue
        if fold(title) == TEMPLATE_TITLE:
            skipped.append((i, "template"))
            continue
        if not who and not desc:
            section = title.strip()
            skipped.append((i, f"section divider: {section}"))
            continue

        channel = None
        m = re.search(r"#([A-Za-z0-9_-]+)", title + " " + " ".join(desc))
        if m:
            channel = m.group(1)
        name = re.sub(r"\(\s*←?\s*clickable\s*\)", "", title)
        name = re.sub(r"#[A-Za-z0-9_-]+", "", name).strip(" -—")

        lead_keys = {fold(x) for x in leads}
        members = []
        for raw, note in [nm for line in who for nm in split_names(line)]:
            pid, rule = roster.resolve(raw)
            entry = {"raw": raw, "id": pid, "rule": rule,
                     "lead": any(fold(raw) and fold(raw) in k for k in lead_keys),
                     "interested": bool(re.search(r"interest", note, re.I))}
            if note:
                entry["note"] = note
            # "Yasunori, Yamamoto" is one person written with a stray comma,
            # and both halves resolve to him. Merge rather than list him twice.
            prior = next((m for m in members if pid and m["id"] == pid), None)
            if prior:
                prior["lead"] = prior["lead"] or entry["lead"]
                prior["interested"] = prior["interested"] and entry["interested"]
                prior["raw"] = max(prior["raw"], entry["raw"], key=len)
            else:
                members.append(entry)
            if not pid:
                unresolved.append((i, raw, rule))

        projects.append({"slide": i, "name": name, "section": section,
                         "channel": channel, "members": members,
                         "description": desc})

    Path(args.out).write_text(json.dumps(projects, ensure_ascii=False, indent=1))
    linked = sum(1 for p in projects for m in p["members"] if m["id"])
    total = sum(len(p["members"]) for p in projects)
    print(f"\n{len(projects)} projects -> {args.out}")
    print(f"participants: {linked}/{total} resolved to a person")
    by_rule = {}
    for p in projects:
        for m in p["members"]:
            if m["id"]:
                by_rule[m["rule"]] = by_rule.get(m["rule"], 0) + 1
    print("  by rule: " + ", ".join(f"{k} {v}" for k, v in sorted(by_rule.items())))
    print(f"\nunresolved ({len(unresolved)}) -- resolve these by hand, do not guess:")
    for slide, raw, why in unresolved:
        print(f"  slide {slide:>3}  {raw[:44]:<44} {why[:70]}")
    print("\nskipped: " + "; ".join(f"{n} ({w})" for n, w in skipped))


if __name__ == "__main__":
    main()
