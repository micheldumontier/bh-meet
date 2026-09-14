// Generate the FAIR serialisations from data.js, which stays the single source
// of truth. Everything this writes is derived -- never edit the output by hand.
//
//   people.jsonld    one schema.org Person per participant, with PROV provenance
//   topics.jsonld    the topic tags as a SKOS concept scheme
//   dataset.jsonld   a schema.org Dataset / DCAT descriptor for the whole thing
//   index.html       the dataset block, injected between markers, so crawlers
//                    index the metadata (FAIR F4)
//
//   node scripts/build-jsonld.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const BASE = 'https://micheldumontier.github.io/bh-meet/';
const PEOPLE_DOC = 'people.jsonld';
const TOPICS_DOC = 'topics.jsonld';
const PROJECTS_DOC = 'projects.jsonld';
const DATASET_DOC = 'dataset.jsonld';
// CC0 for the data; the code stays MIT. Participant introductions are personal
// data, so this asserts the organisers' dedication, not a claim over the people.
const LICENSE = 'http://creativecommons.org/publicdomain/zero/1.0/';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync('data.js', 'utf8'), sandbox);
vm.runInContext(readFileSync('projects.js', 'utf8'), sandbox);
const people = sandbox.window.BH_PEOPLE;
const projects = sandbox.window.BH_PROJECTS || [];
const source = sandbox.window.BH_SOURCE;
const photos = JSON.parse(readFileSync('photos.json', 'utf8'));
const { countries } = JSON.parse(readFileSync('vocab/countries.json', 'utf8'));

const today = new Date().toISOString().slice(0, 10);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const personIri = (id) => `${BASE}${PEOPLE_DOC}#${id}`;
const topicIri = (t) => `${BASE}${TOPICS_DOC}#${slug(t)}`;
const projectIri = (id) => `${BASE}${PROJECTS_DOC}#${id}`;

// Which groups each person turns up in, so a Person node can point back.
const memberships = {};
for (const pr of projects) {
  for (const id of pr.team.concat(pr.interested)) {
    (memberships[id] = memberships[id] || []).push(projectIri(pr.id));
  }
}

// --- topics: a SKOS concept scheme -------------------------------------------
const topicCounts = {};
for (const p of people) for (const t of p.t) topicCounts[t] = (topicCounts[t] ?? 0) + 1;
const topics = Object.keys(topicCounts).sort();

const topicsDoc = {
  '@context': {
    '@vocab': 'http://www.w3.org/2004/02/skos/core#',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    dcterms: 'http://purl.org/dc/terms/',
    prefLabel: { '@id': 'skos:prefLabel', '@language': 'en' },
    inScheme: { '@id': 'skos:inScheme', '@type': '@id' },
    hasTopConcept: { '@id': 'skos:hasTopConcept', '@type': '@id' },
    license: { '@id': 'dcterms:license', '@type': '@id' },
  },
  // @graph must be the only top-level key beside @context. A node object that
  // carries @graph *and* other properties declares a NAMED graph, and every
  // triple inside it then sits outside the default graph, where most consumers
  // never look.
  '@graph': [
    {
      '@id': `${BASE}${TOPICS_DOC}`,
      '@type': 'ConceptScheme',
      prefLabel: 'BH26 Collaboration Index topics',
      'dcterms:description':
        'Topic tags used to index BioHackathon 2026 participants. A local vocabulary: '
        + 'the terms are the ones the index filters on, and are not yet mapped to EDAM '
        + 'or another published topic ontology.',
      license: LICENSE,
      hasTopConcept: topics.map(topicIri),
    },
    ...topics.map((t) => ({
      '@id': topicIri(t),
      '@type': 'Concept',
      prefLabel: t,
      inScheme: `${BASE}${TOPICS_DOC}`,
      'dcterms:extent': topicCounts[t],
    })),
  ],
};

// --- people -------------------------------------------------------------------
const peopleContext = {
  '@vocab': 'https://schema.org/',
  schema: 'https://schema.org/',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  dcterms: 'http://purl.org/dc/terms/',
  prov: 'http://www.w3.org/ns/prov#',
  knowsAbout: { '@id': 'schema:knowsAbout', '@type': '@id' },
  image: { '@id': 'schema:image', '@type': '@id' },
  memberOf: { '@id': 'schema:memberOf', '@type': '@id' },
  sameAs: { '@id': 'schema:sameAs', '@type': '@id' },
  isPartOf: { '@id': 'schema:isPartOf', '@type': '@id' },
  wasDerivedFrom: { '@id': 'prov:wasDerivedFrom', '@type': '@id' },
};

// Identify each country by its Wikidata IRI so all 87 people point at one
// shared resource, rather than each carrying a private blank node.
const country = (name) => {
  const hit = countries[name];
  if (!hit) return { '@type': 'Country', name };
  return {
    '@id': `http://www.wikidata.org/entity/${hit.wikidata}`,
    '@type': 'Country',
    name,
    identifier: hit.iso3166_1_alpha2,
  };
};

const personNode = (p) => {
  const node = {
    '@id': personIri(p.id),
    '@type': 'Person',
    name: p.n,
    identifier: p.id,
    description: p.i,
    affiliation: {
      '@type': 'Organization',
      name: p.a,
      address: { '@type': 'PostalAddress', addressCountry: country(p.c) },
    },
    knowsAbout: p.t.map(topicIri),
    isPartOf: `${BASE}${DATASET_DOC}#dataset`,
  };
  // Programming languages are schema.org ComputerLanguage, not topic concepts.
  if (p.co?.length) {
    node.knowsAbout = node.knowsAbout.concat(
      p.co.map((l) => ({ '@type': 'ComputerLanguage', name: l }))
    );
  }
  // ORCID: no slide in the deck carries one, so this is populated only when an
  // `o` field is added to data.js by hand. Never inferred from a name.
  if (p.o) {
    node.sameAs = `https://orcid.org/${p.o}`;
    node.identifier = [
      p.id,
      { '@type': 'PropertyValue', propertyID: 'https://registry.identifiers.org/registry/orcid', value: p.o },
    ];
  }
  if (photos[p.id]) node.image = BASE + photos[p.id];
  if (memberships[p.id]) node.memberOf = memberships[p.id];
  // Skills and the personal message have no faithful schema.org property, so
  // they travel as named PropertyValues rather than being forced into one.
  const extra = [];
  if (p.s) extra.push({ '@type': 'PropertyValue', name: 'skills', value: p.s });
  if (p.m) extra.push({ '@type': 'PropertyValue', name: 'message', value: p.m });
  if (extra.length) node.additionalProperty = extra;
  return node;
};

// As with topics.jsonld: @graph stays the only top-level key beside @context,
// and the document's own description rides inside it as one more node.
const peopleDoc = {
  '@context': peopleContext,
  '@graph': [
    {
      '@id': `${BASE}${PEOPLE_DOC}`,
      '@type': 'Dataset',
      name: 'BH26 Collaboration Index — participants',
      license: LICENSE,
      dateModified: today,
      wasDerivedFrom: source.deck,
      isPartOf: `${BASE}${DATASET_DOC}#dataset`,
    },
    ...people.map(personNode),
  ],
};

// --- projects -------------------------------------------------------------------
// schema.org's Role pattern keeps lead, team and interested distinguishable
// without inventing a local vocabulary for them: each membership is a Role
// node carrying a roleName, wrapped around the person it points at.
const projectsDoc = {
  '@context': {
    '@vocab': 'https://schema.org/',
    schema: 'https://schema.org/',
    prov: 'http://www.w3.org/ns/prov#',
    member: { '@id': 'schema:member' },
    isPartOf: { '@id': 'schema:isPartOf', '@type': '@id' },
    wasDerivedFrom: { '@id': 'prov:wasDerivedFrom', '@type': '@id' },
    license: { '@id': 'schema:license', '@type': '@id' },
  },
  '@graph': [
    {
      '@id': `${BASE}${PROJECTS_DOC}`,
      '@type': 'Dataset',
      name: 'BH26 Collaboration Index — hacking groups',
      license: LICENSE,
      dateModified: today,
      isPartOf: `${BASE}${DATASET_DOC}#dataset`,
    },
    ...projects.map((pr) => {
      const role = (id, name) => ({
        '@type': 'Role',
        roleName: name,
        member: { '@id': personIri(id) },
      });
      const node = {
        '@id': projectIri(pr.id),
        '@type': 'ResearchProject',
        name: pr.n,
        identifier: pr.id,
        description: pr.d,
        keywords: [pr.sec],
        isPartOf: `${BASE}${DATASET_DOC}#dataset`,
        member: pr.team
          .map((id) => role(id, pr.lead.includes(id) ? 'lead' : 'team'))
          .concat(pr.interested.map((id) => role(id, 'interested'))),
      };
      if (pr.aims && pr.aims.length) {
        node.additionalProperty = pr.aims.map((a) => ({
          '@type': 'PropertyValue', name: 'aim', value: a,
        }));
      }
      if (pr.ch) {
        node.additionalProperty = (node.additionalProperty || []).concat({
          '@type': 'PropertyValue', name: 'slackChannel', value: '#' + pr.ch,
        });
      }
      // Named on the slide but with no introduction to link to.
      if (pr.guests && pr.guests.length) {
        node.member = node.member.concat(pr.guests.map((n) => ({
          '@type': 'Role', roleName: 'team', member: { '@type': 'Person', name: n },
        })));
      }
      return node;
    }),
  ],
};

// --- dataset descriptor --------------------------------------------------------
const distribution = (path, type, name) => ({
  '@type': 'DataDownload',
  name,
  encodingFormat: type,
  contentUrl: BASE + path,
});

const datasetDoc = {
  '@context': {
    '@vocab': 'https://schema.org/',
    schema: 'https://schema.org/',
    dcat: 'http://www.w3.org/ns/dcat#',
    dcterms: 'http://purl.org/dc/terms/',
    prov: 'http://www.w3.org/ns/prov#',
    license: { '@id': 'schema:license', '@type': '@id' },
    wasDerivedFrom: { '@id': 'prov:wasDerivedFrom', '@type': '@id' },
    isBasedOn: { '@id': 'schema:isBasedOn', '@type': '@id' },
    codeRepository: { '@id': 'schema:codeRepository', '@type': '@id' },
  },
  '@id': `${BASE}${DATASET_DOC}#dataset`,
  '@type': ['Dataset', 'dcat:Dataset'],
  name: 'BH26 Collaboration Index',
  alternateName: 'bh-meet',
  description:
    'Self-introductions of BioHackathon 2026 participants in Matsuyama, indexed by '
    + 'research topic, programming language and skill, together with the hacking '
    + 'groups they formed. Curated by hand from the event slide decks.',
  url: BASE,
  license: LICENSE,
  creator: { '@type': 'Person', name: 'Michel Dumontier' },
  dateModified: today,
  version: today,
  inLanguage: 'en',
  keywords: topics,
  isBasedOn: source.deck,
  wasDerivedFrom: source.deck,
  codeRepository: 'https://github.com/micheldumontier/bh-meet',
  measurementTechnique:
    'Extracted from the slide deck with scripts/extract-deck.py, then curated by hand.',
  variableMeasured: [
    'name', 'affiliation', 'country', 'programming languages',
    'research interests', 'skills', 'personal message', 'topic tags',
    'project name', 'project section', 'project membership and role',
  ],
  distribution: [
    distribution(PEOPLE_DOC, 'application/ld+json', 'Participants as JSON-LD'),
    distribution(TOPICS_DOC, 'application/ld+json', 'Topic vocabulary as SKOS'),
    distribution(PROJECTS_DOC, 'application/ld+json', 'Hacking groups as JSON-LD'),
    distribution('projects.js', 'application/javascript', 'Hacking groups as the browser loads them'),
    distribution('data.js', 'application/javascript', 'Participants as the browser loads them'),
    distribution('photos.json', 'application/json', 'Portrait manifest'),
  ],
};

writeFileSync(PEOPLE_DOC, JSON.stringify(peopleDoc, null, 1) + '\n');
writeFileSync(TOPICS_DOC, JSON.stringify(topicsDoc, null, 1) + '\n');
writeFileSync(PROJECTS_DOC, JSON.stringify(projectsDoc, null, 1) + '\n');
writeFileSync(DATASET_DOC, JSON.stringify(datasetDoc, null, 1) + '\n');

// --- inject the dataset block into the page so crawlers see it ------------------
const START = '<!-- jsonld:start (generated by scripts/build-jsonld.mjs) -->';
const END = '<!-- jsonld:end -->';
let html = readFileSync('index.html', 'utf8');
const block = `${START}\n<script type="application/ld+json">\n`
  + JSON.stringify(datasetDoc, null, 1) + `\n</script>\n${END}`;
if (html.includes(START)) {
  html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
} else {
  html = html.replace('</head>', `${block}\n</head>`);
}
writeFileSync('index.html', html);
writeFileSync('Collaboration Index.dc.html', html);

console.log(`people.jsonld   ${people.length} people, ${Object.keys(photos).length} images`);
console.log(`topics.jsonld   ${topics.length} concepts`);
console.log(`projects.jsonld ${projects.length} groups, `
  + `${Object.keys(memberships).length} people linked`);
console.log(`dataset.jsonld  license ${LICENSE}`);
console.log(`index.html      dataset block ${html.includes(START) ? 'injected' : 'MISSING'}`);
const noCountry = people.filter((p) => !countries[p.c]).map((p) => p.c);
console.log(`countries       ${new Set(people.map((p) => p.c)).size} distinct, unresolved: ${new Set(noCountry).size || 'none'}`);
console.log(`orcid           ${people.filter((p) => p.o).length} of ${people.length} (populate the 'o' field by hand)`);
