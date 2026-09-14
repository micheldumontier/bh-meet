/* BioHackathon 2026 — hacking groups.
   Built from the projects deck (data/, git-ignored) via
   scripts/extract-projects.py, then curated by hand like data.js.

   Ids are name slugs. team/lead/interested hold participant ids from data.js;
   `guests` are people named on a slide who have no introduction slide, so they
   have nobody to link to.

   Fields: n name, sec section, ch slack channel, d summary, aims objectives,
   lead group leads (bold on the slide), team committed, interested tentative */
window.BH_PROJECTS = [
  { id: 'togomcp', n: 'TogoMCP', sec: 'Knowledge graphs and AI', ch: 'togomcp',
    d: 'Extending and enhancing TogoMCP, the BH25 product that gives AI agents access to life-science databases.',
    aims: ['Examine and refine MIE files', 'Find use cases and workflows, then turn them into skills', 'Work out how to write good SPARQL examples', 'Add new databases to TogoMCP'],
    lead: [], team: ['akira-kinjo', 'kozo-nishida', 'shuichi-kawashima', 'yuki-moriya', 'takatomo-fujisawa', 'priscilla-joanne', 'julia-koblitz', 'yasunori-yamamoto'],
    interested: ['daniel-puthawala', 'mayumi-kamada', 'susumu-goto', 'nuria-queralt-rosinach', 'naoya-yoshikuwa', 'claude-nanjo', 'toyofumi-fujiwara', 'yasuhiro-tanizawa'], guests: [] },

  { id: 'biosample-curation', n: 'LLM-assisted data curation of the BioSample database', sec: 'Knowledge graphs and AI', ch: null,
    d: "DBCLS's pipeline uses LLMs to map freely-written biological sample metadata to ontology terms, and has already mapped about 4 million BioSample records.",
    aims: ['Discuss best practice for LLM-assisted database curation', 'Categorise the main causes of pipeline error', 'Establish the provenance and completeness of the mappings', 'Build a visualisation of what the BioSample data actually contains'],
    lead: ['shuya-ikeda'], team: ['shuya-ikeda', 'tazro-ohta-and-macoto-ohta', 'kozo-nishida', 'nuria-fabrega'],
    interested: [], guests: ['Suecharo'] },

  { id: 'rdf-extraction-engine', n: 'RDF Data Extraction and Engine Implementation', sec: 'Knowledge graphs and AI', ch: null,
    d: 'Designing a consistent extraction process for human glycan data out of a sparsely documented knowledge base, and a dual-engine RDF back end.',
    aims: ['Design the RDF extraction strategy', 'Pair Virtuoso and QLever, for inferencing and for query speed', 'Use Jena ARQ algebra traversal for query inspection, policy enforcement and rewriting'],
    lead: [], team: ['miguel-mazumder', 'rajat-kumar-mondal'],
    interested: ['evan-bolton', 'daniel-puthawala'], guests: ['Ashanti'] },

  { id: 'osiris-mcp', n: 'OSIRIS MCP', sec: 'Knowledge graphs and AI', ch: null,
    d: 'Exploring MCP as a way to reach research information in OSIRIS securely, and whether reports and summaries can be written straight out of that data.',
    aims: ['Try MCP against the OSIRIS research information system', 'Generate simple research reports and summaries from the data', 'Compare notes on MCP limitations, concerns and best practice'],
    lead: ['julia-koblitz'], team: ['julia-koblitz', 'akira-kinjo'],
    interested: ['priscilla-joanne', 'naoya-yoshikuwa'], guests: [] },

  { id: 'variant-rdf-trials', n: 'Variant annotation in RDF for clinical trials matching', sec: 'Knowledge graphs and AI', ch: null,
    d: 'A follow-up to BH25 and BH23: connecting GA4GH VRS variants to ClinicalTrials.gov inclusion criteria, for matching patients to precision oncology trials.',
    aims: ['Develop an RDF model for GA4GH VRS v2', 'Integrate VRS 2 and Cat-VRS as the variant-RDF-to-trials layer'],
    lead: ['nuria-queralt-rosinach', 'daniel-puthawala'], team: ['nuria-queralt-rosinach', 'daniel-puthawala'],
    interested: ['orion-buske'], guests: [] },

  { id: 'clinical-graph-rag', n: 'Clinical Graph RAG', sec: 'Knowledge graphs and AI', ch: null,
    d: 'Using a logical model graph to work out which classes of data answer a clinical question, then querying the underlying sources through that graph.',
    aims: ['Use the Clinical Element Model and its object-oriented representation, COOL, as the logical model'],
    lead: [], team: ['claude-nanjo'],
    interested: ['nuria-queralt-rosinach', 'orion-buske', 'toyofumi-fujiwara'], guests: [] },

  { id: 'bioruby', n: 'BioRuby and Ruby for Bioinformatics', sec: 'Technology', ch: 'ruby',
    d: 'BioRuby is an open-source bioinformatics library for Ruby. Parts of the codebase are twenty years old and want modernising, with AI coding agents doing some of the work.',
    aims: ['Improve code, tests and documentation using AI coding agents', 'Adopt modern Ruby standards: rbs type annotations, simplecov, GitHub Actions', 'Discuss what shape a library should take to suit both AI and people', 'Look into recent Ruby bioinformatics tools such as togows-cli and dratools'],
    lead: ['naohisa-goto'], team: ['naohisa-goto', 'kozo-nishida'],
    interested: [], guests: [] },

  { id: 'academic-wasteland', n: 'The Academic Wasteland', sec: 'Technology', ch: 'academic-wasteland',
    d: 'Stand up at least three academic "gastowns" and do something useful in them — pangenome analysis, or a diagnosis, prognosis and treatment model.',
    aims: ['Define the principles, standards and technologies', 'Evaluate dolt, beads, wasteland and other gastown technologies', 'Work through web of trust, credentials, reputation, provenance, resource allocation, governance, accountability, federation and reproducibility'],
    lead: [], team: ['alex-kanitz', 'michel-dumontier', 'robert-hoehndorf'],
    interested: ['daniel-puthawala', 'toshiaki-katayama', 'priscilla-joanne', 'manabu-ishii', 'orion-buske'], guests: [] },

  { id: 'zebraseek', n: 'ZebraSeek: AI workflow for rare disease', sec: 'Biomedical', ch: 'zebraseek',
    d: 'A candidate-level ensemble for rare disease diagnosis — PubCaseFinder, GestaltMatcher, semantic search and a direct LLM — ranked by an LLM and then verified against the literature, returning a top five with explanations.',
    aims: ['Revise the draft paper and submit to BioHackrXiv', 'Improve the method: versions, prompts, normalisation, scoring rules', 'Update from 74 patients to 368 with the latest dataset'],
    lead: ['naoya-yoshikuwa'], team: ['naoya-yoshikuwa', 'toyofumi-fujiwara', 'orion-buske', 'tzung-chien-hsieh', 'hiroyuki-mishima', 'hirokazu-chiba', 'teppei-okazaki', 'atsuko-yamaguchi'],
    interested: ['susumu-goto', 'nuria-queralt-rosinach'], guests: [] },

  { id: 'expertboard', n: 'ExpertBoard: Pan-Asian Variant Review Network', sec: 'Biomedical', ch: 'expertboard',
    d: 'A regional framework for coordinating variant annotation, prioritisation and curation, and for sharing expert reviews across Asia. AI gathers the evidence; experts make the call. Carries forward results from MedHackathon Asia 2026 in Singapore.',
    aims: ['Use AI to collect evidence and classify against the ACMG 2015 guidelines on human-curated demo data', 'Review the ExpertBoard demo and agree next steps', 'Standardise and harmonise variant analysis pipelines', 'Share evidence, descriptions and classifications to reduce the VUS burden in Asia', 'Revise the draft perspective for the RDODJ special topic'],
    lead: ['rutharra', 'francis-tablizo', 'toyofumi-fujiwara', 'shoichiro-takahashi', 'yuko-kitano'],
    team: ['rutharra', 'francis-tablizo', 'toyofumi-fujiwara', 'shoichiro-takahashi', 'yuko-kitano', 'hiroki-muroda', 'ruka-kobayashi', 'hina-motoyoshi', 'mkkm-chipo-ruhwode', 'mayumi-kamada', 'orion-buske', 'tzung-chien-hsieh', 'shuichi-kawashima', 'yosuke-kawai'],
    interested: [], guests: [] },

  { id: 'nando-medgen', n: 'Connecting NANDO with MedGen', sec: 'Biomedical', ch: null,
    d: 'Linking Japanese rare and intractable disease information to international biomedical resources, by identifier and then by label.',
    aims: ['Explore existing links between NANDO and external disease resources', 'Identify MedGen IDs through linked identifiers and generate candidate mappings', 'Use LLMs to compare disease labels and synonyms where identifiers do not resolve', 'Classify the results into matches, ambiguous cases and non-matches'],
    lead: ['terue-takatsuki'], team: ['terue-takatsuki', 'evan-bolton', 'toyofumi-fujiwara', 'masae-hosoda'],
    interested: ['nuria-queralt-rosinach'], guests: ['Jaemoon Shin'] },

  { id: 'mondo-gestaltmatcher', n: 'Integrate MONDO into GestaltMatcher', sec: 'Biomedical', ch: null,
    d: 'GestaltMatcher works internally on OMIM IDs and phenotypic series. Adding MONDO would let it characterise syndrome subgroups precisely and interoperate with PubCaseFinder and ZebraSeek.',
    aims: ['Convert the international MONDO from OWL to OBO (done)', 'Implement the extensions in the GestaltMatcher gallery metadata', 'Discuss simple algorithms for distance between syndrome names in MONDO', 'Update the NGPsuite GUI for a MONDO-aware GestaltMatcher'],
    lead: [], team: ['hiroyuki-mishima', 'tzung-chien-hsieh', 'toyofumi-fujiwara'],
    interested: [], guests: [] },

  { id: 'mikan-genome', n: 'Mikan Genome Project: exploring Japanese citrus with AI', sec: 'Biomedical', ch: null,
    d: 'Public PacBio HiFi data now covers 18 citrus cultivars including Satsuma mandarin, Iyokan, Hassaku, Hyuganatsu, Ponkan and orange, and 2026 resources make haplotype-resolved, allele-level work possible. Can that data support a Japanese citrus pangenome that explains what makes each variety different?',
    aims: ['Build a haplotype-aware, Japanese citrus-focused pangenome from public HiFi data', 'Bring in experience with pangenomes and allele phasing — ideas and interpretation especially welcome', 'Run the large analyses on the OASIS HPC system at Kyushu University MIB'],
    lead: [], team: ['shuto-machida', 'toshiaki-katayama', 'mayumi-kamada'],
    interested: ['ryo-nozu', 'yuki-moriya', 'hidemasa-bono'], guests: [] },

  { id: 'hla-pangenome', n: 'Creating HLA pangenome graphs using Asian genomics data', sec: 'Biomedical', ch: null,
    d: 'Combining genomics data from Asian populations with pangenome tools such as pggb and minigraph-cactus to build HLA graphs, using the NIG supercomputer and publicly available data.',
    aims: ['Gather the genomics data', 'Build pangenome graphs for each population', 'Benchmark and compare'],
    lead: [], team: ['hassan-sibroe-abdulla-daanaa', 'kazumichi-fujiwara', 'robert-hoehndorf', 'shin-ichiro-tago', 'yosuke-kawai', 'apiwat-sangphukieo', 'toshiaki-katayama'],
    interested: [], guests: ['Dawn Chen'] },

  { id: 'patient-trajectories', n: 'Patient Trajectory Matching over Temporal Knowledge Graphs', sec: 'Biomedical', ch: null,
    d: 'Clinical trajectories are how diagnoses, treatments, procedures and measurements unfold over time. An open trajectory query engine would find patients whose histories satisfy a temporal pattern, then widen the search through explicitly permitted semantic and temporal relaxations, showing the evidence behind every result.',
    aims: ['Develop a theory of what a temporal knowledge graph actually is', 'Extend SULO for temporal knowledge representation', 'Specify a compact, flexible query language and implement indexed exact and fuzzy retrieval', 'Demo against MIMIC-IV: acute-care episodes involving medication exposure and later changes in kidney function'],
    lead: [], team: ['michel-dumontier', 'orion-buske', 'robert-hoehndorf', 'chang-sun'],
    interested: ['anggi', 'claude-nanjo'], guests: [] },

  { id: 'proteome-reanalysis', n: 'Proteome data re-analysis and visualization', sec: 'Multi-omics', ch: null,
    d: 'Establishing a proteome re-analysis workflow for jPOSTdb and updating its interface, taking jPOST from a repository to a database.',
    aims: ['Design a metaproteome re-analysis workflow and its applications', 'Design the system and interface of Mass++ for trans-omics use', 'Discuss trans-omics use cases for mass spectrometry data'],
    lead: [], team: ['susumu-goto', 'akiyasu-c-yoshizawa', 'shin-kawano', 'yushi-takahashi', 'satoshi-tanaka', 'yuki-moriya'],
    interested: ['evan-bolton'], guests: [] },

  { id: 'mbpost-metabolomicshub', n: 'Data interoperability between MB-POST and MetabolomicsHub', sec: 'Multi-omics', ch: null,
    d: 'Supporting the MetabolomicsHub common data model in the MB-POST repository, following the precedent set in MetaboLights.',
    aims: ['Add mhd support to MB-POST', 'Convert MB-POST result CSVs to the HUPO PSI mzTab-M standard, agentically where possible', 'Apply the same approach to ISA-Tab results in MetaboLights'],
    lead: [], team: ['yushi-takahashi', 'akiyasu-c-yoshizawa', 'kozo-nishida'],
    interested: [], guests: [] },

  { id: 'pathways-non-model', n: 'Pathway analysis environment for non-model organisms', sec: 'Multi-omics', ch: 'pathways',
    d: 'Pathways are used for little beyond enrichment analysis. QPX, continuing from BH23, builds new pathways for non-model organisms from public database annotations.',
    aims: ['Create pathways for non-model organisms using PathLift', 'Mine GPML from PMC by text mining', 'Analyse and visualise pathway data with Jupyter-AI', 'Case studies: hypoxic stress in cultured human cells, and transcriptome-metabolome integration in Symplocarpus renifolius'],
    lead: [], team: ['hidemasa-bono', 'ryo-nozu', 'naoya-oec', 'haruka-tanimoto'],
    interested: ['evan-bolton'], guests: [] },

  { id: 'glycan-edge-cases', n: 'Glycan edge case survey', sec: 'Multi-omics', ch: 'glycosmos',
    d: 'Refining the definition of a glycan by examining the edge cases either side of the glycan / non-glycan divide. A continuation of the BH25 project.',
    aims: ['Select optimal examples of the edge cases', 'Try AI as a way to assemble a set for human review', 'Discuss what glycoinformatics needs in order to handle in-scope and out-of-scope cases'],
    lead: [], team: ['evan-bolton', 'issaku-yamada'],
    interested: [], guests: [] },

  { id: 'jogo-next', n: 'From JoGo 1.0 to JoGo-Next', sec: 'Others', ch: 'haplotype',
    d: 'Developing JoGo into JoGo-Next: how haplotype diversity data should be collected and shared, and what a haplotype database needs to hold.',
    aims: ['Discuss the tools and frameworks needed for sharing haplotype data', 'Share the roadmap from JoGo 1.0 to JoGo-Next', 'Develop a Haplotype Analysis Toolkit, along the lines of GATK', 'Decide which complex genomic regions belong in the haplotype database'],
    lead: ['masao-nagasaki-contact-nagasaki-csml-org'], team: ['masao-nagasaki-contact-nagasaki-csml-org', 'pitiporn-noisagul', 'apiwat-sangphukieo', 'anggi', 'shuto-machida', 'jiandong-chen'],
    interested: ['taichi-matsubara'], guests: [] },

  { id: 'fruit-fly-cell-types', n: 'Let fruit fly do novel cell type detection', sec: 'Others', ch: null,
    d: 'The whole-brain fly connectome has been published as MaleCNS v1.0. Flies lose interest in a smell after repeated exposure — so turn single-cell transcriptome profiles into smells, let a simulated fly experience as many as possible, and see whether it stays calm for a known cell type and reacts to a novel one.',
    aims: ['Encode single-cell transcriptome profiles as olfactory stimuli', 'Train the in-silico fly brain on known cell types', 'Test whether novelty shows up as excitation'],
    lead: [], team: ['jiandong-chen'],
    interested: [], guests: [] },

  { id: 'db-id-extraction', n: 'DB ID extraction and linking', sec: 'Others', ch: null,
    d: 'An open, reproducible, regularly updated pipeline that extracts references to data entities — INSDC accessions, SRA experiment IDs and the like — from the full text of PMC Open Access, and links them back to the publications, creating an incentive to register data in public databases.',
    aims: ['Develop the pipeline to extract IDs and link them to publications', 'Try LLMs for classifying how each ID is used in the literature', 'Build a web page showing the outcome'],
    lead: [], team: ['yasunori-yamamoto', 'vijay-venkatesh'],
    interested: ['takatomo-fujisawa', 'evan-bolton', 'kozo-nishida'], guests: [] },

  { id: 'fatigue-and-fear', n: 'When Fatigue Reveals Fear', sec: 'Others', ch: null,
    d: 'When landing on both feet, do people considered recovered still shift away from the injured side, does fatigue amplify that shift and destabilise the trunk and pelvis, and does fatigue make fear of movement legible in the body? The hypothesis: conscious control masks psychological state at rest, and fatigue removes the mask.',
    aims: ['Show with open data that readiness to return to sport is a psychological state as much as a mechanical one', 'Test whether axial stability under fatigue tracks psychological readiness as closely as knee function does'],
    lead: [], team: ['haruma-abe', 'teppei-okazaki'],
    interested: [], guests: ['Keitaro'] },

  { id: 'marpolbase', n: 'Enhancement of MarpolBase', sec: 'Others', ch: null,
    d: 'MarpolBase is the genome database for the liverwort Marchantia polymorpha — an attractive model plant for evolutionary and developmental biology, and for database people too, with stable gene IDs and over 500 papers linked to more than 1,200 genes.',
    aims: ['Connect gene annotation out to reactions, pathways and chemical compounds', 'Develop RDF for gene annotation, expression data and literature links', 'Distribute through the RDF Portal and TogoID', 'Add an AI-friendly interface and an MCP server'],
    lead: ['yasuhiro-tanizawa'], team: ['yasuhiro-tanizawa', 'takatomo-fujisawa'],
    interested: ['tazro-ohta-and-macoto-ohta', 'evan-bolton'], guests: [] },

  { id: 'rdf-config-intermine', n: 'RDF-config + InterMine', sec: 'Others', ch: null,
    d: 'RDF-config is DBCLS\'s manual curation of public data into a standard RDF form for the RDF Portal, covering 64 datasets. Its sources are described in YAML, so assembling the right parts means generating a new YAML file.',
    aims: ['Work out how to assemble RDF-config sources into InterMine', 'Generate the YAML that describes the combination'],
    lead: ['gos-micklem'], team: ['gos-micklem', 'toshiaki-katayama', 'shuichi-kawashima'],
    interested: [], guests: [] },

  { id: 'bacterial-metabolic-traits', n: 'Predicting bacterial metabolic traits from genomes using AI', sec: 'Others', ch: null,
    d: 'Predicting the metabolic traits of bacteria — the electron donors and acceptors they use for energy metabolism, and their energy metabolism pathways — from genome annotation, and checking AI curation against manual curation.',
    aims: ['Review research papers with AI and extract the data', 'Compare AI curation with manual curation', 'Annotate predicted proteins with KofamScan and convert the results to RDF', 'Predict metabolic traits through MCP and visualise on phylogenetic trees'],
    lead: [], team: ['shuichi-kawashima', 'yoko-okabeppu', 'takeru-nakazato', 'risa-otsuka', 'julia-koblitz'],
    interested: [], guests: [] },

  { id: 'ai-survey-2026', n: 'AI survey 2026', sec: 'Others', ch: null,
    d: 'AI use is growing fast, so what does the next generation of bioinformaticians need to learn? Continuing the BH25 survey, which found most participants using AI every day.',
    aims: ['Develop the questionnaire', 'Survey BH26 participants', 'Recommend the basic skills bioinformaticians should train for'],
    lead: [], team: ['apiwat-sangphukieo', 'nattawet-sriwichai', 'pitiporn-noisagul'],
    interested: ['evan-bolton', 'anggi', 'claude-nanjo', 'susumu-goto'], guests: [] },

  { id: 'bpwiki', n: 'BPwiki: BioHackathon Project Wiki', sec: 'Others', ch: null,
    d: 'An AI-generated wiki over past BioHackathon projects, showing how they connect and develop over time through shared data, tools, topics and people, with a web interface for human review and comment feeding back into revision.',
    aims: ['Generate the wiki from source data', 'Build the web interface and review loop', 'Keep an update log of AI revisions'],
    lead: [], team: ['yui-asano'],
    interested: [], guests: [] },

  { id: 'omics-catalog', n: 'Omics Catalog Platform', sec: 'Others', ch: null,
    d: 'Part of the Omics Data Analysis Platform project: scalable data cataloguing with standardised metadata schemas, deployed and hosted by the university.',
    aims: ['Establish scalable data cataloguing', 'Standardise the metadata schemas', 'Deploy university-hosted'],
    lead: ['nattawet-sriwichai'], team: ['nattawet-sriwichai'],
    interested: [], guests: [] },

  { id: 'dhara', n: 'Implementing Federated Data Sharing in Thailand (DHARA)', sec: 'Others', ch: 'dhara',
    d: 'A proof-of-concept federated data-sharing framework for clinical and genomic data across study sites in Thailand. Still exploring what works in practice — experience with similar federated platforms or standards is very welcome.',
    aims: ['Explore GA4GH standards, particularly Phenopackets for clinical data and VRS for variants', 'Evaluate whether they support FAIR, interoperable sharing within the network', 'Identify the practical challenges, limitations and gaps', 'Use the pilot to choose standards and architecture for deployment'],
    lead: ['pitiporn-noisagul'], team: ['pitiporn-noisagul', 'nattawet-sriwichai'],
    interested: ['shoichiro-takahashi', 'claude-nanjo'], guests: [] }
];
