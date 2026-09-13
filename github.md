repo: micheldumontier/bh-meet
branch: main

## Last sync
date: 2026-09-12T00:00:00Z

### Updated in this project
- Rebuilt `data.js` from the link-shared copy of the BH26 self-introduction deck.
- Person ids are now that deck's slide numbers (p3 = slide 3), which is what the photo workflow keys on.
- Added `.github/workflows/fetch-photos.yml` + `scripts/fetch-photos.mjs` to pull portraits out of the deck and commit them.
- The index reads `photos.json`, so portraits appear as soon as the workflow has run once.

## Screen map
| Screen | Built from |
| --- | --- |
| Collaboration Index.dc.html | data.js, photos.json |
| Collaboration Index v1 (sample data).dc.html | earlier draft on invented sample data |
| .github/workflows/fetch-photos.yml | scripts/fetch-photos.mjs |

## Notes
Source deck (link-shared copy): https://docs.google.com/presentation/d/1UWasNu6Wa_zCRhuWErF0cu2-uHpxwVBOU_6bNarQe1c/edit
Slides 3-78 are in data.js. Slides 79-117 have not been read yet.
Slide 2 is the template, slide 40 duplicates slide 39, slide 73 is blank.
The photo workflow needs a GOOGLE_API_KEY repo secret with the Slides API enabled.
The project pitch deck does not exist yet; the pitch session is day 1.
