repo: micheldumontier/bh-meet
branch: main

## Last sync
date: 2026-09-13T00:00:00Z

### Updated in this project
- Added a README and an MIT license; committed the project to GitHub.
- Processed `data/BH26-people.pptx` (90 slides) with the new `scripts/extract-deck.py`:
  110 people and 84 portraits, up from 74 people and none.
- Ids are now stable name slugs, not slide numbers. The pptx and the old
  `data.js` disagreed on numbering from slide 16 onward, so slide-keyed photos
  would have attached the wrong face to the wrong person.
- Portraits now come out of the pptx directly (cropped per the deck's srcRect,
  480x480 JPEG, 3.1 MB total), so the Google Slides API is no longer involved.
- Removed `.github/workflows/fetch-photos.yml` and `scripts/fetch-photos.mjs`:
  they wrote `photos.json` keyed by `pN` slide numbers and would have clobbered
  the slug-keyed manifest on their next run.
- `data/people.json` (raw slide text) is git-ignored: one slide carries a host's
  Basic Auth credentials.

## Screen map
| Screen | Built from |
| --- | --- |
| Collaboration Index.dc.html | data.js, photos.json |
| Collaboration Index v1 (sample data).dc.html | earlier draft on invented sample data |
| photos/, photos.json | scripts/extract-deck.py, from data/BH26-people.pptx |

## Notes
Source deck (link-shared copy): https://docs.google.com/presentation/d/1UWasNu6Wa_zCRhuWErF0cu2-uHpxwVBOU_6bNarQe1c/edit
The pptx export in `data/` has 90 slides; the live Google deck has 117. 24 people
in `data.js` come only from the older read of that deck and have no portrait.
Slide 84 is the template, slide 85 a section divider, slides 81-82 carry no image.
`data.js` is curated by hand from `data/people.json`; the script never writes it.
The project pitch deck does not exist yet; the pitch session is day 1.
