# BH26 Collaboration Index

A browsable index of BioHackathon 2026 participants — search people by topic,
language and skill, see who overlaps with you, and build a shortlist of people
to find at the event.

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
    photos/                     portraits
    _ds/                        Broadsheet design system (stylesheet + bundle)
    scripts/                    data and photo extraction
    data/                       source decks (git-ignored, see below)

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

The app reads nothing else. `photos.json` is a separate `id -> path` map so
portraits can be regenerated without touching `data.js`.

## Source decks

Participant data comes from the BH26 self-introduction deck. The exported
`.pptx` lives in `data/` and is **git-ignored** — it is ~128 MB, over GitHub's
100 MB per-file limit. Keep a local copy there to regenerate the data.

Source deck: https://docs.google.com/presentation/d/1UWasNu6Wa_zCRhuWErF0cu2-uHpxwVBOU_6bNarQe1c/edit

## Publishing

GitHub Pages, Settings → Pages → Source: "Deploy from a branch", branch `main`,
folder `/`. `.nojekyll` is present so the `_ds/` folder is not skipped — Jekyll
ignores underscore-prefixed directories otherwise.

## License

MIT — see [LICENSE](LICENSE).
