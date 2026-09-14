# BH26 Collaboration Index

A browsable index of BioHackathon 2026 participants — search people by topic,
language and skill, see who overlaps with you, and build a shortlist of people
to find at the event, and browse the 30 hacking groups they signed up to.
90 introductions, all with portraits; 76 of those people are on a group.

Live site: https://micheldumontier.github.io/bh-meet/

## Running it

Static site, no build step. Everything is served as-is, so any static file
server works:

    python3 -m http.server 8000

Then open http://localhost:8000/. Opening `index.html` straight from the
filesystem will not work — the page fetches `photos.json`, and `file://`
requests are blocked by CORS.

Any person is linkable: `?person=<slug>`, for example
[`?person=chang-sun`](https://micheldumontier.github.io/bh-meet/?person=chang-sun).
Selecting someone pushes a history entry, so Back steps through the people you
looked at. `?group=<slug>` opens one hacking group, `?tab=projects|graph|people`
opens a tab, and `#plan=<ids>` restores a shared shortlist.

## Sharing into Slack

`p/<slug>.html` and `g/<slug>.html` are share pages: one per person and per
group, each carrying its own Open Graph tags, so a link pasted into Slack
unfurls with that person's name, affiliation and portrait rather than a generic
site card. They redirect a browser straight into the app; unfurl bots read the
head and never run the script, so they see the card and stop.

They are also the only crawlable surface the site has — the app renders
everything in JavaScript — so `sitemap.xml` and `robots.txt` point at them.

Group cards link their Slack channel through
`https://biohackjp.slack.com/app_redirect?channel=<name>`, which resolves by
name and opens the desktop app when it is installed. Nine of the thirty groups
record a channel; the rest have none on their slide.

Regenerate both after changing `data.js` or `projects.js`:

    node scripts/build-jsonld.mjs
    node scripts/build-pages.mjs

## Layout

    index.html                  the app (a copy of Collaboration Index.dc.html)
    support.js                  runtime the page loads
    data.js                     the participants
    projects.js                 the hacking groups
    photos.json                 id -> portrait path, read by the app
    photos/                     portraits, 480x480 JPEG
    _ds/                        Broadsheet design system (stylesheet + bundle)
    scripts/extract-deck.py     pulls people and portraits out of the people deck
    scripts/extract-projects.py pulls the groups out of the projects deck
    scripts/build-jsonld.mjs    generates the JSON-LD from data.js
    scripts/build-pages.mjs     generates the share pages and sitemap
    p/, g/                      one share page per person and per group
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

That diff only catches changes *between exports*, so entries curated before the
first `.pptx` arrived could sit stale indefinitely. A second check compares each
curated field against the current slide and reports the ones that share almost
nothing; that is how a dozen entries describing the wrong hobby, the wrong city
and the wrong employer were found and fixed.

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

## FAIR serialisations

`data.js` is the single source of truth; everything below is generated from it
by `node scripts/build-jsonld.mjs`. Do not edit the JSON-LD by hand.

| File | What it is |
| --- | --- |
| `people.jsonld` | one `schema.org/Person` per participant, with `knowsAbout` linking to topic concepts and `ComputerLanguage` nodes |
| `topics.jsonld` | the 25 topic tags as a SKOS `ConceptScheme` |
| `projects.jsonld` | one `schema.org/ResearchProject` per group; membership uses the `Role` pattern so lead, team and interested stay distinguishable |
| `dataset.jsonld` | `schema.org/Dataset` + DCAT descriptor: license, version, provenance, distributions |

The dataset descriptor is also inlined into `index.html` as `application/ld+json`
so crawlers index it. Together the three files are about 3,000 triples and parse
cleanly with rdflib.

**Identifiers.** People are `people.jsonld#<slug>`, topics
`topics.jsonld#<slug>`. Hash IRIs into a retrievable document, because static
hosting cannot redirect `/id/<slug>` anywhere useful. They are globally unique
and dereference today, but their persistence is only as good as this repository
staying where it is — there is no w3id namespace or DOI behind them yet.

**Alignments.** Countries carry their Wikidata IRI and ISO 3166-1 alpha-2 code,
resolved from Wikidata property P297 (`vocab/countries.json`; regenerate rather
than hand-edit). Topics are a local vocabulary and are **not** yet mapped to
EDAM. Affiliations are plain strings, not ROR IDs. Every person node has room
for an ORCID via an optional `o` field on the `data.js` record — no slide in the
deck carries one, so all 90 are currently empty, and none are guessed from names.

**Licensing.** Data is CC0-1.0, code is MIT. CC0 does not waive privacy or
publicity rights over what remains personal data about identifiable people —
see [LICENSE-DATA](LICENSE-DATA).

## The groups

`projects.js` defines `window.BH_PROJECTS`, one object per hacking group: `n`
name, `sec` section, `ch` Slack channel, `d` summary, `aims`, and `lead`,
`team` and `interested` as participant ids from `data.js`. `guests` holds people
named on a slide who wrote no introduction, so there is nobody to link them to.

    python3 scripts/extract-projects.py

Names on the project slides are written however people felt like writing them —
first names, surnames, initials, reversed order, nicknames, typos — so each is
resolved against `people.jsonld` and reported with the rule that matched.
Anything ambiguous or unmatched is left for a human rather than guessed; of 158
names, 156 resolve and the last two are people with no introduction slide.

## Source decks

Decks live in `data/` and are git-ignored — the people deck is over GitHub's
100 MB per-file limit. `data/` now holds more than one kind of deck, so each
script picks the one it understands by filename and prints which it chose. Ask
the event organisers for the current exports.

## Publishing

GitHub Pages, Settings → Pages → Source: "Deploy from a branch", branch `main`,
folder `/`. `.nojekyll` is present so the `_ds/` folder is served — Jekyll skips
underscore-prefixed directories otherwise. Every path in the page is relative,
so the site works from the `/bh-meet/` subpath a project site is served under.

## License

Code MIT — see [LICENSE](LICENSE). Data CC0 1.0 — see [LICENSE-DATA](LICENSE-DATA).
Cite via [CITATION.cff](CITATION.cff).
