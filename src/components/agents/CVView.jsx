import React, { useState, useRef, useEffect } from "react";
import { PRINT_CLEANUP_CSS, flushAllSaves } from "../../utils/helpers";

const FOUNDER_SKILLS_V1 = [
  "AI Integration & Agentic Orchestration: Built proprietary 11-agent production platform; LLM workflow design, AI-driven SOPs, multi-agent systems",
  "Operations Architecture: SaaS stack consolidation, ways-of-working design, vendor licensing & negotiation, ops governance across multi-market entities",
  "Commercial & Finance: Full P&L ownership, multi-market financial reporting (cash flow, balance sheet), budget forecasting, contingency planning",
  "Cross-Functional Leadership: Multi-market stakeholder management, agency partnership models, talent contracting, SOW & usage rights negotiation",
  "Tools: Productive.io, Asana, Monday, Airtable, Claude Code, Midjourney, Elevenlabs",
];

const FOUNDER_CLIENTS_V1 = "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | JCREW | CIPRIANI | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY | COLUMBIA";

const CONTENT_PRODUCER_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Executive Producer",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York — July 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Executive Producer with 8+ years leading end-to-end content production for global luxury houses across photography, film, and integrated campaigns. Tokyo-born with Japanese-US-UK heritage; relocating to New York in July 2026.",
    "Career grounded in-house at Net-a-Porter Group (MR PORTER), Harvey Nichols (Al Tayer Insignia), and Vogue Arabia (Condé Nast), leading production for tier-1 brand and editorial campaigns. In 2024, founded ONNA — a creative consultancy and production house for global luxury institutions including Aman, Nike, Vogue Arabia, Tiffany & Co., Bvlgari, Loro Piana, and Charlotte Tilbury. Pioneered the integration of AI agents and LLM workflows into production SOPs.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | JCREW | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY | HARVEY NICHOLS",
  experience: [
    {
      role: "Founder and Executive Producer",
      company: "ONNA Production Ltd.",
      dates: "November 2024 - Present",
      bullets: [
        "End-to-End Content Production: Lead photography, film, and integrated campaign production for global luxury institutions (Aman, Nike, Vogue Arabia, Tiffany & Co., Bvlgari) — pre-production, casting, locations, scheduling, on-set execution, post-production (editing, retouching, sound), rights clearance, and final delivery.",
        "Aman Portfolio (4 delivered projects + 2 active proposals): Trusted long-term partner across the Aman and Janu portfolio. Lead multi-stakeholder decisions across Aman's VP of Brand, external creative partners, and developers; collaborated with photographers including Christopher Anderson and Mark Mahaney. Guide projects from initiation through delivery with regional cultural nuance; developed global production budgets for proposed expansions into New York and the Maldives.",
        "JA Resort — $500K Global Campaign (UAE & Maldives): Led a two-week, multi-location global campaign across the UAE and Maldives. Managed complex casting that combined international models with street-cast multigenerational families.",
        "Budget Ownership & Operational Rigor: Full P&L across all client engagements with a standardized 10% contingency model; maintain a 25% gross margin via a lean, partnership-led operating model. Negotiate SOWs, talent contracts, vendor agreements, and usage rights in close coordination with Finance and Legal counterparts.",
        "AI-Integrated Production: Pioneered LLM and agentic workflows in production SOPs; built a proprietary 11-agent production management platform automating client onboarding, accounting, and coordination — freeing creative and strategic capacity.",
        "Global Vendor & Crew Network: Built and manage freelance crew and retainer-based vendor relationships across the UK, GCC, Japan, and US, negotiated to luxury brand standards. Led ATL and BTL seasonal campaigns including OOH and digital storytelling for Vogue Arabia x New Balance, Bvlgari, and Tiffany & Co.",
      ],
    },
    {
      role: "Production Partner and Visuals Editor",
      company: "Condé Nast Inc. (Vogue Arabia)",
      dates: "December 2024 - Present",
      bullets: [
        "Trusted Long-Term Partner: Joined the British Vogue team as Visuals Editor during Vogue Arabia's return to Condé Nast internal management; the engagement evolved into an ongoing production partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
        "Talent and Cover Production: Operational expertise in tier-1 talent adjacent to CHANEL's world, including covers with Imaan Hammam, shoots with Halima Aden in New York, and Balquees in Dubai. Skills: talent casting, agent negotiation, on-set direction.",
        "Editorial Production at Global Standard: Art-directed and commissioned visual content with photographers Luc Braquet and Txema Yeste; navigated editorial budgets, global Condé Nast approval processes, and extreme timelines. Skills: art direction, commissioning, editorial workflow, multi-stakeholder approval management.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "June 2024 - November 2024",
      bullets: [
        "In-House Content Lead: Owned end-to-end visual production for Harvey Nichols, managing a high-volume seasonal asset engine across photography, film, and digital.",
        "Vendor Architecture: Designed a Retainer Partnership Model that cut variable costs 20% while maintaining luxury brand standards.",
        "Cross-Functional Alignment: Led a complex stakeholder matrix across Procurement, Marketing, and Creative to align annual content budget allocation across 360° advertising, marketing activations, and digital campaigns.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance / Self-Employed",
      dates: "June 2020 - November 2024",
      bullets: [
        "Charlotte Tilbury x Disney 100: Supported the $1m+ global activation, including on-set logistics, vendor management, Tier-1 content creator coordination (Monet McMichael, Victor Kunda, Danielle Marcan), and alignment with the Charlotte Tilbury pro artist team and stylist Nathan Klein. Skills: on-set production, vendor management, talent coordination.",
        "GUESS Global Ramadan Campaign: Led end-to-end production in Abu Dhabi with A-list models, navigating regional sensitivities and global brand standards. Skills: cross-cultural production, model casting, brand compliance.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "June 2019 - May 2024",
      bullets: [
        "Career Trajectory: Promoted twice in five years to Lead Producer, consistently exceeding KPIs within a complex stakeholder matrix under the Richemont Group.",
        "US Production Lead: Led several A-list talent shoots across LA, New York, and Miami, including 'MR PORTER In America' — a 360-degree, multi-brand campaign generating 2.65M views and a 75% engagement uplift.",
        "Brand Partnership Framework: Built a white-label production framework generating $500k+ in incremental annual revenue across Loro Piana, Brunello Cucinelli, Stone Island, and Hennessy.",
        "Talent-Led Production: Executive produced premium content featuring A-list talent (Finneas, Stefon Diggs) and US brands including Greg Lauren, Polite Worldwide, and Elder Statesman.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Content Production Leadership: End-to-end production across photography, film, and integrated content; pre-production, casting, locations, scheduling, on-set execution, post-production (editing, retouching, sound), rights clearance, and final delivery",
    "Production Operations & Governance: Budget ownership, contract management, PO and invoicing oversight, cost tracking, vendor negotiation across multi-market projects in coordination with Finance and Legal",
    "AI & Innovation in Production: Built proprietary 11-agent production management platform; LLM workflow design, AI-driven SOPs, familiarity with emerging tools across generative content and digital-twin workflows",
    "Cross-Functional & Global Collaboration: Multi-market stakeholder alignment; matrixed organizational navigation across luxury fashion, beauty, hospitality, and editorial",
    "External Partner Management: Global crew and vendor networks across UK, GCC, Japan, and US; talent contracting; usage rights and licensing",
    "Tools: Productive.io, Asana, Monday, Airtable, Smartsheet, Adobe Creative Suite, Midjourney, Elevenlabs",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
  volunteer: [
    {
      role: "Mentor",
      organization: "Graduate Fashion Foundation",
      dates: "2023",
      description: "Mentored a fashion graduate on career planning, CV development, and interview preparation.",
    },
  ],
};

const CREATIVE_PRODUCER_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Creative Producer",
  contact: {
    phone: "+1 (917) 735-8545",
    email: "emilyelucas@gmail.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onnaproduction.com",
    location: "Brooklyn, New York",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Creative Producer with 7+ years across branding, editorial, and consumer campaigns — connective tissue between clients, creative teams, and external production partners. Founded ONNA in 2024, a creative production studio running scopes, budgets, and global freelancer networks across photography, film, packaging, and digital deliverables for brands including Aman, Nike, Mastercard, Columbia, Vogue Arabia, Bvlgari, and Tiffany & Co.",
    "Career grounded inside Net-a-Porter Group (Richemont), Harvey Nichols (Al Tayer Insignia), and Condé Nast managing creative workflows, scopes, and vendor networks at both agency and in-house scale. Comfortable client-facing; fluent translating between strategy, creative, and execution. Brooklyn-based.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MASTERCARD | COLUMBIA | MR PORTER | NET-A-PORTER | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | JCREW | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY | HARVEY NICHOLS",
  experience: [
    {
      role: "Founder and Creative Producer",
      company: "ONNA Production LLC.",
      dates: "November 2024 - Present",
      bullets: [
        "Connective Tissue Across Client, Creative, and External Teams: Independently manage day-to-day workflow across branding, campaign, packaging, and digital projects for Aman, Nike, Vogue Arabia (Condé Nast), Tiffany & Co., and Bvlgari. Translate between client strategy, in-house creative direction, and freelance production partners.",
        "Scope, Contracts, and Budget Management: Author SOWs, negotiate contracts, manage usage rights, and track project budgets from $50K to $500K against scope and deliverables in close coordination with Finance and Legal counterparts.",
        "External Partner Network: Built and manage a global freelance network of photographers, videographers, retouchers, stylists, and production specialists across the UK, GCC, Japan, and US. Set clear expectations, manage performance, and resolve issues proactively.",
        "JA Resort — $500K Global Campaign (UAE & Maldives): Led a two-week, multi-location global campaign across UAE and Maldives. Managed complex casting that combined international models with street-cast multigenerational families.",
        "Operational Best Practices: Designed internal workflow tooling for project tracking, vendor coordination, and SOP enforcement — directly contributing to studio-wide operational improvement.",
        "Client-Facing Logistics & Timelines: Primary point of contact for small-to-medium project deliveries; anticipate needs, flag risks, and problem-solve in real time across multi-stakeholder environments.",
      ],
    },
    {
      role: "Visuals Editor (Freelance)",
      company: "Condé Nast Middle East LLC (Vogue Arabia)",
      dates: "December 2024 - March 2025",
      bullets: [
        "Client-facing partner during Vogue Arabia's return to Condé Nast internal management; translated between global Condé Nast creative direction, regional editorial team, and external photographers and visual artists.",
        "Art-directed and commissioned visual content with photographers Luc Braquet and Txema Yeste; managed editorial budgets, approval processes, and extreme timelines.",
        "Engagement evolved into ongoing production partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "June 2024 - November 2024",
      bullets: [
        "In-house producer managing creative workflow across photography, film, digital, and in-store campaigns — high-volume seasonal asset engine.",
        "Vendor Architecture: Designed a Retainer Partnership Model that cut variable costs 20% and became the team's default operating model.",
        "Cross-Functional Alignment: Led complex stakeholder matrix across Procurement, Marketing, and Creative to align annual content budget allocation across 360° advertising, marketing activations, and digital campaigns.",
      ],
    },
    {
      role: "Senior Producer (Freelance)",
      company: "Freelance / Self-Employed",
      dates: "June 2020 - November 2024",
      bullets: [
        "Charlotte Tilbury x Disney 100: Supported the $1M+ global activation, including on-set logistics, vendor management, Tier-1 content creator coordination (Monet McMichael, Victor Kunda, Danielle Marcan), and alignment with the Charlotte Tilbury pro artist team and stylist Nathan Klein.",
        "GUESS Global Ramadan Campaign: Led end-to-end production in Abu Dhabi with A-list models, navigating regional sensitivities and global brand standards.",
        "Editorial & Visual Research, Trippin: Wrote and image-researched feature pieces for Trippin examining ethical photography practice, Graciela Iturbide's portraiture, and the cultural history of tattooing in Japan.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "July 2019 - May 2024",
      bullets: [
        "Career Trajectory: Advanced three levels in five years from Picture Assistant to Lead Producer, consistently exceeding KPIs within a complex stakeholder matrix under the Richemont Group.",
        "Line Management: Day-to-day management and development of a contracted Production Assistant — owned work allocation, performance feedback, and career growth.",
        "US Production Lead: Led A-list talent shoots across LA, New York, and Miami including 'MR PORTER In America' (2.65M views, 75% engagement uplift).",
        "Brand Partnership Framework: Built a white-label production framework generating $500K+ in incremental annual revenue across Loro Piana, Brunello Cucinelli, Stone Island, and Hennessy.",
        "Editorial Writing & Picture Research: Wrote and image-researched original editorial features (including 'New York Through the Decades'), commissioning original photography and licensing archive imagery from photographers such as Bruce Davidson and Vivian Maier across MR PORTER's print and digital properties.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Project Management Tools: Asana, Monday, Trello, Airtable (fluent across all)",
    "Creative Production: Branding, campaign, packaging, and digital project management across cross-functional creative teams",
    "External Partner Networks: Global freelance network across photographers, videographers, retouchers, stylists, designers, and production specialists — UK, GCC, Japan, US",
    "Scopes, Contracts & Budgets: SOW authorship, contract negotiation, usage rights management, budget and hours tracking against scope",
    "Client Management: Primary client point of contact for small-to-medium projects; translating between strategy, creative, and execution",
    "Operational Best Practices: Workflow systems, SOP design, vendor partnership models, cross-functional process improvement",
    "Cross-Functional Collaboration: Operations, design, motion, copy, and creative teams across in-house and agency environments",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
  volunteer: [
    {
      role: "Mentor",
      organization: "Graduate Fashion Foundation",
      dates: "2023",
      description: "Mentored a fashion graduate on career planning, CV development, and interview preparation.",
    },
  ],
};

const VISUALS_EDITOR_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Visuals Editor & Producer",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York — July 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Visuals Editor and Producer with 7+ years across luxury fashion and editorial publishing, including direct experience as Visuals Editor for the relaunch of Vogue Arabia under Condé Nast — commissioning photography, art-directing visual artists, and curating editorial content across digital and print platforms.",
    "Career grounded inside Net-a-Porter Group (Richemont), Harvey Nichols (Al Tayer Insignia), and Condé Nast — fluent in fast-paced editorial workflow, global approval structures, and tier-1 talent shoots. Founded ONNA Production Ltd. in 2024 and continue to commission and produce for luxury editorial and brand campaigns including Aman, Tiffany & Co., Bvlgari, and ongoing Vogue Arabia advertorials. Tokyo-born with Japanese-US-UK heritage; relocating to New York in July 2026.",
  ],
  clients: "VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | HARVEY NICHOLS | AMAN | TIFFANY & CO | BVLGARI | LORO PIANA | CHARLOTTE TILBURY | NIKE | NEW BALANCE | HENNESSY | LOUIS VUITTON | JCREW",
  experience: [
    {
      role: "Founder and Producer",
      company: "ONNA Production Ltd.",
      dates: "November 2024 - Present",
      bullets: [
        "Editorial Commissioning and Art Direction: Commission, art-direct, and produce editorial visual content for global luxury clients including Aman, Nike, Vogue Arabia (Condé Nast), Tiffany & Co., Bvlgari, and Loro Piana. Ongoing collaborations with photographers Christopher Anderson and Mark Mahaney (Aman), Luc Braquet and Txema Yeste (Vogue Arabia).",
        "Vogue Arabia Advertorial Partner: Long-term production partner for Vogue Arabia's premium advertiser briefs with Bvlgari, Tiffany & Co., and New Balance — commissioning visuals, managing photographers, and delivering to Condé Nast standards under extreme timelines.",
        "Visual Identity Storytelling: Translate abstract creative briefs into culturally-grounded visual concepts. Aman's Saudi Arabia flagship pre-launch was anchored by bespoke regional poetry; JA Resort UAE/Maldives campaign combined international models with street-cast multigenerational families.",
        "Digital-First Output: Multi-format delivery across editorial digital, social, print, and OOH for global and regional platforms.",
      ],
    },
    {
      role: "Visuals Editor and Production Partner",
      company: "Condé Nast Inc. (Vogue Arabia)",
      dates: "December 2024 - Present",
      bullets: [
        "Visuals Editor for Vogue Arabia Relaunch: Joined the British Vogue team during Vogue Arabia's return to Condé Nast internal management. Curated and commissioned editorial visual content for the first three relaunch issues under a new global framework, working directly with the Editor-in-Chief, Global Creative Director, and Global Visuals Director.",
        "Art Direction and Commissioning: Commissioned and art-directed photographers (Luc Braquet, Txema Yeste), illustrators, and videographers across editorial campaigns. Covers with Imaan Hammam; shoots with Halima Aden in New York and Balquees in Dubai.",
        "Editorial Workflow at Global Standard: Navigated Condé Nast's global approval structure, photo research, and image licensing processes; managed extreme timelines and tight editorial budgets while elevating visual output.",
        "Trusted Long-Term Partner: Engagement evolved into ongoing production partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "June 2024 - November 2024",
      bullets: [
        "Visual Production at Volume: Owned end-to-end visual production for Harvey Nichols across photography, film, and digital — high-volume seasonal asset engine across all platforms.",
        "Cross-Channel Editorial Direction: Directed annual content distribution across 360° advertising, marketing activations, and multi-channel digital, e-commerce, and in-store platforms.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance / Self-Employed",
      dates: "June 2020 - November 2024",
      bullets: [
        "Charlotte Tilbury x Disney 100: Supported the $1M+ global activation with Tier-1 content creators (Monet McMichael, Victor Kunda, Danielle Marcan) and the Charlotte Tilbury pro artist team.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "June 2019 - May 2024",
      bullets: [
        "Career Trajectory: Promoted twice in five years to Lead Producer within a Richemont Group portfolio company, consistently exceeding KPIs.",
        "Editorial Authorship: Wrote and produced visual journalism for MR PORTER editorial — 'A History of Tattooing in Japan', 'Through the Lens: 6 Photographers on What Ethical Photography Means to Them', and 'The Stylish Gent's Guide to 2022's Freshest Menswear Trends'.",
        "Photo Research, Licensing, and Commissioning: Owned photo research, image licensing, and editorial commissioning across MR PORTER's digital editorial output.",
        "Line Management: Day-to-day management and development of a contracted Production Assistant — owned work allocation, performance feedback, and career growth across the team's high-volume shoot calendar.",
        "Tier-1 Talent Shoots: Executive produced premium content featuring A-list talent including Finneas and Stefon Diggs across LA, New York, and Miami.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Editorial Visuals & Art Direction: Commissioning, art-direction, editorial concept development; working with photographers, illustrators, and videographers across fashion and portrait photography",
    "Photo Research & Image Licensing: Editorial photo research, stock agency and image library knowledge, usage rights and licensing negotiation across editorial and advertorial work",
    "Digital-First Editorial Workflow: Visual content for digital platforms — social, web, newsletters; multi-format delivery across digital, print, and social",
    "Condé Nast Workflow: Direct experience navigating Condé Nast's global editorial approval structure, editorial budgets, and fast-cycle timelines",
    "Adobe Creative Suite: Photoshop, Lightroom, InDesign for editorial visuals workflow",
    "Tier-1 Talent Production: Cover shoots and editorial features with talent including Imaan Hammam, Halima Aden, Balquees, Finneas, and Stefon Diggs",
    "Photographer Network: Ongoing collaborations with Christopher Anderson, Mark Mahaney, Luc Braquet, Txema Yeste, plus an extensive freelance network across UK, GCC, Japan, and US",
    "Fast-Paced Editorial Production: Navigating extreme timelines, breaking visual content windows, and senior editorial stakeholder approval cycles",
    "Industry Depth: 7 years across Condé Nast, Net-a-Porter Group (Richemont), Harvey Nichols (Al Tayer Insignia), Aman, Tiffany & Co., Bvlgari",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
  volunteer: [
    {
      role: "Mentor",
      organization: "Graduate Fashion Foundation",
      dates: "2023",
      description: "Mentored a fashion graduate on career planning, CV development, and interview preparation.",
    },
  ],
};

const HEAD_OF_PRODUCTION_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Executive Producer & Head of Production",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York — July 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Senior production leader with 7+ years across luxury retail, fashion, and editorial — owning end-to-end production, post-production, vendor architecture, and budget across multi-format outputs (campaigns, editorial shoots, digital, e-commerce, in-store, and OOH).",
    "In-house production experience inside Net-a-Porter Group (Richemont) and Harvey Nichols (Al Tayer Insignia), where I owned high-volume seasonal asset engines spanning photography, film, digital, and e-commerce. Founded ONNA Production Ltd. in 2024, building a proprietary AI-integrated production platform that automates client onboarding, workflow coordination, and SOP enforcement — directly relevant to AI-assisted production workflows. Tokyo-born with Japanese-US-UK heritage; relocating to New York in July 2026.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | HARVEY NICHOLS | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | JCREW | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY",
  experience: [
    {
      role: "Founder and Executive Producer",
      company: "ONNA Production Ltd.",
      dates: "November 2024 - Present",
      bullets: [
        "End-to-End Production Leadership: Own the full production function for a portfolio of luxury clients including Aman, Nike, Vogue Arabia (Condé Nast), Tiffany & Co., Bvlgari, and Loro Piana — pre-production through post-production sign-off across photography, film, and integrated campaigns.",
        "Post-Production Oversight: Direct retouching, colour grading, editing, sound, and rights clearance across all client deliverables. Manage finishing partners and asset delivery to multi-format specs across print, digital, social, e-commerce, and OOH.",
        "AI-Integrated Production Infrastructure: Built a proprietary 11-agent production management platform that automates client onboarding, project coordination, accounting, and SOP enforcement — directly relevant to AI-assisted production workflows. Pioneered LLM and agentic workflows across creative SOPs.",
        "Operations & Process Design: Architected production SOPs, workflow templates, and a standardized 10% contingency model now used across all client engagements; lean partnership-based operating model delivers 25% gross margin.",
        "Consolidated Budget Ownership: Manage production budgets from $50K editorial commissions to $500K global campaigns (JA Resort — UAE and Maldives). Track spend against forecast across multi-market projects.",
        "Vendor Management: Built and lead a global roster of preferred photographers, retouchers, finishing partners, and production vendors across the UK, GCC, Japan, and US, with retainer-based agreements and negotiated rate cards.",
        "Network Leadership: Recruit, brief, and develop a global network of freelance crew and creative partners; manage performance, deliverables, and career development across engagements.",
      ],
    },
    {
      role: "Production Partner and Visuals Editor",
      company: "Condé Nast Inc. (Vogue Arabia)",
      dates: "December 2024 - Present",
      bullets: [
        "Trusted Long-Term Partner: Joined the British Vogue team during Vogue Arabia's return to Condé Nast internal management; engagement evolved into an ongoing production partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
        "Editorial Production at Global Standard: Art-directed and commissioned visual content with photographers Luc Braquet and Txema Yeste; oversaw retouching and finishing to global Condé Nast standards; navigated Condé Nast's global approval structure with the Editor-in-Chief, Global Creative Director, and Global Visuals Director.",
        "Tier-1 Talent and Cover Production: Covers with Imaan Hammam; shoots with Halima Aden in New York and Balquees in Dubai.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "June 2024 - November 2024",
      bullets: [
        "In-House Department Store Production: Owned end-to-end visual production for Harvey Nichols, managing a high-volume seasonal asset engine across photography, film, digital, e-commerce, and in-store activations — directly analogous to multi-banner department store production.",
        "Workflow & Vendor Architecture: Designed a Retainer Partnership Model that cut variable costs 20% — a workflow change that became the team's default operating model and stabilized vendor performance against agreed standards.",
        "Multi-Channel Budget Distribution: Directed the annual content budget across 360° advertising, marketing activations, and multi-channel digital campaigns to optimize ROI across all output formats.",
        "Cross-Functional Matrix: Led a complex stakeholder matrix across Procurement, Marketing, and Creative to align content strategy with commercial KPIs.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance / Self-Employed",
      dates: "June 2020 - November 2024",
      bullets: [
        "Charlotte Tilbury x Disney 100: Supported the $1M+ global activation across on-set logistics, vendor management, Tier-1 content creator coordination, and alignment with the Charlotte Tilbury pro artist team.",
        "GUESS Global Ramadan Campaign: Led end-to-end production in Abu Dhabi with A-list models, navigating regional sensitivities and global brand standards.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "June 2019 - May 2024",
      bullets: [
        "Richemont Group Luxury Retail Environment: Five years inside a Richemont Group portfolio company. Promoted twice in five years to Lead Producer, consistently exceeding KPIs.",
        "Line Management: Day-to-day management and development of a contracted Production Assistant — owned work allocation, performance feedback, and career growth across the team's high-volume shoot calendar.",
        "US Production Lead: Led A-list talent shoots across LA, New York, and Miami, including 'MR PORTER In America' — a 360-degree, multi-brand campaign generating 2.65M views and a 75% engagement uplift.",
        "Brand Partnership Framework: Built a white-label production framework generating $500K+ in incremental annual revenue across Loro Piana, Brunello Cucinelli, Stone Island, and Hennessy. Owned post-production handoff and multi-format delivery (digital, e-commerce, social, print).",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Production Leadership: End-to-end production across photography, film, and integrated content; pre-production, casting, locations, scheduling, on-set execution; senior production voice in creative reviews and cross-functional planning",
    "Post-Production: Retouching workflows, colour grading and management, editing, sound, asset delivery and versioning, DAM systems exposure, multi-format output across print, digital, social, e-commerce, and in-store",
    "Operations & Process Design: Production SOPs, workflow templates, master production calendar, project management tooling, KPI reporting on capacity and operational performance",
    "Budget Ownership: Consolidated multi-market production budgets; $50K-$500K project budgets; spend tracking against forecast; multi-banner budget oversight",
    "Vendor Management: Preferred-vendor roster construction, contract negotiation, rate card development, performance reviews, contingency planning",
    "Team & People: Line management (contracted Production Assistant at MR PORTER); freelance network leadership; mentor relationships (Graduate Fashion Foundation)",
    "AI & Workflow Innovation: Proprietary 11-agent AI production management platform; LLM workflow design; AI-driven SOPs; familiarity with AI-assisted retouching and emerging virtual production tools",
    "Luxury Retail Depth: 7 years across Net-a-Porter Group (Richemont), Harvey Nichols (Al Tayer Insignia), Condé Nast, Aman, Tiffany & Co., Bvlgari, Loro Piana",
    "Tools: Productive.io, Asana, Monday, Airtable, Smartsheet, Adobe Creative Suite, Midjourney, Elevenlabs, custom AI agents",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
  volunteer: [
    {
      role: "Mentor",
      organization: "Graduate Fashion Foundation",
      dates: "2023",
      description: "Mentored a fashion graduate on career planning, CV development, and interview preparation.",
    },
  ],
};

const STRATEGY_OPS_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Executive Producer & Creative Operations Lead",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York — July 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Senior production and operations leader with 8 years inside the luxury fashion industry. Founder and operator of ONNA Production Ltd., where I sit at the strategic decision-making layer — designing creative workflows, owning the P&L, and orchestrating cross-functional delivery for Aman, Nike, Vogue Arabia (Condé Nast), Tiffany & Co., Bvlgari, and Loro Piana.",
    "Career grounded in-house at Net-a-Porter Group (Richemont), Harvey Nichols (Al Tayer Insignia), and Vogue Arabia (Condé Nast), navigating complex matrixed organizations and senior stakeholder environments at VP of Brand, Editor-in-Chief, Global Creative Director, and Global Visuals Director level. Pioneered AI-integrated workflow systems that compress production cycles and eliminate bottlenecks across creative operations. Tokyo-born with Japanese-US-UK heritage; relocating to New York in July 2026.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | JCREW | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY | HARVEY NICHOLS",
  experience: [
    {
      role: "Founder and Executive Producer",
      company: "ONNA Production Ltd.",
      dates: "November 2024 - Present",
      bullets: [
        "Strategic Leadership: Operate at the strategic decision-making layer adjacent to client CBOs, VPs of Brand, and Creative Directors. Own end-to-end strategy, operations, P&L, and creative delivery for a portfolio of global luxury institutions including Aman, Nike, Vogue Arabia, Tiffany & Co., and Bvlgari.",
        "Workflow Optimization & Bottleneck Elimination: Pioneered LLM and agentic workflows across creative SOPs; built a proprietary 11-agent production management platform automating client onboarding, accounting, and project coordination — compressing production cycles and clearing the path for high-impact creative work.",
        "Aman Strategic Partnership (4 delivered + 2 active proposals): Trusted long-term partner across the Aman and Janu portfolio. Lead multi-stakeholder decisions across Aman's VP of Brand, external creative partners, and developers; collaborated with photographers including Christopher Anderson and Mark Mahaney; developed global production budgets for proposed expansions into New York and the Maldives.",
        "Cross-Functional Orchestration: Coordinate across client Brand, Marketing, Creative, Procurement, and Legal functions, plus external creative partners, agencies, and freelance networks. Translate ambiguous creative briefs into clear, actionable delivery plans across multi-market timelines.",
        "Creative Budget Ownership: Manage creative budgets from $50K editorial commissions to $500K global campaigns (JA Resort — UAE and Maldives). Standardized 10% contingency model; 25% gross margin via lean partnership-based operating model.",
        "Network Leadership: Built and lead a global network of freelance creative talent, photographers, vendors, and agency partners across the UK, GCC, Japan, and US, with retainer-based vendor relationships negotiated to luxury brand standards.",
      ],
    },
    {
      role: "Production Partner and Visuals Editor",
      company: "Condé Nast Inc. (Vogue Arabia)",
      dates: "December 2024 - Present",
      bullets: [
        "Trusted Long-Term Partner: Joined the British Vogue team during Vogue Arabia's return to Condé Nast internal management; engagement evolved into an ongoing partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
        "Senior Stakeholder Navigation: Worked directly with the Editor-in-Chief, Global Creative Director, Global Visuals Director, and British Vogue team; navigated Condé Nast's global approval structure and editorial governance with senior editorial stakeholders.",
        "Tier-1 Talent and Cover Production: Operational expertise with luxury-fashion talent — covers with Imaan Hammam, shoots with Halima Aden in New York, and Balquees in Dubai. Art-directed and commissioned with photographers Luc Braquet and Txema Yeste.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "June 2024 - November 2024",
      bullets: [
        "In-House Operations Lead: Owned end-to-end visual production for Harvey Nichols across photography, film, and digital, managing a high-volume seasonal asset engine.",
        "Workflow Architecture: Designed a Retainer Partnership Model that cut variable costs 20% — a workflow change that became the team's default operating model and elevated consistency of vendor performance.",
        "Cross-Functional Matrix Leadership: Led a complex stakeholder matrix across Procurement, Marketing, and Creative to align annual content strategy with commercial KPIs — directly analogous to the cross-functional alignment this role requires.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance / Self-Employed",
      dates: "June 2020 - November 2024",
      bullets: [
        "Charlotte Tilbury x Disney 100: Supported the $1M+ global activation across on-set logistics, vendor management, Tier-1 content creator coordination, and alignment with the Charlotte Tilbury pro artist team.",
        "GUESS Global Ramadan Campaign: Led end-to-end production in Abu Dhabi with A-list models, navigating regional sensitivities and global brand standards.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "June 2019 - May 2024",
      bullets: [
        "Richemont Group Stakeholder Environment: Five years inside a Richemont Group portfolio company, navigating a complex luxury-holding-company stakeholder matrix. Promoted twice in five years to Lead Producer, consistently exceeding KPIs.",
        "Line Management: Day-to-day management and development of a contracted Production Assistant — owned work allocation, performance feedback, and career growth across the team's high-volume shoot calendar.",
        "US Production Lead: Led A-list talent shoots across LA, New York, and Miami, including 'MR PORTER In America' — a 360-degree, multi-brand campaign generating 2.65M views and a 75% engagement uplift.",
        "Brand Partnership Framework: Built a white-label production framework generating $500K+ in incremental annual revenue across Loro Piana, Brunello Cucinelli, Stone Island, and Hennessy.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Strategic Operations & C-Suite Proximity: Cross-functional workflow design; senior stakeholder navigation at VP, Editor-in-Chief, Creative Director, and Global Visuals Director level; high-EQ operating at strategic decision-making layer",
    "Project & Program Management: End-to-end creative delivery across multi-market, multi-stakeholder initiatives; matrixed organizational navigation; complex initiative orchestration from concept to completion",
    "Creative Budget Ownership: P&L management; $50K-$500K project budgets; multi-market financial reporting; contract negotiation; vendor and licensing management",
    "AI & Workflow Innovation: LLM workflow design; proprietary AI-integrated production management platform; SOP automation eliminating production bottlenecks",
    "Luxury Industry Depth: 8 years across Net-a-Porter Group (Richemont), Condé Nast, Harvey Nichols (Al Tayer Insignia), Aman, Tiffany & Co., Bvlgari, Loro Piana",
    "Team & Network Leadership: Building and leading external creative networks across UK, GCC, Japan, and US; freelance crew management; mentor relationships with junior talent",
    "Tools: Productive.io, Asana, Monday, Airtable, Smartsheet, Adobe Creative Suite, Midjourney, Elevenlabs, custom AI agents",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
  volunteer: [
    {
      role: "Mentor",
      organization: "Graduate Fashion Foundation",
      dates: "2023",
      description: "Mentored a fashion graduate on career planning, CV development, and interview preparation.",
    },
  ],
};

const CREATIVE_STRATEGY_CV_V1 = {
  name: "EMILY LUCAS",
  title: "Creative Strategist",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York — June 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Creative strategist and founder building brand narratives and integrated campaigns for global luxury houses across fashion, beauty, hospitality, and editorial. Born in Tokyo, with Japanese-US-UK heritage; fluent across the US, UK, GCC, and Japanese markets. Relocating to New York in June 2026.",
    "After a career-defining tenure at Net-a-Porter Group leading creative for tier-1 brand partnerships, founded ONNA — a creative consultancy and production house bridging global luxury brands with the cultural specificity of regional markets. Select clients include Aman, Nike, Vogue Arabia (Condé Nast), Tiffany & Co., Bvlgari, Loro Piana, and Charlotte Tilbury. Deep agency partnership experience across IMA, IPG, Noe&Associates, and Free Practice.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (CONDÉ NAST) | MR PORTER | NET-A-PORTER | CHARLOTTE TILBURY | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | JCREW | HENNESSY | NEW BALANCE | GUESS | ONE&ONLY",
  experience: [
    {
      role: "Founder & Creative Strategist",
      company: "ONNA",
      dates: "11/2024 - Present",
      bullets: [
        "Brand Narrative Architecture: Led creative strategy for Aman's Saudi Arabia flagship pre-launch — translating an abstract, atmosphere-driven brief into a localized visual language built around bespoke regional poetry. Output drove residential sales and seeded an ongoing four-project Aman relationship.",
        "Global-to-Local Translation: Strategic lead on Nike Vomero 18 Middle East launch, bridging Nike Global brand DNA with on-the-ground execution at Burj Khalifa and Kite Beach. Result exceeded brief and triggered an additional buyout.",
        "New Business & Pitch Leadership: Architected the client acquisition strategy that scaled average monthly revenue 108% in year one at a 25% gross margin, via a lean agency-partnership-led model.",
        "Cultural Positioning as Service: Built ONNA's positioning explicitly around the gap between global luxury and the GCC/Asia markets — sold into Aman, Nike, Vogue, Mastercard, and Columbia.",
        "Integrated Campaign Leadership: Led ATL and BTL seasonal campaigns including OOH, digital storytelling, and multi-brand initiatives for Vogue Arabia x New Balance, Bvlgari, and Tiffany & Co.",
        "AI-Integrated Creative Ops: Pioneered LLM and agentic workflows into creative SOPs, freeing strategic capacity from administrative overhead.",
      ],
    },
    {
      role: "Visuals Editor (Relaunch)",
      company: "Vogue Arabia (Condé Nast)",
      dates: "12/2024 - 03/2025",
      bullets: [
        "Editorial Repositioning: Joined the British Vogue team to relaunch Vogue Arabia under a new global framework, navigating the title's return to Condé Nast internal management.",
        "Visual Authority: Curated and commissioned content for the first three relaunch issues, working with photographers Luc Braquet and Txema Yeste to re-establish the title within the global Vogue ecosystem.",
        "Long-Term Commercial Outcome: Relationship extended into ongoing production partnership on Vogue Arabia's premium advertiser briefs with Bvlgari, Tiffany & Co., and New Balance.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Harvey Nichols (Al Tayer Insignia)",
      dates: "06/2024 - 11/2024",
      bullets: [
        "Stakeholder Alignment: Led a complex stakeholder matrix across Procurement, Marketing, and Creative to align annual content strategy with commercial KPIs.",
        "Vendor Partnership Architecture: Designed a Retainer Partnership Model that cut variable costs 20% while maintaining luxury brand standards.",
        "Multi-Channel Campaign Leadership: Directed the annual content budget across 360° advertising, marketing activations, and digital campaigns.",
      ],
    },
    {
      role: "Senior Producer (Freelance)",
      company: "Independent",
      dates: "06/2020 - 11/2024",
      bullets: [
        "Global Activation at Scale: Supported the $1m+ Charlotte Tilbury x Disney 100 collaboration, working alongside Sofia Tilbury's pro artist team and stylist Nathan Klein across Tier-1 global content creators (Monet McMichael, Victor Kunda, Danielle Marcan).",
        "Talent-Led Campaigns: Led the GUESS Global Ramadan campaign in Abu Dhabi with A-list models.",
        "Additional clients: Siro Hotels, Maison Kitsune, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "MR PORTER (Net-a-Porter Group)",
      dates: "06/2019 - 05/2024",
      bullets: [
        "Career Trajectory: Promoted three levels from Picture Assistant to Lead Producer in four years, consistently exceeding KPIs.",
        "Flagship Campaign Strategy: Led 'MR PORTER In America' — a 360-degree, multi-brand activation generating 2.65M views and a 75% engagement uplift.",
        "Brand Partnership Framework: Built a white-label partnership model generating $500k+ in incremental annual revenue across Loro Piana, Stone Island, and Brunello Cucinelli.",
        "Editorial Authorship: Wrote visual research and journalism for MR PORTER editorial — A History of Tattooing in Japan, Through the Lens (ethical photography), and the Stylish Gent's Guide to menswear trends.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "Creative Strategy & Brand Narrative: Translating brand DNA into regional positioning; cultural storytelling; messaging frameworks; integrated campaign concepting",
    "Pitch Leadership & New Business: Client acquisition strategy, agency partnership models, scoping and SOWs across IMA, IPG, Noe&Associates, Free Practice",
    "Global Client Management: Multi-market stakeholder alignment; senior client partnerships across luxury fashion, beauty, hospitality, and editorial",
    "Editorial & Visual Authority: Art direction, commissioning, Condé Nast editorial workflow, visual journalism",
    "Commercial & P&L: Multi-market financial reporting, budget architecture, margin and contingency modelling",
    "AI-Integrated Creative Ops: LLM and agentic workflow design across creative SOPs",
    "Tools: Productive.io, Asana, Monday, Airtable, Adobe Creative Suite, Midjourney, Elevenlabs",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
};

const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.3;
const LS_HDR = 1.2;
const LINE_H = 1.55;

const DEFAULT_CV = {
  name: "EMILY LUCAS",
  title: "Executive Producer",
  contact: {
    phone: "+1 (917) 735-8545",
    email: "emilyelucas@gmail.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onnaproduction.com",
    location: "Brooklyn, NY (from July 2026)",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Executive Producer with 7+ years across editorial publishing and luxury fashion, leading photography, film, and integrated campaign production for global brands. Founded ONNA in 2024, a luxury production studio working with Aman, Nike, Vogue Arabia (Cond\u00E9 Nast), Tiffany & Co., and Bvlgari \u2014 scaling end-to-end production from pre-production through final delivery across the UK, GCC, Japan, and US.",
    "Most recently Visuals Editor for Vogue Arabia during its return to Cond\u00E9 Nast internal management, commissioning original photography from Luc Braquet and Txema Yeste, producing covers with tier-1 talent (Imaan Hammam, Achraf Hakimi, Halima Aden, Balqees Fathi). Prior to that, five years at MR PORTER scaling from Picture Assistant to Producer, with deep picture research and archive licensing background \u2014 cultural features for The Journal and The Post, licensing imagery from Bruce Davidson, Vivian Maier, and Saul Leiter.",
  ],
  clients: "AMAN | NIKE | VOGUE ARABIA (COND\u00C9 NAST) | MR PORTER | NET-A-PORTER | TIFFANY & CO | BVLGARI | LORO PIANA | LOUIS VUITTON | MASTERCARD | JCREW | HENNESSY | NEW BALANCE | ONE&ONLY | HARVEY NICHOLS | STONE ISLAND | JANU | CHARLOTTE TILBURY | GUESS",
  experience: [
    {
      role: "Founder & Executive Producer",
      company: "ONNA Production LLC.",
      dates: "11/2024 - Present",
      bullets: [
        "Editorial and brand production partner for Vogue Arabia (Cond\u00E9 Nast), Aman, Nike, Mastercard, and Columbia \u2014 commissioning photographers, art-directing shoots, and managing end-to-end delivery across photography and film.",
        "Trusted long-term partner across the Aman and Janu portfolio (4 projects); led multi-stakeholder decisions across Aman's VP of Brand and Marketing, external creative agencies, and residential developers. Developed global production budgets for proposed expansions into New York and the Maldives.",
        "Full P&L and budget management across all client engagements; negotiated SOWs, talent contracts, vendor agreements, and usage rights in close coordination with Finance and Legal counterparts. Maintained 25% profit margin in year one through a lean, freelance-heavy operational model.",
        "Built internal workflow tooling and AI-integrated infrastructure for vendor management, enabling seamless coordination of freelance crew and retainer-based vendor relationships across the UK, GCC, Japan, and US.",
        "Led ATL and BTL seasonal campaigns including OOH and digital storytelling across multiple markets; spearheaded multi-brand initiatives for Vogue Arabia x New Balance, Bvlgari, and Tiffany & Co.",
      ],
    },
    {
      role: "Visuals Editor (Freelance)",
      company: "Cond\u00E9 Nast Middle East LLC (Vogue Arabia)",
      dates: "12/2024 - 03/2025",
      bullets: [
        "Worked with the British Vogue team as Visuals Editor during Vogue Arabia's return to Cond\u00E9 Nast internal management; the engagement evolved into an ongoing production partnership delivering advertorial collaborations with Bvlgari, Tiffany & Co., and New Balance.",
        "Produced tier-1 talent shoots including covers with Imaan Hammam & Achraf Hakimi in Paris, Halima Aden in New York, and Balqees Fathi in Dubai.",
        "Art-directed and commissioned visual content, including photographers Luc Braquet and Txema Yeste; navigated editorial budgets, global Cond\u00E9 Nast approval processes, and extreme timelines.",
        "Visual research for digital content across web, social, and newsletters, as well as print \u2014 using photo licensing platforms including Trunk Archive, Shutterstock, Getty, and Cond\u00E9 Nast's internal DAM.",
      ],
    },
    {
      role: "Senior Editorial Producer",
      company: "Al Tayer Insignia LLC (Harvey Nichols)",
      dates: "06/2024 - 11/2024",
      bullets: [
        "In-house content lead: owned end-to-end visual production for Harvey Nichols, managing a high-volume seasonal asset engine across photography, film, and digital.",
        "Vendor architecture: designed a Retainer Partnership Model that cut variable costs 20% while maintaining luxury brand standards.",
        "Cross-functional alignment: led a complex stakeholder matrix across Procurement, Marketing, and Creative to align annual content budget allocation across 360\u00B0 advertising, marketing activations, and digital campaigns.",
      ],
    },
    {
      role: "Senior Producer & Researcher",
      company: "Freelance / Self-Employed",
      dates: "06/2020 - 11/2024",
      bullets: [
        "Editorial & visual research, Trippin: wrote and image-researched feature pieces examining ethical photography practice, Graciela Iturbide's portraiture, and the cultural history of tattooing in Japan.",
        "Charlotte Tilbury x Disney 100: supported the $1m+ global activation, including on-set logistics, vendor management, and Tier-1 content creator coordination (Monet McMichael, Victor Kunda, Danielle Marcan), alongside Charlotte Tilbury's pro artist team and stylist Nathan Klein.",
        "GUESS Global Ramadan Campaign: led end-to-end production in Abu Dhabi with A-list models, navigating regional sensitivities and global brand standards.",
        "Additional clients: Siro Hotels, Maison Kitsun\u00E9, Emirates, The Fold.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group Ltd. (MR PORTER)",
      dates: "07/2019 - 05/2024",
      bullets: [
        "Editorial writing & picture research: wrote, concepted, and image-researched original editorial features (including 'New York Through the Decades'), commissioning original photography and licensing archive imagery from photographers such as Bruce Davidson, Vivian Maier, and Saul Leiter across MR PORTER's digital (The Journal) and print (The Post, the MR PORTER book) properties.",
        "Awards season coverage: researched and edited visual content across awards season cycles, working to same-day and next-morning editorial timelines for digital publication.",
        "Career trajectory: advanced three levels in five years from Picture Assistant to Producer, consistently exceeding KPIs within a complex stakeholder matrix under the Richemont Group.",
        "US production lead: led several A-list talent shoots across LA, New York, and Miami, including 'MR PORTER In America' \u2014 a 360-degree multi-brand campaign generating 2.65M views and a 75% engagement uplift.",
        "Brand partnership framework: built a white-label production framework generating $500k+ in incremental annual revenue across Loro Piana, Brunello Cucinelli, Stone Island, and Hennessy.",
        "Talent-led production: led production on premium content featuring A-list talent (Finneas) and US brands including Greg Lauren, Polite Worldwide, and Elder Statesman.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours" },
  ],
  skills: [
    "P&L and Financial Reporting",
    "Global Vendor Negotiation",
    "Cross-Functional Stakeholder Management",
    "Risk Mitigation & Contingency Planning",
    "Photo Research & Image Licensing (Trunk Archive, Shutterstock, Getty, Magnum)",
    "Archival Research",
    "AI Workflow Integration",
    "Asana, Monday, Trello, Airtable",
    "Adobe Creative Suite",
    "Midjourney",
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
};

const InlineEdit = ({ value, onChange, style = {}, multiline, placeholder }) => {
  const Tag = multiline ? "textarea" : "input";
  return (
    <Tag
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontFamily: F, fontSize: 11, letterSpacing: LS, border: "none", outline: "none",
        background: "transparent", width: "100%", padding: "1px 2px", boxSizing: "border-box",
        lineHeight: LINE_H,
        resize: multiline ? "vertical" : "none",
        ...(multiline ? { minHeight: 36 } : {}),
        ...style,
      }}
    />
  );
};

export { DEFAULT_CV };

// ── Cover Letter default ──
// Items in cvList that hold a cover letter rather than a CV are flagged via
// `data._docType === "coverletter"`. The renderer/print/export branches on
// that flag and lays out the document accordingly.
const DEFAULT_COVER_LETTER = {
  _docType: "coverletter",
  name: "EMILY LUCAS",
  title: "Senior Producer",
  contact: {
    phone: "+1 (917) 735-8545",
    email: "emilyelucas@gmail.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onnaproduction.com",
    location: "Brooklyn, NY (from July 2026)",
    citizenship: "US, UK, Japanese Citizen",
  },
  date: "May 22, 2026",
  recipient: {
    name: "Hiring Team",
    company: "Company Name",
    line1: "",
    line2: "",
  },
  salutation: "Dear Hiring Team,",
  body: "I'm writing to apply for the [Role] at [Company]. [One-line hook tying your experience to their brief].\n\nMost recently, I've been founder of ONNA Production — a studio I launched in 2024 to serve global brands operating across multiple markets. Within the first year, I've delivered campaigns for Nike, Aman, Mastercard, Columbia, and Vogue Arabia (Condé Nast).\n\nPrior to ONNA, I scaled three levels in five years at MR PORTER (Net-a-Porter Group, Richemont) from Picture Assistant to Producer, with US production leadership on flagship campaigns. I led freelance production on the $1M+ Charlotte Tilbury x Disney 100 global activation, and have produced for Louis Vuitton, J.Crew, Maison Kitsuné, and Harvey Nichols.\n\nWhat I bring specifically: deep operational rigor (full P&L, SOWs, talent contracts, vendor agreements, usage rights), an established global vendor network across the UK, GCC, Japan, and US, and production fluency across both brand-side and agency-side environments.\n\nI'd welcome the chance to discuss how my experience can contribute to [Company]'s team.",
  signoff: "Best,",
  signature: "Emily Lucas",
};

export { DEFAULT_COVER_LETTER };

// Single-line skill row. Shows "Header: description" with the header bold in display mode,
// switches to a full-width textarea on click for editing.
const SkillRow = ({ value, onChange, onRemove }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.setSelectionRange(value.length, value.length); } }, [editing]); // eslint-disable-line
  const ci = (value || "").indexOf(":");
  const head = ci >= 0 ? value.slice(0, ci) : "";
  const tail = ci >= 0 ? value.slice(ci + 1).replace(/^\s+/, "") : (value || "");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "5px 0", borderBottom: "1px solid #f0f0f0" }}>
      {editing ? (
        <textarea
          ref={inputRef}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === "Escape") { setEditing(false); } }}
          rows={Math.max(1, Math.ceil((value || "").length / 90))}
          style={{ flex: 1, fontFamily: F, fontSize: 11, letterSpacing: LS, lineHeight: LINE_H, color: "#1a1a1a", border: "none", outline: "none", background: "transparent", padding: "1px 2px", resize: "none", boxSizing: "border-box" }}
        />
      ) : (
        <div onClick={() => setEditing(true)} style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 11, letterSpacing: LS, lineHeight: LINE_H, color: "#1a1a1a", cursor: "text", padding: "1px 2px" }}>
          {head ? (<><strong>{head}:</strong>{tail ? " " + tail : ""}</>) : (value ? value : <span style={{ color: "#bbb" }}>Empty skill — click to edit</span>)}
        </div>
      )}
      <button data-noprint onClick={onRemove} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>×</button>
    </div>
  );
};

// Helpers to make a URL from contact value
const makeHref = (key, val) => {
  if (!val) return null;
  if (key === "email") return `mailto:${val}`;
  if (key === "website") return val.startsWith("http") ? val : `https://${val}`;
  if (key === "linkedin") return val.startsWith("http") ? val : `https://${val}`;
  return null;
};

// ── Multi-CV data helpers ──
function migrateToMulti(cvData) {
  if (cvData && cvData._multi) return cvData;
  const singleCv = cvData || DEFAULT_CV;
  const id = "cv_" + Date.now();
  return {
    _multi: true,
    cvList: [{ id, label: singleCv.title || "Executive Producer", data: singleCv }],
    activeCvId: id,
  };
}

function getActiveCv(store) {
  const item = store.cvList.find(c => c.id === store.activeCvId);
  return item ? item.data : (store.cvList[0]?.data || DEFAULT_CV);
}

function getActiveItem(store) {
  return store.cvList.find(c => c.id === store.activeCvId) || store.cvList[0];
}

export default function CVView({ cvData, onSet, projectName }) {
  // Migrate old single-CV format on first render
  const store = migrateToMulti(cvData);
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!cvData || !cvData._multi) {
      if (!migratedRef.current) {
        migratedRef.current = true;
        onSet(() => migrateToMulti(cvData));
      }
    }
  }, []); // eslint-disable-line

  // One-time migration: replace Founder CV's skills array with the categorised list.
  // Backs the entire CV item up to localStorage first so it can be restored manually if needed.
  const founderMigratedRef = useRef(false);
  useEffect(() => {
    if (founderMigratedRef.current) return;
    if (localStorage.getItem("onna_founder_skills_migrated_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    const founder = cvData.cvList.find(c => (c.label || "").toLowerCase().includes("founder"));
    if (!founder) return;
    founderMigratedRef.current = true;
    try {
      localStorage.setItem("onna_founder_cv_backup_v1", JSON.stringify({ ts: Date.now(), cvItem: founder }));
    } catch (e) { console.warn("Founder CV backup failed, aborting migration:", e); return; }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c =>
          c.id === founder.id ? { ...c, data: { ...(c.data || {}), skills: FOUNDER_SKILLS_V1 } } : c
        ),
      };
    });
    localStorage.setItem("onna_founder_skills_migrated_v1", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Content Producer" CV variant tailored for
  // in-house content production roles (e.g. Chanel Group Director, Content
  // Producer). Skips if a CV with that label already exists.
  const contentProducerAddedRef = useRef(false);
  useEffect(() => {
    if (contentProducerAddedRef.current) return;
    if (localStorage.getItem("onna_content_producer_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    contentProducerAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase().includes("content producer"));
    if (exists) {
      localStorage.setItem("onna_content_producer_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now();
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Content Producer", data: JSON.parse(JSON.stringify(CONTENT_PRODUCER_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_content_producer_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time refresh of the "Content Producer" CV to v2 — adds JA Resort case
  // study, Aman portfolio detail (VP Brand, Christopher Anderson, Mark Mahaney),
  // Vogue Arabia talent (Imaan Hammam, Halima Aden, Balquees), corrected MR
  // PORTER promotions count and US cities. Backs up prior data before overwrite.
  const contentProducerV2Ref = useRef(false);
  useEffect(() => {
    if (contentProducerV2Ref.current) return;
    if (localStorage.getItem("onna_content_producer_cv_v2_migrated")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    const target = cvData.cvList.find(c => (c.label || "").toLowerCase().includes("content producer"));
    if (!target) return;
    contentProducerV2Ref.current = true;
    try {
      localStorage.setItem("onna_content_producer_cv_v1_backup", JSON.stringify({ ts: Date.now(), cvItem: target }));
    } catch (e) { console.warn("Content Producer v1 backup failed, aborting v2 migration:", e); return; }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c =>
          c.id === target.id ? { ...c, data: JSON.parse(JSON.stringify(CONTENT_PRODUCER_CV_V1)) } : c
        ),
      };
    });
    localStorage.setItem("onna_content_producer_cv_v2_migrated", String(Date.now()));
  }, [cvData]);

  // One-time: add line-management bullet to every CV's MR PORTER / Net-a-Porter
  // experience entry. Skips entries that already mention line management.
  const addMrPorterLineMgmtRef = useRef(false);
  useEffect(() => {
    if (addMrPorterLineMgmtRef.current) return;
    if (localStorage.getItem("onna_mrporter_line_mgmt_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    addMrPorterLineMgmtRef.current = true;
    const LINE_MGMT_BULLET = "Line Management: Directly managed and developed a Production Assistant, owning her work allocation, performance feedback, and career growth across the team's high-volume shoot calendar.";
    const matchesCompany = (co) => {
      const c = (co || "").toLowerCase();
      return c.includes("mr porter") || c.includes("net-a-porter");
    };
    const hasLineMgmt = (bullets) => (bullets || []).some(b => /line\s*manag/i.test(b || ""));
    const anyToUpdate = cvData.cvList.some(c =>
      Array.isArray(c.data?.experience) && c.data.experience.some(e => matchesCompany(e.company) && !hasLineMgmt(e.bullets))
    );
    if (!anyToUpdate) {
      localStorage.setItem("onna_mrporter_line_mgmt_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c => ({
          ...c,
          data: {
            ...(c.data || {}),
            experience: (c.data?.experience || []).map(e => {
              if (!matchesCompany(e.company)) return e;
              if (hasLineMgmt(e.bullets)) return e;
              // Insert line management bullet after the first bullet (career trajectory),
              // before the substantive campaign bullets.
              const bullets = Array.isArray(e.bullets) ? [...e.bullets] : [];
              const insertAt = bullets.length > 0 ? 1 : 0;
              bullets.splice(insertAt, 0, LINE_MGMT_BULLET);
              return { ...e, bullets };
            }),
          },
        })),
      };
    });
    localStorage.setItem("onna_mrporter_line_mgmt_v1", String(Date.now()));
  }, [cvData]);

  // One-time: clear bullets from junior-progression role entries
  // (Picture Assistant, Social Media Production Coordinator) across all CVs.
  // Backs up prior experience arrays before clearing.
  const clearJuniorBulletsRef = useRef(false);
  useEffect(() => {
    if (clearJuniorBulletsRef.current) return;
    if (localStorage.getItem("onna_clear_junior_bullets_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    clearJuniorBulletsRef.current = true;
    const matches = (role) => {
      const r = (role || "").toLowerCase();
      return r.includes("picture assistant") || r.includes("social media production coordinator");
    };
    const anyToClear = cvData.cvList.some(c =>
      Array.isArray(c.data?.experience) && c.data.experience.some(e => matches(e.role) && (e.bullets || []).length > 0)
    );
    if (!anyToClear) {
      localStorage.setItem("onna_clear_junior_bullets_v1", String(Date.now()));
      return;
    }
    try {
      localStorage.setItem("onna_clear_junior_bullets_v1_backup", JSON.stringify({
        ts: Date.now(),
        cvList: cvData.cvList.map(c => ({ id: c.id, label: c.label, experience: c.data?.experience })),
      }));
    } catch (e) { console.warn("Junior bullets backup failed, aborting migration:", e); return; }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c => ({
          ...c,
          data: {
            ...(c.data || {}),
            experience: (c.data?.experience || []).map(e =>
              matches(e.role) ? { ...e, bullets: [] } : e
            ),
          },
        })),
      };
    });
    localStorage.setItem("onna_clear_junior_bullets_v1", String(Date.now()));
  }, [cvData]);

  // v3: add volunteer entry (Graduate Fashion Foundation mentorship) to the
  // Content Producer CV. Only fills if no volunteer data already present, so
  // user edits in the volunteer section are preserved.
  const contentProducerV3Ref = useRef(false);
  useEffect(() => {
    if (contentProducerV3Ref.current) return;
    if (localStorage.getItem("onna_content_producer_cv_v3_migrated")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    const target = cvData.cvList.find(c => (c.label || "").toLowerCase().includes("content producer"));
    if (!target) return;
    contentProducerV3Ref.current = true;
    const existingVol = (target.data && Array.isArray(target.data.volunteer)) ? target.data.volunteer : null;
    if (existingVol && existingVol.length > 0) {
      localStorage.setItem("onna_content_producer_cv_v3_migrated", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c =>
          c.id === target.id
            ? { ...c, data: { ...(c.data || {}), volunteer: JSON.parse(JSON.stringify(CONTENT_PRODUCER_CV_V1.volunteer)) } }
            : c
        ),
      };
    });
    localStorage.setItem("onna_content_producer_cv_v3_migrated", String(Date.now()));
  }, [cvData]);

  // v2 refresh: re-apply the latest Strategy & Ops constant to the existing
  // Strategy & Ops CV — adds Editor-in-Chief into stakeholder lists, updates
  // line management bullet wording to mention contract / day-to-day. Backs up
  // prior data before overwrite.
  const strategyOpsV2Ref = useRef(false);
  useEffect(() => {
    if (strategyOpsV2Ref.current) return;
    if (localStorage.getItem("onna_strategy_ops_cv_v2_migrated")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    const target = cvData.cvList.find(c => (c.label || "").toLowerCase().includes("strategy & ops"));
    if (!target) return;
    strategyOpsV2Ref.current = true;
    try {
      localStorage.setItem("onna_strategy_ops_cv_v1_backup", JSON.stringify({ ts: Date.now(), cvItem: target }));
    } catch (e) { console.warn("Strategy & Ops v1 backup failed, aborting v2 migration:", e); return; }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c =>
          c.id === target.id ? { ...c, data: JSON.parse(JSON.stringify(STRATEGY_OPS_CV_V1)) } : c
        ),
      };
    });
    localStorage.setItem("onna_strategy_ops_cv_v2_migrated", String(Date.now()));
  }, [cvData]);

  // One-time: refresh the line management bullet wording across every CV's
  // MR PORTER / Net-a-Porter entry to credit "contracted Production Assistant"
  // and "day-to-day management". Replaces any bullet whose text begins with
  // "Line Management:".
  const lineMgmtV2Ref = useRef(false);
  useEffect(() => {
    if (lineMgmtV2Ref.current) return;
    if (localStorage.getItem("onna_mrporter_line_mgmt_v2")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    lineMgmtV2Ref.current = true;
    const NEW_BULLET = "Line Management: Day-to-day management and development of a contracted Production Assistant — owned work allocation, performance feedback, and career growth across the team's high-volume shoot calendar.";
    const matchesCompany = (co) => {
      const c = (co || "").toLowerCase();
      return c.includes("mr porter") || c.includes("net-a-porter");
    };
    const isLineMgmtBullet = (b) => /^\s*line\s*management\s*:/i.test(b || "");
    const anyToUpdate = cvData.cvList.some(c =>
      Array.isArray(c.data?.experience) && c.data.experience.some(e =>
        matchesCompany(e.company) && (e.bullets || []).some(b => isLineMgmtBullet(b) && b !== NEW_BULLET)
      )
    );
    if (!anyToUpdate) {
      localStorage.setItem("onna_mrporter_line_mgmt_v2", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c => ({
          ...c,
          data: {
            ...(c.data || {}),
            experience: (c.data?.experience || []).map(e => {
              if (!matchesCompany(e.company)) return e;
              const bullets = (e.bullets || []).map(b => isLineMgmtBullet(b) ? NEW_BULLET : b);
              return { ...e, bullets };
            }),
          },
        })),
      };
    });
    localStorage.setItem("onna_mrporter_line_mgmt_v2", String(Date.now()));
  }, [cvData]);

  // Retry: the v1 add lost a race with concurrent migrations because the
  // parent onSet used a stale closure. With the parent now using a composable
  // functional setter, retry the Visuals Editor add once under a new flag.
  const visualsEditorRetryRef = useRef(false);
  useEffect(() => {
    if (visualsEditorRetryRef.current) return;
    if (localStorage.getItem("onna_visuals_editor_cv_added_v2")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    visualsEditorRetryRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase() === "visuals editor");
    if (exists) {
      localStorage.setItem("onna_visuals_editor_cv_added_v2", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now() + "_ve";
    onSet(prev => {
      const s = migrateToMulti(prev);
      if (s.cvList.some(c => (c.label || "").toLowerCase() === "visuals editor")) return s;
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Visuals Editor", data: JSON.parse(JSON.stringify(VISUALS_EDITOR_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_visuals_editor_cv_added_v2", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Creative Producer" CV variant tailored for
  // brand/creative agency Producer roles (e.g. Day Job Creative Producer).
  const creativeProducerAddedRef = useRef(false);
  useEffect(() => {
    if (creativeProducerAddedRef.current) return;
    if (localStorage.getItem("onna_creative_producer_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    creativeProducerAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase() === "creative producer");
    if (exists) {
      localStorage.setItem("onna_creative_producer_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now() + "_cp";
    onSet(prev => {
      const s = migrateToMulti(prev);
      if (s.cvList.some(c => (c.label || "").toLowerCase() === "creative producer")) return s;
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Creative Producer", data: JSON.parse(JSON.stringify(CREATIVE_PRODUCER_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_creative_producer_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Visuals Editor" CV variant tailored for
  // editorial Visuals Editor roles, especially at Condé Nast titles
  // (e.g. Vanity Fair freelance Visuals Editor).
  const visualsEditorAddedRef = useRef(false);
  useEffect(() => {
    if (visualsEditorAddedRef.current) return;
    if (localStorage.getItem("onna_visuals_editor_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    visualsEditorAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase().includes("visuals editor"));
    if (exists) {
      localStorage.setItem("onna_visuals_editor_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now();
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Visuals Editor", data: JSON.parse(JSON.stringify(VISUALS_EDITOR_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_visuals_editor_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Head of Production" CV variant tailored for
  // AVP / Head of Production-level in-house roles in luxury retail
  // (e.g. Saks Global AVP Creative Production).
  const headOfProductionAddedRef = useRef(false);
  useEffect(() => {
    if (headOfProductionAddedRef.current) return;
    if (localStorage.getItem("onna_head_of_production_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    headOfProductionAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase().includes("head of production"));
    if (exists) {
      localStorage.setItem("onna_head_of_production_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now();
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Head of Production", data: JSON.parse(JSON.stringify(HEAD_OF_PRODUCTION_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_head_of_production_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Strategy & Ops" CV variant tailored for
  // in-house strategic operations / chief-of-staff-to-CBO roles
  // (e.g. The RealReal Senior Director, Creative Strategy).
  const strategyOpsAddedRef = useRef(false);
  useEffect(() => {
    if (strategyOpsAddedRef.current) return;
    if (localStorage.getItem("onna_strategy_ops_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    strategyOpsAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase().includes("strategy & ops"));
    if (exists) {
      localStorage.setItem("onna_strategy_ops_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now();
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Strategy & Ops", data: JSON.parse(JSON.stringify(STRATEGY_OPS_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_strategy_ops_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time addition: seed a "Creative Strategy" CV variant tailored for
  // creative-strategy / PR-comms agency roles (e.g. Karla Otto). Skips if a CV
  // with that label already exists, so deleting the tab won't re-add it.
  const creativeStrategyAddedRef = useRef(false);
  useEffect(() => {
    if (creativeStrategyAddedRef.current) return;
    if (localStorage.getItem("onna_creative_strategy_cv_added_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    creativeStrategyAddedRef.current = true;
    const exists = cvData.cvList.some(c => (c.label || "").toLowerCase().includes("creative strategy"));
    if (exists) {
      localStorage.setItem("onna_creative_strategy_cv_added_v1", String(Date.now()));
      return;
    }
    try { flushAllSaves(); } catch {}
    const id = "cv_" + Date.now();
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: [...s.cvList, { id, label: "Creative Strategy", data: JSON.parse(JSON.stringify(CREATIVE_STRATEGY_CV_V1)) }],
      };
    });
    localStorage.setItem("onna_creative_strategy_cv_added_v1", String(Date.now()));
  }, [cvData]);

  // One-time migration: set Founder CV's clients string. Backs up the prior value first.
  const founderClientsMigratedRef = useRef(false);
  useEffect(() => {
    if (founderClientsMigratedRef.current) return;
    if (localStorage.getItem("onna_founder_clients_migrated_v1")) return;
    if (!cvData || !cvData._multi || !Array.isArray(cvData.cvList)) return;
    const founder = cvData.cvList.find(c => (c.label || "").toLowerCase().includes("founder"));
    if (!founder) return;
    founderClientsMigratedRef.current = true;
    try {
      localStorage.setItem("onna_founder_clients_backup_v1", JSON.stringify({ ts: Date.now(), clients: founder.data?.clients ?? null }));
    } catch (e) { console.warn("Founder clients backup failed, aborting migration:", e); return; }
    try { flushAllSaves(); } catch {}
    onSet(prev => {
      const s = migrateToMulti(prev);
      return {
        ...s,
        cvList: s.cvList.map(c =>
          c.id === founder.id ? { ...c, data: { ...(c.data || {}), clients: FOUNDER_CLIENTS_V1 } } : c
        ),
      };
    });
    localStorage.setItem("onna_founder_clients_migrated_v1", String(Date.now()));
  }, [cvData]);

  const cv = getActiveCv(store);
  const activeItem = getActiveItem(store);
  const printRef = useRef(null);

  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef(null);

  // Update the active CV's data within the multi-CV store
  const setCvData = (updater) => {
    onSet(prev => {
      const s = migrateToMulti(prev);
      const next = { ...s, cvList: s.cvList.map(c => {
        if (c.id !== s.activeCvId) return c;
        const oldData = c.data || DEFAULT_CV;
        const newData = typeof updater === "function" ? updater(oldData) : updater;
        return { ...c, data: newData };
      })};
      return next;
    });
  };

  // Update store-level props (activeCvId, cvList)
  const setStore = (updater) => {
    onSet(prev => {
      const s = migrateToMulti(prev);
      return typeof updater === "function" ? updater(s) : updater;
    });
  };

  const set = (path, val) => {
    setCvData(prev => {
      const next = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = isNaN(keys[i + 1]) ? {} : [];
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const addExperience = () => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience = [...(n.experience || []), { role: "", company: "", dates: "", bullets: [""] }]; return n; }); };
  const removeExperience = (i) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience.splice(i, 1); return n; }); };
  const addBullet = (ei) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience[ei].bullets.push(""); return n; }); };
  const removeBullet = (ei, bi) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); if (n.experience[ei].bullets.length > 1) n.experience[ei].bullets.splice(bi, 1); return n; }); };
  const addEducation = () => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.education = [...(n.education || []), { title: "", institution: "", result: "" }]; return n; }); };
  const removeEducation = (i) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.education.splice(i, 1); return n; }); };
  const addSkill = () => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.skills = [...(n.skills || []).map(s => typeof s === "string" ? s : s.name || ""), ""]; return n; }); };
  const removeSkill = (i) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.skills.splice(i, 1); return n; }); };
  const addLanguage = () => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.languages = [...(n.languages || []), { name: "", level: "" }]; return n; }); };
  const removeLanguage = (i) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.languages.splice(i, 1); return n; }); };
  const addVolunteer = () => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.volunteer = [...(n.volunteer || []), { role: "", organization: "", dates: "", description: "" }]; return n; }); };
  const removeVolunteer = (i) => { setCvData(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.volunteer.splice(i, 1); return n; }); };

  // Move experience up/down
  const moveExperience = (from, to) => {
    if (to < 0 || to >= (cv.experience || []).length) return;
    setCvData(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const [moved] = n.experience.splice(from, 1);
      n.experience.splice(to, 0, moved);
      return n;
    });
  };

  // Move bullet up/down
  const moveBullet = (ei, from, to) => {
    setCvData(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const bullets = n.experience[ei].bullets;
      if (to < 0 || to >= bullets.length) return n;
      const [moved] = bullets.splice(from, 1);
      bullets.splice(to, 0, moved);
      return n;
    });
  };

  // ── Multi-CV actions ──
  const addNewCv = () => {
    const label = prompt("CV name (e.g. Production Director, EP):");
    if (!label) return;
    const id = "cv_" + Date.now();
    const newCvData = JSON.parse(JSON.stringify(DEFAULT_CV));
    newCvData.title = label;
    setStore(s => ({
      ...s,
      cvList: [...s.cvList, { id, label, data: newCvData }],
      activeCvId: id,
    }));
  };

  const duplicateCv = () => {
    const label = prompt("Name for the duplicate:", (activeItem?.label || "CV") + " (Copy)");
    if (!label) return;
    const id = "cv_" + Date.now();
    const dupeData = JSON.parse(JSON.stringify(cv));
    dupeData.title = label;
    setStore(s => ({
      ...s,
      cvList: [...s.cvList, { id, label, data: dupeData }],
      activeCvId: id,
    }));
  };

  // ── Cover Letter actions ──
  const addNewCoverLetter = () => {
    const label = prompt("Cover letter name (e.g. Lululemon, VF, Unsplash):");
    if (!label) return;
    const id = "cv_" + Date.now();
    const newData = JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER));
    setStore(s => ({
      ...s,
      cvList: [...s.cvList, { id, label: `Cover · ${label}`, data: newData }],
      activeCvId: id,
    }));
  };

  const addBodyParagraph = () => {
    setCvData(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_COVER_LETTER));
      n.body = [...(n.body || []), ""];
      return n;
    });
  };

  const removeBodyParagraph = (i) => {
    setCvData(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_COVER_LETTER));
      if ((n.body || []).length > 1) n.body.splice(i, 1);
      return n;
    });
  };

  const moveBodyParagraph = (from, to) => {
    if (to < 0 || to >= (cv.body || []).length) return;
    setCvData(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_COVER_LETTER));
      const [moved] = n.body.splice(from, 1);
      n.body.splice(to, 0, moved);
      return n;
    });
  };

  // True when the active tab holds a cover letter, not a CV.
  const isCoverLetter = cv?._docType === "coverletter";

  const deleteCv = (cvId) => {
    const item = store.cvList.find(c => c.id === cvId);
    if (store.cvList.length <= 1) { alert("You must have at least one CV."); return; }
    if (!window.confirm(`Delete "${item?.label || "CV"}"?`)) return;
    setStore(s => {
      const newList = s.cvList.filter(c => c.id !== cvId);
      return {
        ...s,
        cvList: newList,
        activeCvId: s.activeCvId === cvId ? newList[0].id : s.activeCvId,
      };
    });
  };

  const startRename = (cvId) => {
    const item = store.cvList.find(c => c.id === cvId);
    setRenamingId(cvId);
    setRenameVal(item?.label || "");
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  const commitRename = () => {
    if (!renamingId || !renameVal.trim()) { setRenamingId(null); return; }
    setStore(s => ({
      ...s,
      cvList: s.cvList.map(c => c.id === renamingId ? { ...c, label: renameVal.trim() } : c),
    }));
    setRenamingId(null);
  };

  const switchCv = (cvId) => {
    if (renamingId) return;
    setStore(s => ({ ...s, activeCvId: cvId }));
  };

  // Drag state for experience reorder
  const dragRef = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);
  // Drag state for bullet reorder
  const bulletDragRef = useRef(null);
  const [bulletDropTarget, setBulletDropTarget] = useState(null);

  // Build clean HTML for print
  const doPrint = () => {
    const c = cv;
    const ct = c.contact || {};
    const S = `font-size:11px;line-height:${LINE_H};color:#1a1a1a;`;

    let html = `<div style="font-family:'Avenir','Nunito Sans',sans-serif;color:#1a1a1a;font-size:11px;line-height:${LINE_H};">`;

    // Header — name + title
    html += `<div style="margin-bottom:10px;">`;
    html += `<div style="font-size:30px;font-weight:700;letter-spacing:2px;text-transform:uppercase;line-height:1.15;color:#1a1a1a;">${esc(c.name)}</div>`;
    html += `<div style="font-size:14px;color:#1a1a1a;letter-spacing:0.3px;margin-top:3px;line-height:${LINE_H};">${esc(c.title)}</div>`;
    html += `</div>`;

    // Contact — centred, horizontal with links
    const dot = ' <span style="color:#ccc;padding:0 6px;">\u2022</span> ';
    const contactParts = [];
    if (ct.phone) contactParts.push(`<a href="tel:${esc(ct.phone.replace(/\s/g,''))}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.phone)}</a>`);
    if (ct.email) contactParts.push(`<a href="mailto:${esc(ct.email)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.email)}</a>`);
    if (ct.linkedin) { const url = ct.linkedin.startsWith("http") ? ct.linkedin : `https://${ct.linkedin}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.linkedin)}</a>`); }
    if (ct.website) { const url = ct.website.startsWith("http") ? ct.website : `https://${ct.website}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.website)}</a>`); }
    if (contactParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${contactParts.join(dot)}</div>`;
    }
    const locationParts = [];
    if (ct.location) locationParts.push(esc(ct.location));
    if (ct.citizenship) locationParts.push(esc(ct.citizenship));
    if (ct.markets) locationParts.push(esc(ct.markets));
    if (locationParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${locationParts.join(dot)}</div>`;
    }

    // Thick rule
    html += `<div style="border-bottom:2.5px solid #000;margin:8px 0 4px 0;"></div>`;

    // Summary
    html += secHdr("SUMMARY");
    (c.summary || []).forEach(p => { html += `<div style="${S}margin-bottom:6px;">${esc(p)}</div>`; });
    if (c.clients) html += `<div style="font-size:9.5px;font-weight:700;letter-spacing:0.4px;color:#1a1a1a;line-height:${LINE_H};margin-top:4px;text-align:center;">${esc(c.clients)}</div>`;

    // Experience
    html += secHdr("EXPERIENCE");
    (c.experience || []).forEach(exp => {
      html += `<div style="margin-bottom:14px;">`;
      html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
      html += `<td style="padding:0;font-size:12px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};">${esc(exp.company)} <span style="font-weight:400;color:#bbb;padding:0 3px;">|</span> ${esc(exp.role)}</td>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;text-align:right;white-space:nowrap;line-height:${LINE_H};">${esc(exp.dates)}</td>`;
      html += `</tr></table>`;
      html += `<div style="border-bottom:1px solid #eee;margin:2px 0 5px 0;"></div>`;
      html += `<ul style="margin:0;padding-left:18px;list-style:disc;">`;
      (exp.bullets || []).forEach(b => {
        html += `<li style="${S}margin-bottom:2px;">${esc(b)}</li>`;
      });
      html += `</ul></div>`;
    });

    // Education
    html += secHdr("EDUCATION");
    (c.education || []).forEach(edu => {
      html += `<div style="margin-bottom:8px;">`;
      html += `<div style="font-size:12px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};">${esc(edu.title)}</div>`;
      html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;line-height:${LINE_H};">${esc(edu.institution)}</td>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;text-align:right;line-height:${LINE_H};">${esc(edu.result)}</td>`;
      html += `</tr></table></div>`;
    });

    // Skills — single-column rows, bold the header before the first colon
    html += secHdr("SKILLS");
    const skillNames = (c.skills || []).map(s => typeof s === "string" ? s : s.name || "").filter(Boolean);
    skillNames.forEach(name => {
      const ci = name.indexOf(":");
      const inner = ci >= 0
        ? `<strong>${esc(name.slice(0, ci))}:</strong>${esc(name.slice(ci + 1))}`
        : esc(name);
      html += `<div style="${S}padding:5px 0;border-bottom:1px solid #f0f0f0;">${inner}</div>`;
    });

    // Languages
    html += secHdr("LANGUAGES");
    html += `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">`;
    const langRows = Math.ceil((c.languages || []).length / 2);
    for (let r = 0; r < langRows; r++) {
      html += `<tr>`;
      for (let col = 0; col < 2; col++) {
        const l = (c.languages || [])[r * 2 + col];
        if (!l) { html += `<td style="padding:5px 0;"></td>`; continue; }
        html += `<td style="padding:5px ${col === 0 ? '12px' : '0'} 5px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;">`;
        html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
        html += `<td style="padding:0;font-size:11px;color:#1a1a1a;line-height:${LINE_H};">${esc(l.name)}</td>`;
        html += `<td style="padding:0;text-align:right;width:88px;">${badgeHtml(l.level)}</td>`;
        html += `</tr></table></td>`;
      }
      html += `</tr>`;
    }
    html += `</table>`;

    // Volunteer & Industry Engagement
    if ((c.volunteer || []).length > 0) {
      html += secHdr("VOLUNTEER &amp; INDUSTRY ENGAGEMENT");
      (c.volunteer || []).forEach(vol => {
        html += `<div style="margin-bottom:8px;">`;
        html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
        html += `<td style="padding:0;font-size:12px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};">${esc(vol.role)} <span style="font-weight:400;color:#bbb;padding:0 3px;">|</span> ${esc(vol.organization)}</td>`;
        html += `<td style="padding:0;font-size:11px;color:#1a1a1a;text-align:right;white-space:nowrap;line-height:${LINE_H};">${esc(vol.dates)}</td>`;
        html += `</tr></table>`;
        html += `<div style="border-bottom:1px solid #eee;margin:2px 0 5px 0;"></div>`;
        if (vol.description) html += `<div style="${S}padding-left:18px;">${esc(vol.description)}</div>`;
        html += `</div>`;
      });
    }

    html += `</div>`;

    const docTitle = `CV - ${c.name || "CV"}${activeItem ? " - " + activeItem.label : ""}${projectName ? " | " + projectName : ""}`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const _d = iframe.contentDocument;
    _d.open();
    _d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:11px;color:#1a1a1a;padding:0 12mm;}a{color:#1a1a1a;text-decoration:none;}@media print{@page{margin:10mm 0;size:A4;}}</style></head><body>${html}</body></html>`);
    _d.close();
    const prevTitle = document.title;
    document.title = docTitle;
    const restoreTitle = () => { document.title = prevTitle; document.body.removeChild(iframe); window.removeEventListener("afterprint", restoreTitle); };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 250);
  };

  // Build ATS-friendly Word doc: plain structure, no tables for layout,
  // standard section headers, skills threaded into bullets. Saved as .doc
  // (HTML-with-application/msword MIME) which Word opens cleanly and ATS
  // parsers process more reliably than PDF.
  const doExportWord = () => {
    const c = cv;
    const ct = c.contact || {};
    const P = `font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000; margin:0 0 6pt 0;`;
    let html = `<div style="font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000;">`;

    // Contact block first (per ATS guidance)
    html += `<p style="${P} font-size:18pt; font-weight:bold; margin-bottom:2pt;">${esc(c.name || "")}</p>`;
    html += `<p style="${P} font-size:12pt; margin-bottom:6pt;">${esc(c.title || "")}</p>`;
    const contactLines = [];
    if (ct.phone) contactLines.push(esc(ct.phone));
    if (ct.email) contactLines.push(esc(ct.email));
    if (ct.linkedin) contactLines.push(esc(ct.linkedin));
    if (ct.website) contactLines.push(esc(ct.website));
    if (contactLines.length) html += `<p style="${P}">${contactLines.join(" | ")}</p>`;
    const locLines = [];
    if (ct.location) locLines.push(esc(ct.location));
    if (ct.citizenship) locLines.push(esc(ct.citizenship));
    if (ct.markets) locLines.push(esc(ct.markets));
    if (locLines.length) html += `<p style="${P}">${locLines.join(" | ")}</p>`;

    const hdr = (label) => `<h2 style="font-family:Calibri, Arial, sans-serif; font-size:13pt; font-weight:bold; color:#000; margin:14pt 0 6pt 0; text-transform:uppercase;">${label}</h2>`;

    // Summary
    html += hdr("Summary");
    (c.summary || []).forEach(p => { html += `<p style="${P}">${esc(p)}</p>`; });
    if (c.clients) html += `<p style="${P} font-weight:bold;">Select Clients: ${esc(c.clients)}</p>`;

    // Experience — plain headings, no table layout
    html += hdr("Experience");
    (c.experience || []).forEach(exp => {
      html += `<p style="${P} font-weight:bold; margin-top:8pt; margin-bottom:0;">${esc(exp.role || "")} — ${esc(exp.company || "")}</p>`;
      html += `<p style="${P} font-style:italic; margin-bottom:4pt;">${esc(exp.dates || "")}</p>`;
      html += `<ul style="margin:0 0 6pt 0; padding-left:24pt;">`;
      (exp.bullets || []).forEach(b => {
        html += `<li style="${P} margin-bottom:3pt;">${esc(b)}</li>`;
      });
      html += `</ul>`;
    });

    // Education
    html += hdr("Education");
    (c.education || []).forEach(edu => {
      html += `<p style="${P} font-weight:bold; margin-bottom:0;">${esc(edu.title || "")}</p>`;
      const ei = [];
      if (edu.institution) ei.push(esc(edu.institution));
      if (edu.result) ei.push(esc(edu.result));
      if (ei.length) html += `<p style="${P}">${ei.join(" — ")}</p>`;
    });

    // Skills
    html += hdr("Skills");
    html += `<ul style="margin:0; padding-left:24pt;">`;
    (c.skills || []).map(s => typeof s === "string" ? s : s.name || "").filter(Boolean).forEach(name => {
      const ci = name.indexOf(":");
      const inner = ci >= 0
        ? `<strong>${esc(name.slice(0, ci))}:</strong>${esc(name.slice(ci + 1))}`
        : esc(name);
      html += `<li style="${P} margin-bottom:3pt;">${inner}</li>`;
    });
    html += `</ul>`;

    // Languages
    html += hdr("Languages");
    html += `<ul style="margin:0; padding-left:24pt;">`;
    (c.languages || []).forEach(l => {
      html += `<li style="${P} margin-bottom:3pt;">${esc(l.name || "")} — ${esc(l.level || "")}</li>`;
    });
    html += `</ul>`;

    // Volunteer & Industry Engagement
    if ((c.volunteer || []).length > 0) {
      html += hdr("Volunteer &amp; Industry Engagement");
      (c.volunteer || []).forEach(vol => {
        const head = [esc(vol.role || ""), esc(vol.organization || "")].filter(Boolean).join(" — ");
        html += `<p style="${P} font-weight:bold; margin-top:8pt; margin-bottom:0;">${head}</p>`;
        if (vol.dates) html += `<p style="${P} font-style:italic; margin-bottom:4pt;">${esc(vol.dates)}</p>`;
        if (vol.description) html += `<p style="${P}">${esc(vol.description)}</p>`;
      });
    }

    html += `</div>`;

    const docTitle = `CV - ${c.name || "CV"}${activeItem ? " - " + activeItem.label : ""}`;
    const wordHtml = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><title>${esc(docTitle)}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>body{font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000;}</style></head><body>${html}</body></html>`;
    const blob = new Blob(["﻿", wordHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[\\/:*?"<>|]/g, "-")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Print a cover letter to PDF. Same iframe + window.print approach as doPrint,
  // but renders letter layout (date, recipient, salutation, body, sign-off)
  // instead of CV sections. Shares the header + contact bar markup so the
  // visual identity matches CV exports.
  const doPrintCoverLetter = () => {
    const c = cv;
    const ct = c.contact || {};
    const r = c.recipient || {};
    const S = `font-size:11px;line-height:${LINE_H};color:#1a1a1a;`;

    let html = `<div style="font-family:'Avenir','Nunito Sans',sans-serif;color:#1a1a1a;font-size:11px;line-height:${LINE_H};">`;

    // Header — name + title
    html += `<div style="margin-bottom:10px;">`;
    html += `<div style="font-size:30px;font-weight:700;letter-spacing:2px;text-transform:uppercase;line-height:1.15;color:#1a1a1a;">${esc(c.name)}</div>`;
    html += `<div style="font-size:14px;color:#1a1a1a;letter-spacing:0.3px;margin-top:3px;line-height:${LINE_H};">${esc(c.title)}</div>`;
    html += `</div>`;

    // Contact bar
    const dot = ' <span style="color:#ccc;padding:0 6px;">•</span> ';
    const contactParts = [];
    if (ct.phone) contactParts.push(`<a href="tel:${esc(ct.phone.replace(/\s/g,''))}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.phone)}</a>`);
    if (ct.email) contactParts.push(`<a href="mailto:${esc(ct.email)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.email)}</a>`);
    if (ct.linkedin) { const url = ct.linkedin.startsWith("http") ? ct.linkedin : `https://${ct.linkedin}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.linkedin)}</a>`); }
    if (ct.website) { const url = ct.website.startsWith("http") ? ct.website : `https://${ct.website}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.website)}</a>`); }
    if (contactParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${contactParts.join(dot)}</div>`;
    }
    const locationParts = [];
    if (ct.location) locationParts.push(esc(ct.location));
    if (ct.citizenship) locationParts.push(esc(ct.citizenship));
    if (locationParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${locationParts.join(dot)}</div>`;
    }

    // Thick rule
    html += `<div style="border-bottom:2.5px solid #000;margin:8px 0 20px 0;"></div>`;

    // Date — right-aligned
    if (c.date) html += `<div style="${S}text-align:right;margin-bottom:18px;">${esc(c.date)}</div>`;

    // Recipient block
    const recipLines = [];
    if (r.name) recipLines.push(esc(r.name));
    if (r.company) recipLines.push(esc(r.company));
    if (r.line1) recipLines.push(esc(r.line1));
    if (r.line2) recipLines.push(esc(r.line2));
    if (recipLines.length > 0) {
      html += `<div style="${S}margin-bottom:18px;">${recipLines.map((l, i) => `<div style="${i === 0 ? 'font-weight:700;' : ''}">${l}</div>`).join("")}</div>`;
    }

    // Salutation
    if (c.salutation) html += `<div style="${S}margin-bottom:14px;">${esc(c.salutation)}</div>`;

    // Body — single block, split on blank lines for paragraph breaks
    const bodyText = typeof c.body === "string" ? c.body : (c.body || []).join("\n\n");
    bodyText.split(/\n\s*\n/).forEach(para => {
      const trimmed = para.trim();
      if (trimmed) html += `<div style="${S}margin-bottom:12px;white-space:pre-line;">${esc(trimmed)}</div>`;
    });

    // Sign-off + signature
    if (c.signoff) html += `<div style="${S}margin-top:18px;">${esc(c.signoff)}</div>`;
    if (c.signature) html += `<div style="${S}margin-top:2px;font-weight:700;">${esc(c.signature)}</div>`;

    html += `</div>`;

    const docTitle = `Cover Letter - ${c.name || "Cover Letter"}${activeItem ? " - " + activeItem.label : ""}${projectName ? " | " + projectName : ""}`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const _d = iframe.contentDocument;
    _d.open();
    _d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:11px;color:#1a1a1a;padding:0 12mm;}a{color:#1a1a1a;text-decoration:none;}@media print{@page{margin:10mm 0;size:A4;}}</style></head><body>${html}</body></html>`);
    _d.close();
    const prevTitle = document.title;
    document.title = docTitle;
    const restoreTitle = () => { document.title = prevTitle; document.body.removeChild(iframe); window.removeEventListener("afterprint", restoreTitle); };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 250);
  };

  // ATS-friendly Word export for cover letters. Plain paragraphs, no fancy layout.
  const doExportWordCoverLetter = () => {
    const c = cv;
    const ct = c.contact || {};
    const r = c.recipient || {};
    const P = `font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000; margin:0 0 6pt 0;`;
    let html = `<div style="font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000;">`;

    // Header
    html += `<p style="${P} font-size:18pt; font-weight:bold; margin-bottom:2pt;">${esc(c.name || "")}</p>`;
    html += `<p style="${P} font-size:12pt; margin-bottom:6pt;">${esc(c.title || "")}</p>`;
    const contactLines = [];
    if (ct.phone) contactLines.push(esc(ct.phone));
    if (ct.email) contactLines.push(esc(ct.email));
    if (ct.linkedin) contactLines.push(esc(ct.linkedin));
    if (ct.website) contactLines.push(esc(ct.website));
    if (contactLines.length) html += `<p style="${P}">${contactLines.join(" | ")}</p>`;
    const locLines = [];
    if (ct.location) locLines.push(esc(ct.location));
    if (ct.citizenship) locLines.push(esc(ct.citizenship));
    if (locLines.length) html += `<p style="${P} margin-bottom:14pt;">${locLines.join(" | ")}</p>`;

    if (c.date) html += `<p style="${P} margin-bottom:14pt;">${esc(c.date)}</p>`;
    if (r.name) html += `<p style="${P} font-weight:bold; margin-bottom:0;">${esc(r.name)}</p>`;
    if (r.company) html += `<p style="${P} margin-bottom:0;">${esc(r.company)}</p>`;
    if (r.line1) html += `<p style="${P} margin-bottom:0;">${esc(r.line1)}</p>`;
    if (r.line2) html += `<p style="${P} margin-bottom:14pt;">${esc(r.line2)}</p>`;
    else if (r.name || r.company) html += `<p style="${P} margin-bottom:14pt;"></p>`;

    if (c.salutation) html += `<p style="${P} margin-bottom:12pt;">${esc(c.salutation)}</p>`;
    const bodyTextW = typeof c.body === "string" ? c.body : (c.body || []).join("\n\n");
    bodyTextW.split(/\n\s*\n/).forEach(para => {
      const trimmed = para.trim();
      if (trimmed) html += `<p style="${P} margin-bottom:12pt;">${esc(trimmed)}</p>`;
    });
    if (c.signoff) html += `<p style="${P} margin-top:14pt; margin-bottom:0;">${esc(c.signoff)}</p>`;
    if (c.signature) html += `<p style="${P} font-weight:bold;">${esc(c.signature)}</p>`;

    html += `</div>`;

    const docTitle = `Cover Letter - ${c.name || "Cover Letter"}${activeItem ? " - " + activeItem.label : ""}`;
    const wordHtml = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><title>${esc(docTitle)}</title><style>body{font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#000;}</style></head><body>${html}</body></html>`;
    const blob = new Blob(["﻿", wordHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[\\/:*?"<>|]/g, "-")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const sectionHdr = (label) => (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, letterSpacing: LS_HDR, textTransform: "uppercase", color: "#1a1a1a", lineHeight: LINE_H, marginBottom: 5 }}>{label}</div>
      <div style={{ borderBottom: "1px solid #ccc" }} />
    </div>
  );

  const BADGE_W = 88;
  const levelBadge = (level) => {
    const dark = level === "Expert" || level === "Native";
    return (
      <span style={{
        fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
        padding: "3px 0", borderRadius: 3, textTransform: "uppercase",
        textAlign: "center", display: "inline-block", width: BADGE_W, flexShrink: 0,
        background: dark ? "#1a1a1a" : "#e8e8e8",
        color: dark ? "#fff" : "#444",
      }}>{level}</span>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a", minWidth: 700 }}>
      {/* ── CV Selector Bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "2px solid #000", overflowX: "auto" }}>
        {store.cvList.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
            {renamingId === item.id ? (
              <div style={{ display: "flex", alignItems: "center", background: "#000", padding: "0 4px" }}>
                <input
                  ref={renameRef}
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                  style={{ fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 8px", background: "transparent", border: "none", outline: "none", color: "#fff", textTransform: "uppercase", width: Math.max(80, renameVal.length * 7) }}
                />
              </div>
            ) : (
              <div
                onClick={() => switchCv(item.id)}
                onDoubleClick={() => startRename(item.id)}
                style={{
                  fontFamily: F, fontSize: 9, fontWeight: store.activeCvId === item.id ? 700 : 400, letterSpacing: LS,
                  padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap",
                  background: store.activeCvId === item.id ? "#000" : "#f5f5f5",
                  color: store.activeCvId === item.id ? "#fff" : "#666",
                  transition: "all .15s", textTransform: "uppercase", borderRight: "1px solid #ddd",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {item.label || "Untitled CV"}
                {store.activeCvId === item.id && store.cvList.length > 1 && (
                  <span
                    onClick={e => { e.stopPropagation(); deleteCv(item.id); }}
                    style={{ fontSize: 12, opacity: 0.5, cursor: "pointer", lineHeight: 1 }}
                    onMouseOver={e => e.currentTarget.style.opacity = 1}
                    onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                  >&times;</span>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Add / Duplicate buttons */}
        <div
          onClick={addNewCv}
          style={{
            fontFamily: F, fontSize: 9, fontWeight: 600, letterSpacing: LS, padding: "10px 12px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#f5f5f5", color: "#888",
            textTransform: "uppercase", borderRight: "1px solid #ddd",
          }}
          onMouseEnter={e => { e.target.style.color = "#1a1a1a"; }}
          onMouseLeave={e => { e.target.style.color = "#888"; }}
        >+ NEW CV</div>
        <div
          onClick={addNewCoverLetter}
          style={{
            fontFamily: F, fontSize: 9, fontWeight: 600, letterSpacing: LS, padding: "10px 12px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#f5f5f5", color: "#888",
            textTransform: "uppercase", borderRight: "1px solid #ddd",
          }}
          onMouseEnter={e => { e.target.style.color = "#1a1a1a"; }}
          onMouseLeave={e => { e.target.style.color = "#888"; }}
        >+ COVER LETTER</div>
        <div
          onClick={duplicateCv}
          style={{
            fontFamily: F, fontSize: 9, fontWeight: 600, letterSpacing: LS, padding: "10px 12px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#f5f5f5", color: "#888",
            textTransform: "uppercase", borderRight: "1px solid #ddd",
          }}
          onMouseEnter={e => { e.target.style.color = "#1a1a1a"; }}
          onMouseLeave={e => { e.target.style.color = "#888"; }}
        >DUPLICATE</div>
        {/* Right-side actions */}
        <div style={{ marginLeft: "auto", display: "flex" }}>
          {store.activeCvId && (
            <div
              onClick={() => startRename(store.activeCvId)}
              style={{
                fontFamily: F, fontSize: 9, fontWeight: 600, letterSpacing: LS, padding: "10px 12px",
                cursor: "pointer", whiteSpace: "nowrap", background: "#f5f5f5", color: "#888",
                textTransform: "uppercase", borderLeft: "1px solid #ddd",
              }}
              onMouseEnter={e => { e.target.style.color = "#1a1a1a"; }}
              onMouseLeave={e => { e.target.style.color = "#888"; }}
            >RENAME</div>
          )}
          <div onClick={isCoverLetter ? doExportWordCoverLetter : doExportWord} style={{
            fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#1a4d2e", color: "#fff",
            textTransform: "uppercase", borderLeft: "1px solid #ddd",
          }} onMouseEnter={e => { e.target.style.background = "#2a6b40"; }} onMouseLeave={e => { e.target.style.background = "#1a4d2e"; }}>EXPORT WORD</div>
          <div onClick={isCoverLetter ? doPrintCoverLetter : doPrint} style={{
            fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#000", color: "#fff",
            textTransform: "uppercase", borderLeft: "1px solid #ddd",
          }} onMouseEnter={e => { e.target.style.background = "#333"; }} onMouseLeave={e => { e.target.style.background = "#000"; }}>EXPORT PDF</div>
        </div>
      </div>

      {/* ── Live editor ── */}
      <div ref={printRef} style={{ padding: "36px 36px" }}>

        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <InlineEdit value={cv.name} onChange={v => set("name", v)} style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", lineHeight: 1.15 }} />
          <InlineEdit value={cv.title} onChange={v => set("title", v)} style={{ fontSize: 14, fontWeight: 400, color: "#1a1a1a", letterSpacing: LS, marginTop: 2 }} />
        </div>

        {/* Contact — centred, bold, horizontal with dot separators */}
        <div style={{ textAlign: "center", marginBottom: 3, lineHeight: LINE_H }}>
          {["phone", "email", "linkedin", "website"].map((key, i) => {
            const val = cv.contact?.[key];
            if (!val) return null;
            const href = makeHref(key, val);
            return (
              <span key={key} style={{ display: "inline", verticalAlign: "baseline" }}>
                {i > 0 && <span style={{ color: "#ccc", padding: "0 8px", fontSize: 8 }}>{"\u2022"}</span>}
                {href ? (
                  <a href={href} target={key === "email" ? undefined : "_blank"} rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd" }}>
                    <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", display: "inline", fontWeight: 700 }} />
                  </a>
                ) : (
                  <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", display: "inline", fontWeight: 700 }} />
                )}
              </span>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginBottom: 3, lineHeight: LINE_H }}>
          {["location", "citizenship", "markets"].map((key, i) => {
            const val = cv.contact?.[key];
            // markets renders even when empty so it's always click-to-edit
            if (!val && key !== "markets") return null;
            const placeholder = key === "markets" ? "Markets" : "";
            return (
              <span key={key} style={{ display: "inline", verticalAlign: "baseline" }}>
                {i > 0 && <span style={{ color: "#ccc", padding: "0 8px", fontSize: 8 }}>{"\u2022"}</span>}
                <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} placeholder={placeholder} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", minWidth: key === "markets" && !val ? 80 : undefined, display: "inline", fontWeight: 700 }} />
              </span>
            );
          })}
        </div>

        <div style={{ borderBottom: "2.5px solid #000", margin: "8px 0 2px 0" }} />

        {/* ── Cover Letter body (only when active tab is a cover letter) ── */}
        {isCoverLetter && (
          <div style={{ marginTop: 18 }}>
            {/* Date — right-aligned */}
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <InlineEdit value={cv.date} onChange={v => set("date", v)} placeholder="May 22, 2026" style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right" }} />
            </div>

            {/* Recipient block */}
            <div style={{ marginBottom: 18, lineHeight: LINE_H }}>
              <InlineEdit value={cv.recipient?.name} onChange={v => set("recipient.name", v)} placeholder="Hiring Team" style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }} />
              <InlineEdit value={cv.recipient?.company} onChange={v => set("recipient.company", v)} placeholder="Company" style={{ fontSize: 11, color: "#1a1a1a" }} />
              <InlineEdit value={cv.recipient?.line1} onChange={v => set("recipient.line1", v)} placeholder="Address line 1 (optional)" style={{ fontSize: 11, color: "#1a1a1a" }} />
              <InlineEdit value={cv.recipient?.line2} onChange={v => set("recipient.line2", v)} placeholder="Address line 2 (optional)" style={{ fontSize: 11, color: "#1a1a1a" }} />
            </div>

            {/* Salutation */}
            <div style={{ marginBottom: 14 }}>
              <InlineEdit value={cv.salutation} onChange={v => set("salutation", v)} placeholder="Dear Hiring Team," style={{ fontSize: 11, color: "#1a1a1a" }} />
            </div>

            {/* Body — single editable block (paragraph breaks via blank lines) */}
            <div style={{ marginBottom: 18 }}>
              <InlineEdit
                multiline
                value={typeof cv.body === "string" ? cv.body : (cv.body || []).join("\n\n")}
                onChange={v => set("body", v)}
                placeholder="Write the body of your cover letter. Use blank lines for paragraph breaks."
                style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a", minHeight: 280, whiteSpace: "pre-wrap" }}
              />
            </div>

            {/* Sign-off + signature */}
            <div style={{ marginTop: 18 }}>
              <InlineEdit value={cv.signoff} onChange={v => set("signoff", v)} placeholder="Best," style={{ fontSize: 11, color: "#1a1a1a" }} />
            </div>
            <div style={{ marginTop: 2 }}>
              <InlineEdit value={cv.signature} onChange={v => set("signature", v)} placeholder="Your Name" style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }} />
            </div>
          </div>
        )}

        {!isCoverLetter && (<>

        {/* Summary */}
        {sectionHdr("SUMMARY")}
        {(cv.summary || []).map((para, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <InlineEdit multiline value={para} onChange={v => set(`summary.${i}`, v)} style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a" }} />
          </div>
        ))}
        <div style={{ marginTop: 4, textAlign: "center" }}>
          <InlineEdit value={cv.clients} onChange={v => set("clients", v)} placeholder="Client list (separated by | )" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: "#1a1a1a", lineHeight: LINE_H, textAlign: "center" }} />
        </div>

        {/* Experience */}
        {sectionHdr("EXPERIENCE")}
        {(cv.experience || []).map((exp, ei) => (
          <div
            key={ei}
            draggable
            onDragStart={() => { dragRef.current = ei; }}
            onDragOver={e => { e.preventDefault(); setDropTarget(ei); }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={e => { e.preventDefault(); if (dragRef.current !== null && dragRef.current !== ei) moveExperience(dragRef.current, ei); dragRef.current = null; setDropTarget(null); }}
            onDragEnd={() => { dragRef.current = null; setDropTarget(null); }}
            style={{ marginBottom: 14, borderTop: dropTarget === ei ? "2px solid #1976D2" : "2px solid transparent", transition: "border-color 0.1s" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><tr>
                <td data-noprint style={{ padding: 0, width: 24, verticalAlign: "middle", cursor: "grab" }}>
                  <span style={{ fontSize: 11, color: "#ccc", userSelect: "none" }}>{"\u2630"}</span>
                </td>
                <td style={{ padding: 0, fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: LINE_H }}>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0 }}>
                    <InlineEdit value={exp.company} onChange={v => set(`experience.${ei}.company`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                    <span style={{ color: "#bbb", fontWeight: 400, padding: "0 5px" }}>|</span>
                    <InlineEdit value={exp.role} onChange={v => set(`experience.${ei}.role`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                  </span>
                </td>
                <td style={{ padding: 0, fontSize: 11, color: "#1a1a1a", textAlign: "right", whiteSpace: "nowrap", width: 140, lineHeight: LINE_H }}>
                  <InlineEdit value={exp.dates} onChange={v => set(`experience.${ei}.dates`, v)} style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right" }} />
                </td>
              </tr></tbody>
            </table>
            <div style={{ borderBottom: "1px solid #eee", margin: "2px 0 5px 0" }} />
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "none" }}>
              {(exp.bullets || []).map((b, bi) => (
                <li
                  key={bi}
                  draggable
                  onDragStart={e => { e.stopPropagation(); bulletDragRef.current = { ei, bi }; }}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setBulletDropTarget({ ei, bi }); }}
                  onDragLeave={() => setBulletDropTarget(null)}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (bulletDragRef.current && bulletDragRef.current.ei === ei && bulletDragRef.current.bi !== bi) moveBullet(ei, bulletDragRef.current.bi, bi); bulletDragRef.current = null; setBulletDropTarget(null); }}
                  onDragEnd={() => { bulletDragRef.current = null; setBulletDropTarget(null); }}
                  style={{ fontFamily: F, fontSize: 11, letterSpacing: LS, color: "#1a1a1a", lineHeight: LINE_H, marginBottom: 2, borderTop: bulletDropTarget?.ei === ei && bulletDropTarget?.bi === bi ? "2px solid #1976D2" : "2px solid transparent", transition: "border-color 0.1s" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <span data-noprint style={{ cursor: "grab", color: "#ccc", fontSize: 9, userSelect: "none", flexShrink: 0, marginTop: 3 }}>{"\u2630"}</span>
                    <span style={{ color: "#1a1a1a", flexShrink: 0, marginRight: 2 }}>{"\u2022"}</span>
                    <InlineEdit multiline value={b} onChange={v => set(`experience.${ei}.bullets.${bi}`, v)} style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a", flex: 1, minHeight: 18 }} />
                    <button data-noprint onClick={() => removeBullet(ei, bi)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                  </div>
                </li>
              ))}
            </ul>
            <div data-noprint style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <button onClick={() => moveExperience(ei, ei - 1)} disabled={ei === 0} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: ei === 0 ? "default" : "pointer", color: ei === 0 ? "#ddd" : "#888", opacity: ei === 0 ? 0.5 : 1 }}>{"\u2191"} MOVE UP</button>
              <button onClick={() => moveExperience(ei, ei + 1)} disabled={ei === (cv.experience || []).length - 1} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: ei === (cv.experience || []).length - 1 ? "default" : "pointer", color: ei === (cv.experience || []).length - 1 ? "#ddd" : "#888", opacity: ei === (cv.experience || []).length - 1 ? 0.5 : 1 }}>{"\u2193"} MOVE DOWN</button>
              <button onClick={() => addBullet(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#1a1a1a" }}>+ BULLET</button>
              <button onClick={() => removeExperience(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#fff5f5", border: "1px solid #fdd", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#c0392b" }}>REMOVE ROLE</button>
            </div>
          </div>
        ))}
        <button data-noprint onClick={addExperience} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EXPERIENCE</button>

        {/* Education */}
        {sectionHdr("EDUCATION")}
        {(cv.education || []).map((edu, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <InlineEdit value={edu.title} onChange={v => set(`education.${i}.title`, v)} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: LINE_H }} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><tr>
                <td style={{ padding: 0 }}>
                  <InlineEdit value={edu.institution} onChange={v => set(`education.${i}.institution`, v)} style={{ fontSize: 11, color: "#1a1a1a", lineHeight: LINE_H }} />
                </td>
                <td style={{ padding: 0, textAlign: "right" }}>
                  <InlineEdit value={edu.result} onChange={v => set(`education.${i}.result`, v)} style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right", lineHeight: LINE_H }} />
                </td>
                <td style={{ padding: 0, width: 20 }}>
                  <button data-noprint onClick={() => removeEducation(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                </td>
              </tr></tbody>
            </table>
          </div>
        ))}
        <button data-noprint onClick={addEducation} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EDUCATION</button>

        {/* Skills */}
        {sectionHdr("SKILLS")}
        <div style={{ marginBottom: 6 }}>
          {(cv.skills || []).map((s, idx) => (
            <SkillRow
              key={idx}
              value={typeof s === "string" ? s : (s?.name || "")}
              onChange={v => set(`skills.${idx}`, v)}
              onRemove={() => removeSkill(idx)}
            />
          ))}
        </div>
        <button data-noprint onClick={addSkill} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD SKILL</button>

        {/* Languages */}
        {sectionHdr("LANGUAGES")}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 6 }}>
          <tbody>
            {Array.from({ length: Math.ceil((cv.languages || []).length / 2) }).map((_, row) => (
              <tr key={row}>
                {[0, 1].map(col => {
                  const idx = row * 2 + col;
                  const l = (cv.languages || [])[idx];
                  if (!l) return <td key={col} style={{ padding: "5px 0" }} />;
                  return (
                    <td key={col} style={{ padding: "5px 0", paddingRight: col === 0 ? 16 : 0, borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <InlineEdit value={l.name} onChange={v => set(`languages.${idx}.name`, v)} style={{ fontSize: 11, color: "#1a1a1a", flex: 1, lineHeight: LINE_H }} />
                        <select data-noprint value={l.level} onChange={e => set(`languages.${idx}.level`, e.target.value)} style={{ fontFamily: F, fontSize: 9, border: "1px solid #eee", borderRadius: 3, padding: "2px 4px", background: "#fff", cursor: "pointer", outline: "none", flexShrink: 0 }}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Native">Native</option>
                        </select>
                        {levelBadge(l.level)}
                        <button data-noprint onClick={() => removeLanguage(idx)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <button data-noprint onClick={addLanguage} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700 }}>+ ADD LANGUAGE</button>

        {/* Volunteer & Industry Engagement */}
        {sectionHdr("VOLUNTEER & INDUSTRY ENGAGEMENT")}
        {(cv.volunteer || []).map((vol, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><tr>
                <td style={{ padding: 0, fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: LINE_H }}>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0 }}>
                    <InlineEdit value={vol.role} onChange={v => set(`volunteer.${i}.role`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                    <span style={{ color: "#bbb", fontWeight: 400, padding: "0 5px" }}>|</span>
                    <InlineEdit value={vol.organization} onChange={v => set(`volunteer.${i}.organization`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                  </span>
                </td>
                <td style={{ padding: 0, fontSize: 11, color: "#1a1a1a", textAlign: "right", whiteSpace: "nowrap", width: 140, lineHeight: LINE_H }}>
                  <InlineEdit value={vol.dates} onChange={v => set(`volunteer.${i}.dates`, v)} style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right" }} />
                </td>
                <td data-noprint style={{ padding: 0, width: 20 }}>
                  <button onClick={() => removeVolunteer(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                </td>
              </tr></tbody>
            </table>
            <div style={{ borderBottom: "1px solid #eee", margin: "2px 0 5px 0" }} />
            <InlineEdit multiline value={vol.description} onChange={v => set(`volunteer.${i}.description`, v)} style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a", paddingLeft: 18 }} />
          </div>
        ))}
        <button data-noprint onClick={addVolunteer} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>+ ADD VOLUNTEER</button>

        </>)}
      </div>
    </div>
  );
}

// ── Print helpers ──
function esc(str) { return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function secHdr(label) { return `<div style="margin-top:20px;margin-bottom:8px;"><div style="font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#1a1a1a;line-height:1.55;margin-bottom:5px;">${label}</div><div style="border-bottom:1px solid #ccc;"></div></div>`; }
function badgeHtml(level) {
  const dark = level === "Expert" || level === "Native";
  return `<span style="font-family:'Avenir','Nunito Sans',sans-serif;font-size:8px;font-weight:700;letter-spacing:0.8px;padding:3px 0;border-radius:3px;text-transform:uppercase;text-align:center;display:inline-block;width:88px;background:${dark ? '#1a1a1a' : '#e8e8e8'};color:${dark ? '#fff' : '#444'};">${level}</span>`;
}
