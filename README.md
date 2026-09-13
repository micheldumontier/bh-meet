# BH26 Collaboration Index

A browsable index of BioHackathon 2026 participants — search people by topic,
language and skill, see who overlaps with you, and build a shortlist of people
to find at the event. 87 introductions, all with portraits.

Live site: https://micheldumontier.github.io/bh-meet/

## Running it

Static site, no build step. Everything is served as-is, so any static file
server works:

    python3 -m http.server 8000

Then open http://localhost:8000/. Opening `index.html` straight from the
filesystem will not work — the page fetches `photos.json`, and `file://`
requests are blocked by CORS.

## Layout

    index.html                  the app (a copy of Collaboration Index.dc.html)
    support.js                  runtime the page loads
    data.js                     the participants
    photos.json                 id -> portrait path, read by the app
    photos/                     portraits, 480x480 JPEG
    _ds/                        Broadsheet design system (stylesheet + bundle)
    scripts/extract-deck.py     pulls people and portraits out of the deck
    data/                       source deck and raw extract (both git-ignored)

`Collaboration Index v1 (sample data).dc.html` is an earlier draft built on
invented data, kept for reference.

## Data

`data.js` defines `window.BH_PEOPLE`, one object per person:

| Field | Meaning |
| --- | --- |
| `id` | stable slug, also the `photos.json` key |
| `n` `a` `c` | name, affiliation, country |
| `co` | coding languages and tools |
| `i` `s` `m` | interests, skills, personal message |
| `t` | topic tags, used by the graph and the filters |

The app reads nothing else. `photos.json` is a separate `id -> path` map, so
portraits can be regenerated without touching `data.js`.

The deck defines the roster: a person appears here only if they have a slide in
the current export. An earlier read of the Google deck contributed 24 people who
were absent from it, and they were dropped rather than carried forward.

Each new export is diffed against the previous one — people added, people gone,
and whose slide text changed — and only the affected entries are re-curated. The
rest of `data.js` is left alone.

Ids are name slugs, **not** slide numbers. The deck is reordered and renumbered
between exports — a person on slide 20 in one export is on slide 26 in the
next — so anything keyed on slide position silently attaches the wrong face to
the wrong person.

## Regenerating from the deck

Drop the exported deck anywhere in `data/`, then:

    python3 scripts/extract-deck.py

It reads the most recent `data/*.pptx` and prints which one it picked; pass
`--deck data/some-export.pptx` to choose explicitly.

That writes `photos/`, `photos.json`, and `data/people.json` — the raw text of
every slide, one record per person. It needs [ImageMagick][im] (`magick`) for
the portraits; pass `--no-photos` to skip them.

Every participant slide follows the same template, so the script reads each
field from a known slot rather than guessing: the title placeholder is the
name, the wide strip along the top is the affiliation, the left body holds
"Research background and interests" and "Skills", the right box holds "Coding"
and "Message", and the portrait is the picture in the top-left square. Slides
that abandon the template are still captured under `raw`.

**`data.js` is curated by hand from `data/people.json`, not generated.** The
slide text is long, inconsistent and occasionally holds things that should not
be republished — one slide carried a host's Basic Auth credentials. That is why
`data/people.json` is git-ignored along with the deck: both are local working
files. The script never writes `data.js`.

[im]: https://imagemagick.org

## Source deck

Decks live in `data/` and are git-ignored — each is 100+ MB, over GitHub's
100 MB per-file limit. Keep the latest export there to regenerate.

Source deck: https://docs.google.com/presentation/d/1UWasNu6Wa_zCRhuWErF0cu2-uHpxwVBOU_6bNarQe1c/edit

## Publishing

GitHub Pages, Settings → Pages → Source: "Deploy from a branch", branch `main`,
folder `/`. `.nojekyll` is present so the `_ds/` folder is served — Jekyll skips
underscore-prefixed directories otherwise. Every path in the page is relative,
so the site works from the `/bh-meet/` subpath a project site is served under.

## License

MIT — see [LICENSE](LICENSE).
