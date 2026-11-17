import { DatabaseSchema } from '@/types';

export const initialData: DatabaseSchema = {
  projects: [
    {
      id: 'proj-1',
      title: 'Aethelgard Botanical Spirits',
      slug: 'aethelgard-botanical-spirits',
      client: 'Aethelgard Distillers Co.',
      category: 'Packaging',
      year: '2025',
      coverImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Luxury amber glass bottle with custom embossed foil label',
      galleryImages: [
        'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'A premium packaging and visual identity system crafted for high-altitude botanical gin distillers. Featuring tactile debossing, warm copper foils, and bespoke botanical typography.',
      services: ['Brand Strategy', 'Custom Lettering', 'Packaging Architecture', 'Production Supervision'],
      approach: 'We immersed ourselves in the sub-alpine flora harvested for Aethelgard. The resulting label design balances heritage apothecary craftsmanship with minimalist modern silhouettes, resulting in an extraordinary shelf presence that increased distributor pre-orders by 340%.',
      externalLink: 'https://behance.net',
      isSample: true,
      isFeatured: true,
      published: true,
      order: 1,
      createdAt: '2025-01-10T10:00:00.000Z',
      updatedAt: '2025-01-10T10:00:00.000Z',
    },
    {
      id: 'proj-2',
      title: 'Kromos Audio Spatial System',
      slug: 'kromos-audio-spatial-system',
      client: 'Kromos Soundworks Berlin',
      category: 'Branding',
      year: '2025',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Monochromatic futuristic sound hardware branding with electric orange accents',
      galleryImages: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'A complete sonic and visual identity overhaul for next-generation spatial acoustics hardware, bridging high-end industrial engineering with visceral audio sensations.',
      services: ['Comprehensive Identity', 'Motion Language', 'UI Component System', 'Packaging'],
      approach: 'Leveraging brutalist geometry paired with high-voltage neon orange accents against obsidian textures. The dynamic waveform motif flexes from physical anodized aluminum volume dials to responsive screen interfaces.',
      externalLink: 'https://behance.net',
      isSample: true,
      isFeatured: true,
      published: true,
      order: 2,
      createdAt: '2025-01-15T12:00:00.000Z',
      updatedAt: '2025-01-15T12:00:00.000Z',
    },
    {
      id: 'proj-3',
      title: 'Vanguard Architectural Studio',
      slug: 'vanguard-architectural-studio',
      client: 'Vanguard Atelier Zurich',
      category: 'Web Design',
      year: '2024',
      coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Minimalist editorial architecture monograph and web experience',
      galleryImages: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'Digital experience and physical exhibition collateral designed for an award-winning brutalist architecture collective.',
      services: ['Digital Experience', 'Creative Direction', 'Print Monographs'],
      approach: 'Structured around golden-ratio grid systems with generous white-space (or black-space in dark mode), fluid masonry transitions, and high-fidelity project walkthroughs.',
      externalLink: 'https://behance.net',
      isSample: true,
      isFeatured: false,
      published: true,
      order: 3,
      createdAt: '2024-11-20T08:00:00.000Z',
      updatedAt: '2024-11-20T08:00:00.000Z',
    },
    {
      id: 'proj-4',
      title: 'NeoLuxe Paris Fashion Week',
      slug: 'neoluxe-paris-fashion-week',
      client: 'Maison NeoLuxe',
      category: 'Social Media',
      year: '2025',
      coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'High-contrast editorial social campaign for avant-garde haute couture',
      galleryImages: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'A hyper-stylized social media campaign and digital invitation suite for NeoLuxe Autumn/Winter runway preview.',
      services: ['Campaign Identity', 'Social Media Creatives', 'Motion Graphics', 'Event Invitations'],
      approach: 'We synchronized grain-textured film photography with razor-sharp kinetic typography in electric vermilion. The campaign generated over 2.4M organic impressions across fashion platforms within 72 hours.',
      externalLink: 'https://instagram.com',
      isSample: true,
      isFeatured: true,
      published: true,
      order: 4,
      createdAt: '2025-02-01T15:00:00.000Z',
      updatedAt: '2025-02-01T15:00:00.000Z',
    },
    {
      id: 'proj-5',
      title: 'Solstice Biocare Organics',
      slug: 'solstice-biocare-organics',
      client: 'Solstice Labs California',
      category: 'Packaging',
      year: '2024',
      coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Minimalist dark cosmetic serum bottles with vibrant terracotta labels',
      galleryImages: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'Sustainable luxury packaging system incorporating compostable mycelium packaging and recycled violet glass.',
      services: ['Eco-Packaging Design', 'Label Systems', '3D Photorealistic Renderings'],
      approach: 'Proved that sustainable skincare does not require rustic compromises. The identity blends clinical purity with warm solar gradients, creating a category-defining cosmetic brand.',
      externalLink: 'https://behance.net',
      isSample: true,
      isFeatured: false,
      published: true,
      order: 5,
      createdAt: '2024-09-12T11:00:00.000Z',
      updatedAt: '2024-09-12T11:00:00.000Z',
    },
    {
      id: 'proj-6',
      title: 'Orbit Pay Global Fintech',
      slug: 'orbit-pay-global-fintech',
      client: 'Orbit Technologies Singapore',
      category: 'Logo Design',
      year: '2025',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Dynamic 3D fluid geometric logo monogram in radiant orange and charcoal',
      galleryImages: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=80'
      ],
      overview: 'Brand mark and trademark architecture for an international cross-border liquidity engine serving emerging markets.',
      services: ['Logo System & Monogram', 'Brand Guidelines', 'Vector Motion Toolkit'],
      approach: 'Constructed an unbroken topological loop conveying continuous circulation, infinite movement, and cryptographic trust. Scalable from a 16px favicon to monumental airport billboard campaigns.',
      externalLink: 'https://behance.net',
      isSample: true,
      isFeatured: true,
      published: true,
      order: 6,
      createdAt: '2025-02-10T09:30:00.000Z',
      updatedAt: '2025-02-10T09:30:00.000Z',
    }
  ],

  services: [
    {
      id: 'srv-1',
      title: 'Brand Strategy & Identity',
      description: 'Strategic positioning, distinctive visual systems, color theory, and comprehensive brand books engineered to make your company unmistakable in competitive markets.',
      icon: 'Compass',
      deliverables: ['Brand Positioning & Narrative', 'Complete Visual Identity Systems', 'Typography & Palette Standards', 'Brand Guidelines & Asset Kits'],
      order: 1,
      published: true,
    },
    {
      id: 'srv-2',
      title: 'Logo Design',
      description: 'Iconic, memorable logo marks and custom typographic logotypes crafted with rigorous mathematical balance, versatile across miniature favicons and monumental signage.',
      icon: 'Shapes',
      deliverables: ['Primary & Secondary Marks', 'Custom Typographic Monograms', 'Colorways & Clear-Space Rules', 'Vector Export Formats (SVG, EPS, PDF)'],
      order: 2,
      published: true,
    },
    {
      id: 'srv-3',
      title: 'Social Media Creatives',
      description: 'Thumb-stopping campaign art direction, cohesive social templates, dynamic motion graphics, and editorial content systems tailored to boost organic engagement.',
      icon: 'Share2',
      deliverables: ['Custom Post & Carousel Templates', 'Motion Stories & Reels Direction', 'Campaign Art Direction', 'Brand Tone of Voice in Social'],
      order: 3,
      published: true,
    },
    {
      id: 'srv-4',
      title: 'Packaging Design',
      description: 'Tactile packaging experiences, bespoke unboxing structures, custom die-cuts, and luxury finishes that command premium retail shelf presence.',
      icon: 'Package',
      deliverables: ['Structural Box & Label Engineering', 'Specialty Foils & Debossing Finishes', 'Sustainable Material Specifications', 'Factory-Ready Production Files'],
      order: 4,
      published: true,
    },
    {
      id: 'srv-5',
      title: 'Print & Marketing Materials',
      description: 'Elevated physical marketing assets including luxury business cards, editorial brochures, large-scale event booths, and promotional collateral.',
      icon: 'Printer',
      deliverables: ['Editorial Lookbooks & Pitch Decks', 'Luxury Foil Business Cards', 'Large Format Signage & Banners', 'Print Proofing & Color Matching'],
      order: 5,
      published: true,
    },
    {
      id: 'srv-6',
      title: 'Website & UI Design',
      description: 'High-converting, responsive digital experiences with immersive micro-interactions, dark aesthetic art direction, and seamless design-to-code execution.',
      icon: 'Globe',
      deliverables: ['Figma Design Systems & Prototypes', 'Responsive Mobile & Desktop Layouts', 'Micro-Interactions & Motion Design', 'Developer Handoff Documentation'],
      order: 6,
      published: true,
    }
  ],

  content: {
    hero: {
      badge: 'CREATIVE BRANDING & DESIGN STUDIO',
      headline: 'Design That Makes\nYour Brand Stand Out.',
      supportingCopy: 'We create thoughtful brand identities, striking visuals, and digital experiences that help businesses connect with their audience.',
      primaryButtonText: 'Explore Our Work',
      primaryButtonLink: '#works',
      secondaryButtonText: 'Start a Project',
      secondaryButtonLink: '#contact',
      heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { id: 'stat-1', value: '140+', label: 'Brands Crafted' },
        { id: 'stat-2', value: '98%', label: 'Client Recommendation' },
        { id: 'stat-3', value: '18', label: 'International Design Awards' },
        { id: 'stat-4', value: '8+', label: 'Years of Excellence' },
      ],
    },
    about: {
      badge: 'ABOUT SKT BRANDING',
      headline: 'Creative Thinking.\nMeaningful Design.',
      intro: 'Founded with an uncompromising passion for craft, SKT Branding is an independent design agency that transforms ambitious concepts into iconic brands.',
      approach: 'We reject generic templates and sterile trends. Our work is grounded in deep strategic insight, meticulous typography, and bold creative courage. Whether crafting an artisanal packaging line or orchestrating a global identity rebrand, we design with purpose, clarity, and enduring impact.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      values: [
        {
          title: 'Strategic Rigor',
          description: 'Every curve, color, and typeface is rooted in commercial insight and audience understanding.'
        },
        {
          title: 'Artisanal Obsession',
          description: 'We treat digital and physical design with master craftsman precision down to the fraction of a millimeter.'
        },
        {
          title: 'Direct Partnership',
          description: 'You collaborate directly with senior design directors, ensuring zero translation loss and rapid agility.'
        }
      ],
      founder: {
        name: 'S. K. Tan',
        role: 'Founder & Principal Creative Director',
        bio: 'With over a decade of experience crafting identities for luxury, technology, and consumer brands across Tokyo, London, and New York.',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        enabled: true
      }
    },
    process: {
      badge: 'OUR PROCESS',
      headline: 'A deliberate process for exceptional results.',
      description: 'Three focused phases designed to eliminate guesswork, inspire creative breakthroughs, and deliver bulletproof design solutions.',
      steps: [
        {
          number: '01',
          title: 'Discover',
          subtitle: 'Understand the business, audience, and goals.',
          description: 'We begin with deep immersion into your enterprise. Through stakeholder discovery workshops, competitive audits, and audience sentiment analysis, we establish the strategic anchor points that guide every creative decision.',
          tags: ['Market Audit', 'Brand Architecture', 'Audience Personas', 'Strategic Brief'],
          thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
        },
        {
          number: '02',
          title: 'Design',
          subtitle: 'Develop concepts and refine the visual direction.',
          description: 'We explore divergent creative territories, translating strategic insight into tangible visual concepts. Through iterative design sprints, we refine logos, color schemes, typography systems, and tactile packaging until the brand identity is unmistakably powerful.',
          tags: ['Visual Exploration', 'Bespoke Typography', 'Mockup Prototyping', 'Refinement Sprints'],
          thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80'
        },
        {
          number: '03',
          title: 'Deliver',
          subtitle: 'Prepare final assets and support the launch.',
          description: 'Flawless production handoff. We author comprehensive brand books, generate complete vector and raster asset libraries, coordinate with specialized print vendors, and provide ongoing launch support to guarantee seamless implementation.',
          tags: ['Brand Guidelines', 'Production-Ready Assets', 'Vendor Proofing', 'Launch Support'],
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
        }
      ]
    },
    finalCta: {
      badge: 'START A CONVERSATION',
      headline: 'Let’s Build Something Remarkable.',
      supportingCopy: 'Have an upcoming brand launch, redesign, or creative challenge? Connect with us to explore how SKT Branding can elevate your market presence.'
    }
  },

  // Note: user specifically requested: "Hide this section until genuine testimonials are added."
  // So initial genuine testimonials are set to empty (or un-published) so the section is safely hidden
  // on the public site until the admin adds genuine ones.
  testimonials: [],

  inquiries: [
    {
      id: 'inq-101',
      name: 'Marcus Vance',
      email: 'm.vance@aetherdynamics.io',
      phone: '+1 (415) 890-2341',
      company: 'Aether Dynamics',
      service: 'Brand Strategy & Identity',
      description: 'We are preparing for our Series A funding round and need an end-to-end rebrand that reflects our autonomous robotics technology.',
      status: 'New',
      createdAt: '2025-02-24T14:20:00.000Z',
      notes: 'Requested pitch deck review and timeline estimate for Q2 kickoff.'
    },
    {
      id: 'inq-102',
      name: 'Elena Rostova',
      email: 'elena@solisluxury.ch',
      phone: '+41 22 518 9030',
      company: 'Solis Horology',
      service: 'Packaging Design',
      description: 'Seeking luxury packaging design for a limited edition titanium timepiece collection (300 units worldwide).',
      status: 'Contacted',
      createdAt: '2025-02-20T09:15:00.000Z',
      notes: 'Initial discovery call scheduled for this Thursday.'
    }
  ],

  settings: {
    agencyName: 'SKT Branding',
    tagline: 'Premium Graphic Design & Strategic Brand Identity Studio',
    logoText: 'SKT BRANDING',
    logoMarkUrl: '',
    email: 'contact@sktbranding.com',
    phone: '+1 (555) 782-9301',
    whatsapp: '+15557829301',
    address: '401 Broadway, Suite 1200, SoHo, New York, NY 10013',
    socialLinks: {
      whatsapp: 'https://wa.me/15557829301',
      email: 'mailto:contact@sktbranding.com',
      instagram: 'https://instagram.com/sktbranding',
      behance: 'https://behance.net/sktbranding',
      linkedin: 'https://linkedin.com/company/sktbranding',
      twitter: 'https://x.com/sktbranding',
    },
    seoTitle: 'SKT Branding — High-Impact Graphic Design & Brand Identity Agency',
    seoDescription: 'SKT Branding creates thoughtful brand identities, striking visuals, and digital experiences that make brands unforgettable.'
  },

  designers: [
    {
      id: 'des-1',
      name: 'Aria Chen',
      email: 'aria.chen@designers.sktbranding.com',
      specialty: 'Brand Identity & Typography',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      token: 'dsg_aria_7f8e91a2bc4d',
      status: 'active',
      createdAt: '2025-01-10T09:00:00.000Z',
      lastActiveAt: '2025-02-28T14:30:00.000Z',
      notes: 'Specializes in Swiss minimalism, typography systems, and modern luxury brand guidelines.'
    },
    {
      id: 'des-2',
      name: 'Lucas Silva',
      email: 'lucas.silva@designers.sktbranding.com',
      specialty: '3D Packaging & Industrial Design',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      token: 'dsg_lucas_4b2c19e3fe5a',
      status: 'active',
      createdAt: '2025-01-15T11:00:00.000Z',
      lastActiveAt: '2025-02-27T16:45:00.000Z',
      notes: 'Expert in Blender 3D photorealistic mockups, structural packaging dielines, and foil finishing.'
    },
    {
      id: 'des-3',
      name: 'Elena Vane',
      email: 'elena.vane@designers.sktbranding.com',
      specialty: 'Social Media & Motion Graphics',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      token: 'dsg_elena_8c3d55f190ab',
      status: 'active',
      createdAt: '2025-02-01T10:00:00.000Z',
      lastActiveAt: '2025-02-28T11:20:00.000Z',
      notes: 'Creative lead for kinetic typography, animated campaign teasers, and high-conversion social assets.'
    }
  ],

  tasks: [
    {
      id: 'task-101',
      title: 'Nocturne Spirits Minimalist Label Architecture',
      client: 'Nocturne Distillers Zurich',
      brief: 'Develop three distinct label concepts for Nocturne\'s limited reserve gin. The aesthetic must reflect Nordic twilight: deep obsidian glass, hot-stamped copper foil accents, and ultra-refined serif micro-typography. Avoid cluttered ornamentation; let the materials and typography convey quiet luxury.',
      deliverables: '3 distinct front & back label concepts in PDF & AI format, plus 3D contextual renders on dark glass bottle mockups.',
      dimensions: 'Label Dieline: 90mm x 140mm; Render: 1920x1080px 16:9',
      fileFormats: 'AI (vector with outlines), PDF (print-ready CMYK + spot foil layer), High-Res PNG / JPG renders.',
      priority: 'high',
      deadline: '2025-03-10T18:00:00.000Z',
      status: 'available',
      assignedDesignerId: null,
      assignedDesignerName: null,
      referenceFiles: [
        {
          id: 'ref-1',
          name: 'Nocturne_Brand_Moodboard_2025.pdf',
          url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
          size: 4850000,
          type: 'application/pdf',
          uploadedAt: '2025-02-26T10:00:00.000Z'
        },
        {
          id: 'ref-2',
          name: 'Bottle_Dieline_Spec_750ml.ai',
          url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
          size: 2150000,
          type: 'application/illustrator',
          uploadedAt: '2025-02-26T10:05:00.000Z'
        }
      ],
      submissions: [],
      createdAt: '2025-02-26T10:00:00.000Z',
      updatedAt: '2025-02-26T10:00:00.000Z'
    },
    {
      id: 'task-102',
      title: 'Aura Spatial Acoustics Brand Deck & Icons',
      client: 'Aura Soundworks Munich',
      brief: 'Create a 12-slide executive presentation deck and a custom 16-piece icon set for Aura\'s breakthrough spatial audio processor. The visual language should combine sleek audio hardware precision with electric orange glowing frequency graphs.',
      deliverables: '12-slide Figma / Keynote / PDF presentation deck and 16 custom vector icons in SVG & AI format.',
      dimensions: '1920x1080px (16:9 widescreen)',
      fileFormats: 'Figma link, PDF Presentation, SVG icons, AI master file',
      priority: 'medium',
      deadline: '2025-03-08T18:00:00.000Z',
      status: 'in_progress',
      assignedDesignerId: 'des-1',
      assignedDesignerName: 'Aria Chen',
      assignedAt: '2025-02-27T10:00:00.000Z',
      referenceFiles: [
        {
          id: 'ref-3',
          name: 'Aura_Audio_Hardware_Specs.pdf',
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
          size: 3200000,
          type: 'application/pdf',
          uploadedAt: '2025-02-27T09:30:00.000Z'
        }
      ],
      submissions: [],
      createdAt: '2025-02-27T09:00:00.000Z',
      updatedAt: '2025-02-27T10:00:00.000Z'
    },
    {
      id: 'task-103',
      title: 'Vesper Botanical Luxury Skincare Packaging',
      client: 'Vesper Organics Paris',
      brief: 'Design sustainable folding carton packaging with blind debossing and copper foil accents for Vesper\'s night restorative serum. We want tactile luxury using FSC certified uncoated black paperboard.',
      deliverables: 'Complete packaging dieline design, embossing die production guides, and photorealistic 3D presentation renders.',
      dimensions: 'Outer carton: 45mm x 45mm x 135mm',
      fileFormats: 'AI master dielines with separate spot layers, Print PDF, 4x 3D JPG renders (1920x1080)',
      priority: 'urgent',
      deadline: '2025-03-05T18:00:00.000Z',
      status: 'revision_requested',
      assignedDesignerId: 'des-2',
      assignedDesignerName: 'Lucas Silva',
      assignedAt: '2025-02-22T08:00:00.000Z',
      referenceFiles: [
        {
          id: 'ref-4',
          name: 'Vesper_Formula_Ingredients_Text.docx',
          url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
          size: 450000,
          type: 'application/docx',
          uploadedAt: '2025-02-22T08:15:00.000Z'
        }
      ],
      submissions: [
        {
          id: 'sub-1',
          version: 1,
          versionLabel: 'Original Submission',
          submittedAt: '2025-02-25T17:30:00.000Z',
          designerId: 'des-2',
          designerName: 'Lucas Silva',
          notes: 'Initial carton architecture with copper hot-stamping on 380gsm black linen board. Included two variations for the top tuck flap seal.',
          files: [
            {
              id: 'f-1',
              name: 'Vesper_Carton_v1_Dieline.pdf',
              url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
              size: 8900000,
              type: 'application/pdf',
              uploadedAt: '2025-02-25T17:28:00.000Z'
            },
            {
              id: 'f-2',
              name: 'Vesper_Serum_3D_Mockups.zip',
              url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
              size: 24500000,
              type: 'application/zip',
              uploadedAt: '2025-02-25T17:29:00.000Z'
            }
          ],
          reviewStatus: 'revision_requested',
          reviewedAt: '2025-02-26T11:15:00.000Z',
          adminFeedback: 'The overall material choice and copper foil treatment look exquisite. However, please make two critical adjustments:\n1. Increase the tracking on the French ingredient text on the left panel (currently too dense for foil debossing).\n2. Reposition the batch verification QR square to the bottom flap so the exterior panels remain completely minimal.'
        }
      ],
      createdAt: '2025-02-22T08:00:00.000Z',
      updatedAt: '2025-02-26T11:15:00.000Z'
    },
    {
      id: 'task-104',
      title: 'NeoLuxe Paris Fashion Week Social Suite',
      client: 'Maison NeoLuxe',
      brief: 'Produce a 9-part editorial carousel suite and kinetic countdown stories for Paris Fashion Week runway livestream. Blend high-grain monochrome runway shots with bold vermilion kinetic accents.',
      deliverables: '9-slide carousel set (1080x1350px) and 5 animated story templates (1080x1920px 9:16).',
      dimensions: 'Carousel: 1080x1350px; Stories: 1080x1920px (9:16)',
      fileFormats: 'PSD source files, MP4 animations (H.264), High-Res PNGs',
      priority: 'high',
      deadline: '2025-02-24T18:00:00.000Z',
      status: 'completed',
      assignedDesignerId: 'des-3',
      assignedDesignerName: 'Elena Vane',
      assignedAt: '2025-02-18T09:00:00.000Z',
      referenceFiles: [
        {
          id: 'ref-5',
          name: 'NeoLuxe_Lookbook_RAW_Selection.zip',
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
          size: 42000000,
          type: 'application/zip',
          uploadedAt: '2025-02-18T09:10:00.000Z'
        }
      ],
      submissions: [
        {
          id: 'sub-10',
          version: 1,
          versionLabel: 'Original Submission',
          submittedAt: '2025-02-21T16:00:00.000Z',
          designerId: 'des-3',
          designerName: 'Elena Vane',
          notes: 'First draft of the 9-part carousel. Focused on cinematic pacing and heavy grain overlay.',
          files: [
            {
              id: 'f-10',
              name: 'NeoLuxe_Carousel_Draft_v1.pdf',
              url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80',
              size: 15400000,
              type: 'application/pdf',
              uploadedAt: '2025-02-21T15:58:00.000Z'
            }
          ],
          reviewStatus: 'revision_requested',
          reviewedAt: '2025-02-22T10:00:00.000Z',
          adminFeedback: 'Visual direction is phenomenal! Please punch up the orange kinetic typography on slides 3 and 7 — it currently fades into the shadow too quickly. Also ensure the final CTA slide includes the livestream URL.'
        },
        {
          id: 'sub-11',
          version: 2,
          versionLabel: 'Revision 1',
          submittedAt: '2025-02-23T14:20:00.000Z',
          designerId: 'des-3',
          designerName: 'Elena Vane',
          notes: 'Applied requested changes: amplified vermilion glow on slides 3 and 7, and updated final slide with live streaming banner.',
          files: [
            {
              id: 'f-11',
              name: 'NeoLuxe_PFW_Final_Assets_All.zip',
              url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
              size: 38200000,
              type: 'application/zip',
              uploadedAt: '2025-02-23T14:18:00.000Z'
            },
            {
              id: 'f-12',
              name: 'NeoLuxe_Carousel_Proof_Final.jpg',
              url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80',
              size: 4200000,
              type: 'image/jpeg',
              uploadedAt: '2025-02-23T14:19:00.000Z'
            }
          ],
          reviewStatus: 'approved',
          reviewedAt: '2025-02-23T18:00:00.000Z',
          adminFeedback: 'Outstanding execution! Approved for immediate client distribution. Colors and typography are flawless.'
        }
      ],
      createdAt: '2025-02-18T09:00:00.000Z',
      updatedAt: '2025-02-23T18:00:00.000Z'
    }
  ]
};
