export type CustomCategory = {
  key: string;
  label: string;
  weight: number;
  criteria: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  school: string;
  yoe: number;
  skills: string[];
  gca: number;
  rrk: number;
  leadership: number;
  googleyness: number;
  overall?: number;
  evidence: string[];
  resumeText: string;
  status: "pending" | "advanced" | "rejected";
  roleId: string;
  folder?: string;
  customScores?: Record<string, number>;
  rationale?: Record<string, string>;
};

export type RoleCriteria = {
  gca: string;
  rrk: string;
  leadership: string;
  googleyness: string;
};

export type RoleLabels = {
  gca: string;
  rrk: string;
  leadership: string;
  googleyness: string;
};

export const DEFAULT_LABELS: RoleLabels = {
  gca: "General Cognitive Ability",
  rrk: "Role-Related Knowledge",
  leadership: "Leadership",
  googleyness: "Googleyness",
};

export const DEFAULT_CRITERIA: RoleCriteria = {
  gca: "Problem-solving complexity, academic trajectory, learning agility, ability to operate in novel domains",
  rrk: "Hands-on depth in required languages and systems, evidence of production ownership",
  leadership: "Mentoring, cross-team influence, driving projects end-to-end without being told to",
  googleyness: "Intellectual curiosity, collaboration, community contributions, comfort with ambiguity",
};

export type Company = {
  id: string;
  name: string;
  color: string;
};

export const COMPANY_COLORS = [
  "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
  "linear-gradient(135deg, #059669 0%, #065f46 100%)",
];

export const COMPANIES: Company[] = [
  { id: "co1", name: "Google", color: COMPANY_COLORS[0] },
  { id: "co2", name: "Meta", color: COMPANY_COLORS[2] },
];

export type Role = {
  id: string;
  title: string;
  team: string;
  level: string;
  daysOpen: number;
  description: string;
  rubric: RubricWeights;
  criteria?: RoleCriteria;
  labels?: RoleLabels;
  status?: "open" | "closed";
  companyId?: string;
  customCategories?: CustomCategory[];
};

export type RubricWeights = {
  gca: number;
  rrk: number;
  leadership: number;
  googleyness: number;
};

export const ROLES: Role[] = [
  {
    id: "r1",
    title: "L5 Backend Engineer",
    team: "Payments Infrastructure",
    level: "L5",
    daysOpen: 12,
    description: "Backend engineer for payments infra. Needs distributed systems expertise, ideally has owned a service end-to-end in production.",
    rubric: { gca: 25, rrk: 35, leadership: 20, googleyness: 20 },
    companyId: "co1",
  },
  {
    id: "r2",
    title: "L6 Staff Engineer",
    team: "ML Platform",
    level: "L6",
    daysOpen: 5,
    description: "Staff engineer to lead ML infrastructure. Strong systems background, experience with training pipelines at scale.",
    rubric: { gca: 30, rrk: 30, leadership: 25, googleyness: 15 },
    companyId: "co1",
  },
  {
    id: "r3",
    title: "L4 Software Engineer",
    team: "Search & Ads",
    level: "L4",
    daysOpen: 21,
    description: "SWE for search ranking and ads systems. Strong CS fundamentals, experience with large-scale data processing.",
    rubric: { gca: 30, rrk: 35, leadership: 15, googleyness: 20 },
    companyId: "co2",
  },
];

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    title: "Senior Software Engineer",
    company: "Stripe",
    school: "MIT",
    yoe: 7,
    skills: ["distributed systems", "Go", "Kubernetes", "Postgres", "gRPC"],
    gca: 0.92,
    rrk: 0.88,
    leadership: 0.74,
    googleyness: 0.85,
    evidence: [
      "Led design of payment reconciliation service handling 2M transactions/day at Stripe, reducing settlement errors by 94%.",
      "Co-authored 3 internal RFCs on distributed state management adopted across 6 teams.",
      "Mentored 4 junior engineers; 2 received promotions within 18 months under her guidance.",
      "Open-source contributor to etcd with 47 merged PRs focused on leader election reliability.",
    ],
    resumeText: "Priya Sharma | priya.sharma@example.com\n\nSTRIPE — Senior Software Engineer (2018–present)\n- Led design of payment reconciliation service handling 2M transactions/day, reducing settlement errors by 94%\n- Co-authored 3 internal RFCs on distributed state management adopted across 6 teams\n- Mentored 4 junior engineers; 2 promoted within 18 months\n- On-call lead for payments-core (99.999% uptime SLA)\n\nPREVIOUS: Software Engineer @ Amazon (2017–2018)\n\nEDUCATION: MIT, B.S. Computer Science, 2017\n\nSKILLS: Go, Kubernetes, Postgres, gRPC, distributed systems, etcd",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c2",
    name: "Marcus Chen",
    email: "marcus.chen@example.com",
    title: "Staff Software Engineer",
    company: "Datadog",
    school: "Stanford",
    yoe: 10,
    skills: ["observability", "Python", "C++", "distributed tracing", "eBPF"],
    gca: 0.95,
    rrk: 0.91,
    leadership: 0.88,
    googleyness: 0.80,
    evidence: [
      "Architected Datadog's trace ingestion pipeline processing 15 billion spans per day across 40+ global regions.",
      "Grew platform team from 3 to 11 engineers over 2 years while maintaining delivery velocity.",
      "Stanford PhD in Computer Systems; published 2 OSDI papers on distributed tracing.",
      "Keynote speaker at KubeCon 2023 on eBPF-based observability at scale.",
    ],
    resumeText: "Marcus Chen | marcus.chen@example.com\n\nDATADOG — Staff Software Engineer (2019–present)\n- Architected trace ingestion pipeline: 15B spans/day, 40+ regions\n- Grew team from 3 to 11 engineers; established eng culture docs\n- Filed 2 internal patents on adaptive sampling algorithms\n\nSTANFORD — PhD Computer Systems (2014–2019)\n- Published: 'Scalable Distributed Tracing' (OSDI 2019), 'Causal Consistency at Scale' (OSDI 2018)\n\nSKILLS: Python, C++, eBPF, distributed tracing, Kafka, Flink",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c3",
    name: "Aisha Johnson",
    email: "aisha.j@example.com",
    title: "Software Engineer III",
    company: "Netflix",
    school: "CMU",
    yoe: 5,
    skills: ["Java", "Kafka", "microservices", "AWS", "Spring Boot"],
    gca: 0.84,
    rrk: 0.82,
    leadership: 0.60,
    googleyness: 0.78,
    evidence: [
      "Owns content delivery microservice serving 230 million subscribers with 99.99% uptime.",
      "Reduced p99 latency 40% via Kafka partition rebalancing and consumer group tuning.",
      "CMU Systems track, 3.9 GPA; thesis on adaptive video bitrate algorithms.",
      "Won Netflix internal innovation summit hackathon 2022 for streaming quality predictor.",
    ],
    resumeText: "Aisha Johnson | aisha.j@example.com\n\nNETFLIX — Software Engineer III (2020–present)\n- Owns content delivery microservice serving 230M subscribers\n- Reduced p99 latency 40% via Kafka partition rebalancing\n- Improved Chaos Engineering test coverage from 60% to 94%\n\nEDUCATION: CMU, B.S. + M.S. Computer Science (Systems), 2020 — GPA 3.9\nThesis: 'Adaptive Bitrate Optimization via Reinforcement Learning'\n\nSKILLS: Java, Kafka, Spring Boot, AWS, microservices",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c4",
    name: "Devon Patel",
    email: "devon.patel@example.com",
    title: "Software Engineer II",
    company: "Lyft",
    school: "Georgia Tech",
    yoe: 3,
    skills: ["Python", "React", "PostgreSQL", "Docker", "FastAPI"],
    gca: 0.76,
    rrk: 0.71,
    leadership: 0.45,
    googleyness: 0.72,
    evidence: [
      "Built driver incentive dashboard used by 80,000+ drivers; adopted as standard across 4 regions.",
      "Migrated legacy Flask monolith to FastAPI achieving 30% latency improvement.",
      "Contributed to Lyft's internal design system (200+ React components).",
      "Active in Georgia Tech CS alumni mentoring network, pairs with 3 students per semester.",
    ],
    resumeText: "Devon Patel | devon.patel@example.com\n\nLYFT — Software Engineer II (2022–present)\n- Built driver incentive dashboard: 80K+ drivers, 4 regions\n- Migrated Flask → FastAPI: 30% latency improvement\n- Contributed 200+ components to internal React design system\n\nEDUCATION: Georgia Tech, B.S. Computer Science, 2022\n\nSKILLS: Python, FastAPI, React, PostgreSQL, Docker",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c5",
    name: "Sofia Ruiz",
    email: "sofia.ruiz@example.com",
    title: "Software Engineer",
    company: "Cloudflare",
    school: "UT Austin",
    yoe: 4,
    skills: ["Rust", "networking", "edge computing", "C", "QUIC"],
    gca: 0.88,
    rrk: 0.79,
    leadership: 0.55,
    googleyness: 0.83,
    evidence: [
      "Implemented QUIC protocol improvements deployed across 200+ Cloudflare Points of Presence globally.",
      "Core contributor to Cloudflare's open-source Rust async I/O runtime (3.2k GitHub stars).",
      "Led internal tech talk series 'Edge Computing Fundamentals' attended by 300+ engineers.",
      "UT Austin valedictorian; CS + Mathematics double major with honors thesis.",
    ],
    resumeText: "Sofia Ruiz | sofia.ruiz@example.com\n\nCLOUDFLARE — Software Engineer (2021–present)\n- QUIC protocol improvements deployed to 200+ PoPs globally\n- Core contributor: async Rust I/O runtime (3.2k stars, open source)\n- Led 'Edge Computing Fundamentals' talk series (300 attendees)\n\nEDUCATION: UT Austin, B.S. CS + Mathematics, 2021 — Valedictorian\nHonors Thesis: 'Zero-RTT Connection Resumption in QUIC'\n\nSKILLS: Rust, C, QUIC, networking, edge computing",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c6",
    name: "Leo Kim",
    email: "leo.kim@example.com",
    title: "Software Engineer",
    company: "Robinhood",
    school: "UIUC",
    yoe: 2,
    skills: ["TypeScript", "GraphQL", "React", "Node.js", "Redis"],
    gca: 0.72,
    rrk: 0.68,
    leadership: 0.38,
    googleyness: 0.70,
    evidence: [
      "Built real-time options chain UI serving 5 million daily active users with sub-50ms render times.",
      "Migrated 12 REST endpoints to GraphQL reducing client-side overfetching by 60%.",
      "UIUC CS Honor Roll 2022; completed algorithms coursework with highest score in cohort.",
      "Personal: open-sourced a React hook library with 400+ GitHub stars and 30 contributors.",
    ],
    resumeText: "Leo Kim | leo.kim@example.com\n\nROBINHOOD — Software Engineer (2023–present)\n- Built real-time options chain UI: 5M DAU, <50ms render\n- Migrated REST → GraphQL: 60% reduction in data overfetch\n- Implemented Redis caching layer for market data feed\n\nEDUCATION: UIUC, B.S. Computer Science, 2023 — Honor Roll\n\nSKILLS: TypeScript, GraphQL, React, Node.js, Redis",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c7",
    name: "Jordan Walsh",
    email: "j.walsh@example.com",
    title: "Senior Software Engineer",
    company: "Palantir",
    school: "Yale",
    yoe: 6,
    skills: ["Java", "Apache Spark", "data pipelines", "Hadoop", "Scala"],
    gca: 0.86,
    rrk: 0.77,
    leadership: 0.66,
    googleyness: 0.65,
    evidence: [
      "Owns Palantir Foundry's data lineage graph component processing datasets up to 500TB.",
      "Led migration from Hadoop MapReduce to Apache Spark achieving 5× query speedup.",
      "Yale CS + Philosophy dual degree; ran internal distributed systems reading group with 20 members.",
      "Drove cross-team alignment on data catalog standards adopted by 8 product teams.",
    ],
    resumeText: "Jordan Walsh | j.walsh@example.com\n\nPALANTIR — Senior Software Engineer (2019–present)\n- Owns Foundry data lineage graph: handles 500TB datasets\n- Led Hadoop → Spark migration: 5× speedup\n- Drove data catalog standards adopted by 8 product teams\n- Ran internal distributed systems reading group (20 members)\n\nEDUCATION: Yale University, B.S. CS + Philosophy, 2019\n\nSKILLS: Java, Scala, Apache Spark, Hadoop, data pipelines",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c8",
    name: "Zara Ahmed",
    email: "zara.ahmed@example.com",
    title: "Software Engineer II",
    company: "Airbnb",
    school: "Princeton",
    yoe: 3,
    skills: ["Ruby", "Rails", "React", "MySQL", "Elasticsearch"],
    gca: 0.78,
    rrk: 0.69,
    leadership: 0.42,
    googleyness: 0.74,
    evidence: [
      "Rebuilt Airbnb's superhost badge system affecting 4 million hosts worldwide with zero downtime migration.",
      "Princeton thesis on ML-based dynamic pricing optimization, cited in 2 subsequent papers.",
      "Delivered 2 internal talks on database indexing strategies to 150+ engineers.",
      "Organized 3 Women in Tech events at Airbnb with 200+ cumulative attendees.",
    ],
    resumeText: "Zara Ahmed | zara.ahmed@example.com\n\nAIRBNB — Software Engineer II (2022–present)\n- Rebuilt superhost badge system: 4M hosts, zero-downtime migration\n- Improved Elasticsearch query performance 3× for host search\n- Gave 2 internal talks on DB indexing (150+ engineers each)\n\nEDUCATION: Princeton, B.S. Computer Science, 2022\nThesis: 'ML-Based Dynamic Pricing for Two-Sided Marketplaces'\n\nSKILLS: Ruby, Rails, React, MySQL, Elasticsearch",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c9",
    name: "Ryan O'Brien",
    email: "ryan.obrien@example.com",
    title: "Principal Engineer",
    company: "Twilio",
    school: "Boston University",
    yoe: 12,
    skills: ["telephony", "C++", "distributed systems", "reliability", "SRE"],
    gca: 0.90,
    rrk: 0.94,
    leadership: 0.85,
    googleyness: 0.68,
    evidence: [
      "Designed Twilio's global carrier routing layer handling 500 million messages per month across 150 countries.",
      "Filed 3 patents on VoIP reliability and adaptive routing under network partitions.",
      "Grew Twilio's platform reliability team from 5 to 30 engineers over 4 years.",
      "Speaker at QCon NY 2022 and 2023 on carrier-grade reliability engineering practices.",
    ],
    resumeText: "Ryan O'Brien | ryan.obrien@example.com\n\nTWILIO — Principal Engineer (2016–present)\n- Designed global carrier routing: 500M msgs/mo, 150 countries\n- Filed 3 patents: VoIP reliability, adaptive routing\n- Grew reliability team 5 → 30 engineers\n- Speaker: QCon NY 2022, 2023\n\nPREVIOUS: Sr. Engineer @ Vonage (2013–2016)\n\nEDUCATION: Boston University, B.S. Computer Engineering, 2013\n\nSKILLS: C++, telephony, distributed systems, SRE, reliability",
    status: "pending",
    roleId: "r1",
  },
  {
    id: "c10",
    name: "Nadia Osei",
    email: "nadia.osei@example.com",
    title: "Software Engineer",
    company: "Meta",
    school: "Howard University",
    yoe: 4,
    skills: ["Python", "C++", "ML infrastructure", "PyTorch", "CUDA"],
    gca: 0.83,
    rrk: 0.76,
    leadership: 0.52,
    googleyness: 0.88,
    evidence: [
      "Optimized PyTorch distributed training job scheduling at Meta, reducing GPU compute costs by $2M/year.",
      "Howard BSCS valedictorian; internships at Apple (ML infra) and SpaceX (simulation systems).",
      "Co-organized Meta's internal MLSys conference with 200+ attendees and 30 paper presentations.",
      "Active in Meta's Black@Meta ERG; led 6 career development workshops for underrepresented engineers.",
    ],
    resumeText: "Nadia Osei | nadia.osei@example.com\n\nMETA — Software Engineer, ML Infrastructure (2021–present)\n- Optimized PyTorch distributed training scheduling: $2M/yr savings\n- Reduced job queue latency 35% via priority-aware scheduler\n- Co-organized Meta MLSys conference: 200 attendees, 30 papers\n\nPREVIOUS: Intern @ Apple (ML Infra), SpaceX (Simulation)\n\nEDUCATION: Howard University, B.S. CS, 2021 — Valedictorian\n\nSKILLS: Python, C++, PyTorch, CUDA, ML infrastructure",
    status: "pending",
    roleId: "r1",
  },
];
