/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — CONTENT DATA
   Pure data layer. No prices are published on the site — clients receive a
   written quotation after a site visit.
   ========================================================================== */

const BUSINESS = {
  name: 'Redefine Interiors & Materials Supply',
  shortName: 'Redefine Interiors',
  tagline: 'Interiors, fittings & materials — done right.',
  phonePrimary: '0703 142 874',
  phonePrimaryDial: '+254703142874',
  waPrimary: '254703142874',
  phoneSecondary: '0703 142 874',
  waSecondary: '254703142874',
  email: 'hello@redefineinteriors.co.ke',
  hours: 'Mon – Sat: 8:00am – 6:00pm',
  hoursSunday: 'Sunday: By appointment',
  areas: 'All parts of Kenya'
};

/* ---------------------------------------------------------------- DESIGN WORK */
const DESIGNS = [
  {
    id: 'd01',
    featured: true,
    title: 'Modern L-Shaped Kitchen Cabinets',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-lshape.jpg',
    badge: 'Best seller',
    time: '2 – 3 weeks',
    summary: 'Matte graphite cabinets with a warm walnut worktop, soft-close everything and a fully fitted corner unit that uses every centimetre of your kitchen.',
    features: ['18mm moisture-resistant MDF carcass', 'Soft-close hinges & drawer runners', 'Solid wood / quartz worktop', 'Designated appliance & bin housings'],
    materials: ['18mm MDF', 'Melamine laminate', 'Soft-close hardware']
  },
  {
    id: 'd02',
    featured: true,
    title: 'White Gloss Kitchen & Breakfast Bar',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-white-gloss.jpg',
    badge: 'Showroom finish',
    time: '3 weeks',
    summary: 'Handleless high-gloss doors, charcoal quartz tops and a slim breakfast bar — a bright, easy-clean kitchen that suits modern Nairobi apartments.',
    features: ['Handleless push-to-open doors', 'Quartz or granite worktop', 'Glass splashback option', 'Breakfast bar with seating'],
    materials: ['High-gloss acrylic', 'Quartz tops', 'Brass tap set']
  },
  {
    id: 'd03',
    featured: true,
    title: 'U-Shaped Family Kitchen + Pantry',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-ushape.jpg',
    badge: '',
    time: '3 – 4 weeks',
    summary: 'A full family kitchen with a tall pantry, double oven housing and a generous island — designed for large households and serious cooking.',
    features: ['Tall pantry & larder units', 'Island with rails & pendant lighting', 'Built-in oven & microwave housing', 'Pull-out baskets and corner carousel'],
    materials: ['Shaker doors', 'Oak worktops', 'Pull-out baskets']
  },
  {
    id: 'd04',
    featured: true,
    title: '4-Door Sliding Mirror Wardrobe',
    category: 'Wardrobes',
    image: 'assets/img/d-wardrobe-sliding.jpg',
    badge: 'Popular',
    time: '7 – 10 days',
    summary: 'Two mirror doors, two veneer doors and internal fittings that actually make sense — hanging rails, shelves, shoe rack and a lockable drawer.',
    features: ['Soft-close sliding system', 'Full-length mirror doors', 'Interior LED downlighting', 'Drawers, shelves & shoe rack'],
    materials: ['18mm MDF', 'Veneer / laminate', 'Sliding rails & rollers']
  },
  {
    id: 'd05',
    featured: true,
    title: 'Luxury Walk-In Closet',
    category: 'Wardrobes',
    image: 'assets/img/d-walkin-closet.jpg',
    badge: 'Premium',
    time: '3 weeks',
    summary: 'A boutique-style walk-in with lit hanging rails, glass display doors, a jewellery drawer unit and an island ottoman for the master suite.',
    features: ['Lit rails & shelf LED strips', 'Glass display doors', 'Jewellery drawer with glass top', 'Island / ottoman option'],
    materials: ['Walnut panels', 'Glass doors', 'LED strip lighting']
  },
  {
    id: 'd06',
    title: 'Boutique Fitted Wardrobe Wall',
    category: 'Wardrobes',
    image: 'assets/img/hero-2-wardrobe.jpg',
    badge: 'Space saver',
    time: '10 – 14 days',
    summary: 'A full wall of fitted storage with open display shelving, drawers and a dressing corner — perfect for bedrooms that have to work harder.',
    features: ['Floor-to-ceiling fitted run', 'Drawers, shelves & display niches', 'Interior LED strip lighting', 'Matching mirror and stool'],
    materials: ['White-oak laminate', 'LED strip lighting', 'Soft-close hinges']
  },
  {
    id: 'd07',
    title: 'Aluminium Sliding Doors & Windows',
    category: 'Aluminium Works',
    image: 'assets/img/hero-5-aluminum.jpg',
    unit: 'per sqm',
    badge: 'Security',
    time: '5 – 10 days',
    summary: 'Slim aluminium frames, smooth gliding rollers, mosquito mesh and security grilles — measured, fabricated and installed by our own team.',
    features: ['Powder-coated / anodised frames', 'Mosquito mesh & security grilles', 'High-quality rollers and locks', 'Site measurement included'],
    materials: ['Aluminium profiles', '4 – 8mm glass', 'Mesh & grilles']
  },
  {
    id: 'd08',
    title: 'Gypsum Ceiling with Cove Lighting',
    category: 'Gypsum Works',
    image: 'assets/img/hero-3-living-gypsum.jpg',
    unit: 'per sqm',
    badge: 'Most requested',
    time: '3 – 7 days',
    summary: 'Hidden cove lighting, recessed spotlights and clean straight lines — the single fastest way to make a sitting room feel expensive.',
    features: ['Concealed LED cove', 'Recessed spotlight layout', 'Cornice and shadow gaps', 'Crack-free jointing & skim'],
    materials: ['9mm gypsum boards', 'Metal studs & channels', 'LED cove lighting']
  },
  {
    id: 'd09',
    title: 'Boutique Shop Renovation',
    category: 'Shop Renovation',
    image: 'assets/img/hero-4-shop.jpg',
    badge: 'Turnkey',
    time: '3 – 5 weeks',
    summary: 'Fluted panels, display rails, cash counter, lighting and branding surfaces — a retail space customers want to walk into.',
    features: ['Display shelving & rails', 'Fluted wall panels', 'Track & accent lighting', 'Counter, signage & fitting rooms'],
    materials: ['Fluted WPC panels', 'Track spotlights', 'Terrazzo / tile flooring']
  },
  {
    id: 'd10',
    title: 'Complete 3-Bedroom Home Fit-Out',
    category: 'Fittings',
    image: 'assets/img/hero-1-kitchen.jpg',
    badge: 'One contract',
    time: '5 – 8 weeks',
    summary: 'One team, one contract: kitchen, wardrobes, gypsum ceilings, aluminium, doors, locks, sanitary and all plumbing fittings for the whole house.',
    features: ['Kitchen + 3 wardrobes', 'Full gypsum ceiling package', 'All doors, locks & handles', 'Sanitary & plumbing fittings'],
    materials: ['Full material supply', 'Labour & installation', 'Site supervision']
  }
];

/* ------------------------------------------------------------- MATERIAL SUPPLY */
const MATERIALS = [
  {
    id: 'm01',
    image: 'assets/img/mat-mdf-board.jpg',
    name: '18mm MDF Board',
    category: 'Boards & Panels',
    swatch: 'mdf', icon: 'box',
    unit: 'per 8×4ft sheet',
    badge: 'In stock',
    note: 'Moisture-resistant grade for kitchens and bathrooms. Bulk discounts on project orders.'
  },
  {
    id: 'm02',
    image: 'assets/img/mat-laminate-sheet.jpg',
    name: 'Melamine Laminate Sheet',
    category: 'Boards & Panels',
    swatch: 'laminate', icon: 'palette',
    unit: 'per 8×4ft sheet',
    badge: '40+ colours',
    note: 'Woodgrains, marbles and plain colours. Matching edge tape available.'
  },
  {
    id: 'm03',
    image: 'assets/img/mat-hardware-kit.jpg',
    name: 'Cabinet Hardware Kit',
    category: 'Hardware & Fittings',
    swatch: 'hardware', icon: 'wrench',
    unit: 'per kit',
    badge: 'Soft-close',
    note: '20 soft-close hinges, 5 pairs of drawer runners, screws and buffers.'
  },
  {
    id: 'm04',
    image: 'assets/img/mat-sink-tap.jpg',
    name: 'Kitchen Sink & Pull-Out Tap Set',
    category: 'Hardware & Fittings',
    swatch: 'steel', icon: 'wrench',
    unit: 'per set',
    badge: '304 stainless',
    note: 'Undercut double bowl sink with pull-out mixer, waste kit and fittings.'
  },
  {
    id: 'm05',
    image: 'assets/img/mat-gypsum-board.jpg',
    name: 'Gypsum Ceiling Board',
    category: 'Gypsum & Ceilings',
    swatch: 'gypsum', icon: 'layers',
    unit: 'per 1.2×2.4m board',
    badge: '9mm',
    note: 'Ceiling-grade boards. Studs, channels, joint tape and skim also available.'
  },
  {
    id: 'm06',
    image: 'assets/img/mat-aluminium-profiles.jpg',
    name: 'Aluminium Window & Door Profiles',
    category: 'Aluminium',
    swatch: 'aluminium', icon: 'window',
    unit: 'per kg',
    badge: 'Anodised',
    note: 'Silver, black and bronze finishes. Cut-to-size and fabrication on request.'
  },
  {
    id: 'm07',
    image: 'assets/img/mat-porcelain-tile.jpg',
    name: 'Porcelain Floor Tile 600×600',
    category: 'Tiles & Finishes',
    swatch: 'tile', icon: 'palette',
    unit: 'per sqm',
    badge: 'Matt / gloss',
    note: 'Lappato, marble-look and wood-look ranges. Free samples on request.'
  },
  {
    id: 'm08',
    image: 'assets/img/mat-fluted-panel.jpg',
    name: 'Fluted WPC Wall Panel',
    category: 'Tiles & Finishes',
    swatch: 'fluted', icon: 'layers2',
    unit: 'per panel (300×2900mm)',
    badge: 'Waterproof',
    note: 'Popular for TV walls, shop fronts and reception areas. Trims available.'
  },
  {
    id: 'm09',
    image: 'assets/img/mat-quartz-slab.jpg',
    name: 'Quartz Countertop Slab',
    category: 'Countertops',
    swatch: 'quartz', icon: 'spark',
    unit: 'per sqm fitted',
    badge: '20mm',
    note: 'Marble-look quartz with cut-outs, joins and edge profiling included.'
  },
  {
    id: 'm10',
    /* no photograph supplied yet — renders the designed swatch tile */
    name: 'LED Spotlight & Cove Strip Pack',
    category: 'Lighting',
    swatch: 'led', icon: 'bulb',
    unit: 'per pack',
    badge: 'Warm / cool',
    note: '6 recessed spotlights plus 5m of cove strip with driver and connectors.'
  }
];

/* --------------------------------------------------------- SERVICES (6 CORE)
   Each service carries two layers of copy:
     text   → the short card used on the home page and in grids
     body   → the long paragraph used by the service block on services.html
   `eyebrow`, `meta`, `bullets`, `imageAlt`, `ctaLabel`, `linkLabel` and
   `linkHref` drive the services.html block, so the whole page (image + every
   line of text under it) can be edited from the admin overlay.              */
const SERVICES = [
  {
    slug: 'kitchen-cabinets',
    category: 'Kitchen Cabinets',
    title: 'Kitchen Cabinets',
    icon: 'cabinet',
    image: 'assets/img/d-kitchen-ushape.jpg',
    imageAlt: 'U-shaped kitchen with island, cream shaker cabinets and pendant lights built in Kenya',
    text: 'Bespoke kitchens — carcasses, doors, worktops, sinks and appliance housing, built to your exact measurements.',
    eyebrow: '01 · Kitchens',
    blockTitle: 'Kitchen cabinets',
    body: 'A kitchen is 70% cabinet and 30% layout. We get the layout right first — where the sink, cooker, fridge and prep space sit — then build carcasses in 18mm moisture-resistant board with soft-close hardware, worktops in quartz, granite or solid wood, and internals that actually fit your pots and pans.',
    meta: [
      { k: '18mm boards', v: 'Moisture-resistant' },
      { k: 'Soft-close', v: 'Hinges & runners' },
      { k: '2 – 4 weeks', v: 'Typical delivery' }
    ],
    bullets: [
      'Melamine, acrylic gloss, veneer or shaker doors',
      'Tall pantry, appliance and bin housing units',
      'Quartz / granite worktops with sink & hob cut-outs',
      'Soft-close hinges, quality runners, corner carousels'
    ],
    ctaLabel: 'Request kitchen quotation',
    linkLabel: 'See kitchen designs',
    linkHref: 'designs.html'
  },
  {
    slug: 'wardrobes',
    category: 'Wardrobes',
    title: 'Wardrobes & Closets',
    icon: 'wardrobe',
    image: 'assets/img/d-wardrobe-sliding.jpg',
    imageAlt: 'Four door sliding wardrobe with mirror doors fitted in a Kenyan bedroom',
    text: 'Sliding, hinged, walk-in and combined wardrobe-plus-desk units with fittings that last.',
    eyebrow: '02 · Bedrooms',
    blockTitle: 'Wardrobes & closets',
    body: 'Sliding, hinged, walk-in or combined wardrobe-plus-desk units — designed around how you actually dress, with short-hang, long-hang, drawer, shoe and suitcase zones. Sliding doors save up to 900mm of floor space compared with hinged doors.',
    meta: [
      { k: 'Mirror doors', v: 'Full-length option' },
      { k: 'Interior LED', v: 'On rails & shelves' },
      { k: '7 – 14 days', v: 'Typical delivery' }
    ],
    bullets: [
      'Full-length mirror and veneer door combinations',
      'Interior LED lighting on rails and shelves',
      'Drawers, jewellery trays, shoe racks & tie rails',
      'Floor-to-ceiling units that close the dust gap'
    ],
    ctaLabel: 'Request wardrobe quotation',
    linkLabel: 'See wardrobe designs',
    linkHref: 'designs.html'
  },
  {
    slug: 'aluminium-works',
    category: 'Aluminium Works',
    title: 'Aluminium Works',
    icon: 'window',
    image: 'assets/img/hero-5-aluminum.jpg',
    imageAlt: 'Aluminium sliding windows with security grilles installed in a Kenyan home',
    text: 'Windows, sliding doors, shop fronts, gypsum partitions, balustrades and burglar proofing.',
    eyebrow: '03 · Windows & partitions',
    blockTitle: 'Aluminium works',
    body: 'Windows, sliding doors, shop fronts, office partitions, glass balustrades, shower cubicles, mosquito mesh and burglar proofing. We fabricate in our workshop from measured site dimensions, so frames arrive square and fit the first time.',
    meta: [
      { k: 'Powder-coated', v: 'Black · bronze · silver' },
      { k: '4 – 8mm glass', v: 'Single or double' },
      { k: '5 – 10 days', v: 'Typical delivery' }
    ],
    bullets: [
      'Powder-coated and anodised finishes: black, bronze, silver, charcoal',
      '4mm – 8mm glass, single or double glazed',
      'Sliding, casement, awning and fixed frames',
      'Security grilles, mesh and quality locking gear'
    ],
    ctaLabel: 'Request aluminium quotation',
    linkLabel: 'Aluminium profiles',
    linkHref: 'materials.html'
  },
  {
    slug: 'gypsum-works',
    category: 'Gypsum Works',
    title: 'Gypsum Works',
    icon: 'layers',
    image: 'assets/img/hero-3-living-gypsum.jpg',
    imageAlt: 'Gypsum ceiling with concealed cove lighting installed in a Kenyan sitting room',
    text: 'Ceilings, cove lighting, cornices, partitions, TV feature walls and decorative curves.',
    eyebrow: '04 · Ceilings & walls',
    blockTitle: 'Gypsum works',
    body: 'Ceilings, cove lighting, cornices, shadow gaps, partitions, TV feature walls and decorative curves. Gypsum is the fastest way to make a room feel designed — and the jointing is where most fundis fail. Ours is taped, filled, sanded and primed until you cannot see a seam.',
    meta: [
      { k: 'Cove lighting', v: 'Concealed LED' },
      { k: 'Crack-free', v: 'Taped & skimmed' },
      { k: '3 – 9 days', v: 'Typical delivery' }
    ],
    bullets: [
      'Concealed cove lighting and recessed spotlight layout',
      'Curved and sculpted media walls with niches',
      'Room partitions and dropped ceiling sections',
      'Crack-resistant jointing, cornice and finishing'
    ],
    ctaLabel: 'Request gypsum quotation',
    linkLabel: 'Gypsum boards & fittings',
    linkHref: 'materials.html'
  },
  {
    slug: 'shop-renovation',
    category: 'Shop Renovation',
    title: 'Shop Renovation',
    icon: 'shop',
    image: 'assets/img/hero-4-shop.jpg',
    imageAlt: 'Boutique shop interior with fluted panels and display rails after renovation in Kenya',
    text: 'Retail, salon, barbershop, clinic and office fit-outs — shelving, counters, lighting and branding surfaces.',
    eyebrow: '05 · Commercial',
    blockTitle: 'Shop renovation',
    body: 'Boutiques, salons, barbershops, minimarts, pharmacies, clinics, restaurants and offices. We plan your customer flow — entrance, display zones, till point and storage — then build shelving, counters, ceilings, lighting, partitions and shop fronts. Night work available so you do not lose trading days.',
    meta: [
      { k: 'Turnkey', v: 'One team, one job' },
      { k: 'Night work', v: 'Available' },
      { k: '3 – 6 weeks', v: 'Typical delivery' }
    ],
    bullets: [
      'Display shelving, rails, gondolas and counters',
      'Fluted panels, signage surfaces and brand colours',
      'Gypsum ceilings, aluminium shop fronts, glass partitions',
      'Track, accent and feature lighting layout'
    ],
    ctaLabel: 'Request shop quotation',
    linkLabel: 'Book a site survey',
    linkHref: 'contact.html'
  },
  {
    slug: 'fittings',
    category: 'Fittings',
    title: 'All Fittings Work',
    icon: 'wrench',
    image: 'assets/img/hero-1-kitchen.jpg',
    imageAlt: 'Cabinet hardware, hinges and handles supplied by Redefine Interiors in Kenya',
    text: 'Doors, locks, handles, hinges, sinks, taps, sanitary ware, lighting and finishing — supplied and installed.',
    eyebrow: '06 · Finishing',
    blockTitle: 'All fittings work',
    body: 'The details that decide whether a space feels cheap or complete: doors, locks, handles, hinges, drawer runners, sinks, taps, showers, sanitary ware, mirrors, shelving and lighting — supplied and installed properly, the same week.',
    meta: [
      { k: 'Supply & fit', v: 'Same week' },
      { k: 'Genuine brands', v: 'Only' },
      { k: '1 – 5 days', v: 'Typical delivery' }
    ],
    bullets: [
      'Door hanging, locksets, handles and closers',
      'Sinks, taps, mixers, wastes and plumbing fittings',
      'Bathroom vanities, mirrors, shower cubicles',
      'Cabinet hardware upgrades (soft-close conversions)'
    ],
    ctaLabel: 'Request fittings quotation',
    linkLabel: 'Hardware & fittings',
    linkHref: 'materials.html'
  }
];

/* ------------------------------------------------------------------- REVIEWS
   50 reviews. Nairobi (specific estates) plus Nakuru, Ngong, Juja, Ruiru,
   Thika and Naivasha, with a few projects further afield.
   --------------------------------------------------------------------------- */
const REVIEWS = [
  {"name":"Grace Wanjiru","location":"Kilimani, Nairobi","rating":5,"service":"Kitchen Cabinets","date":"Aug 2026","text":"They installed our kitchen cabinets and the finish is flawless. The team worked around our family schedule and cleaned up before leaving every evening."},
  {"name":"Brian Otieno","location":"Lavington, Nairobi","rating":5,"service":"Wardrobes","date":"Aug 2026","text":"Four-door sliding wardrobe delivered in nine days. The mirrors and soft-close doors are top quality for the price we paid."},
  {"name":"Mercy Achieng","location":"Westlands, Nairobi","rating":5,"service":"Gypsum Works","date":"Jul 2026","text":"The gypsum ceiling with cove lighting completely changed our sitting room. Tidy workmanship and no dust left behind."},
  {"name":"Peter Kamau","location":"Karen, Nairobi","rating":5,"service":"Shop Renovation","date":"Jul 2026","text":"They renovated our shop in Karen in three weeks — shelving, counter, ceiling and lighting. Sales went up the very month we reopened."},
  {"name":"Faith Njeri","location":"Kileleshwa, Nairobi","rating":5,"service":"Materials Supply","date":"Jun 2026","text":"Sink, tap, hinges and handles supplied at better prices than the hardware shops along Ngong Road. Genuine brands too."},
  {"name":"Samuel Mwangi","location":"Runda, Nairobi","rating":5,"service":"Aluminium Works","date":"Jun 2026","text":"Aluminium sliding doors and windows fitted perfectly. Smooth operation, neat finishing and they sealed everything properly."},
  {"name":"Esther Wambui","location":"Parklands, Nairobi","rating":4,"service":"Kitchen Cabinets","date":"Jun 2026","text":"Good workmanship and fair pricing. The timeline moved by about a week, but they kept me updated on WhatsApp the whole time."},
  {"name":"Dennis Kiptoo","location":"South B, Nairobi","rating":5,"service":"Wardrobes","date":"May 2026","text":"Wardrobe and TV console for our two-bedroom in South B. Great value, and the WhatsApp updates made it easy to follow progress."},
  {"name":"Cynthia Adhiambo","location":"South C, Nairobi","rating":5,"service":"Gypsum Works","date":"May 2026","text":"A gypsum partition turned one big room into a bedroom and a study. Very clean work and the jointing is invisible."},
  {"name":"Joseph Mutua","location":"Buruburu, Nairobi","rating":5,"service":"Kitchen Cabinets","date":"May 2026","text":"Kitchen cabinets plus a pantry unit. They measured on Monday and sent the quotation the same day."},
  {"name":"Lucy Nyambura","location":"Donholm, Nairobi","rating":5,"service":"Materials Supply","date":"Apr 2026","text":"Bought gypsum boards, studs and tiles from them. Delivered to Donholm the next morning as promised."},
  {"name":"Kevin Omondi","location":"Umoja, Nairobi","rating":5,"service":"Aluminium Works","date":"Apr 2026","text":"Aluminium windows with burglar proofing for the whole house. Solid work at a fair price."},
  {"name":"Sharon Chebet","location":"Embakasi, Nairobi","rating":5,"service":"Shop Renovation","date":"Apr 2026","text":"Our salon in Embakasi looks like a completely different space now. Clients keep asking who did the work."},
  {"name":"Anthony Njoroge","location":"Roysambu, Nairobi","rating":5,"service":"Wardrobes","date":"Mar 2026","text":"Walk-in closet that genuinely looks like a hotel. The finishing quality is exceptional and the team handled everything. I highly recommend them."},
  {"name":"Vivian Mueni","location":"Kasarani, Nairobi","rating":5,"service":"Kitchen Cabinets","date":"Mar 2026","text":"They redid the kitchen another fundi had messed up. Proof that experience really matters — everything lines up perfectly now."},
  {"name":"Stephen Kariuki","location":"Githurai 45, Nairobi","rating":4,"service":"Gypsum Works","date":"Mar 2026","text":"Ceiling and cornice done well, and the materials were supplied the same day. Only the paint touch-ups delayed us slightly."},
  {"name":"Halima Yusuf","location":"Zimmerman, Nairobi","rating":5,"service":"Materials Supply","date":"Feb 2026","text":"Kitchen accessories, pull-out baskets and soft-close runners. Genuine items — no fake hardware like other shops sell."},
  {"name":"Moses Barasa","location":"Kahawa West, Nairobi","rating":5,"service":"Shop Renovation","date":"Feb 2026","text":"Mini shop fit-out with shelving and a counter. Finished in twelve days exactly as promised."},
  {"name":"Ruth Wairimu","location":"Lang’ata, Nairobi","rating":5,"service":"Aluminium Works","date":"Jan 2026","text":"Aluminium and glass partition for our home office. The light and sound are perfect now, and it was up in four days."},
  {"name":"Beatrice Moraa","location":"Utawala, Nairobi","rating":5,"service":"Gypsum Works","date":"Jan 2026","text":"Gypsum TV wall with LED backlighting. Best decision we made — the living room feels expensive now."},
  {"name":"Felix Maina","location":"Komarock, Nairobi","rating":5,"service":"Fittings","date":"Dec 2025","text":"Bathroom vanity and mirror cabinet. Supply and installation happened on the same day."},
  {"name":"Janet Akinyi","location":"Pipeline, Nairobi","rating":5,"service":"Kitchen Cabinets","date":"Dec 2025","text":"Kitchen completed in two weeks. Clean team, clear deposit agreement and no surprise costs at the end."},
  {"name":"Naomi Wanjiku","location":"Muthaiga, Nairobi","rating":5,"service":"Fittings","date":"Nov 2025","text":"Quartz countertop and sink supplied and installed. The edge profiling is impeccable."},
  {"name":"Tabitha Nyokabi","location":"Ngong Town, Kajiado","rating":5,"service":"Wardrobes","date":"Oct 2025","text":"Wardrobes and kitchen cabinets for our home in Ngong. Worth every shilling — they even adjusted a shelf after handover."},
  {"name":"Alex Mburu","location":"Juja, Kiambu","rating":5,"service":"Kitchen Cabinets","date":"Oct 2025","text":"Kitchen cabinets for our Juja apartment. They beat three other quotations and still used better materials."},
  {"name":"Winnie Njoki","location":"Membley Estate, Ruiru","rating":5,"service":"Gypsum Works","date":"Oct 2025","text":"Gypsum ceiling in all the bedrooms plus cornice. Very neat borders — you cannot see a single joint."},
  {"name":"George Ndegwa","location":"Makongeni, Thika","rating":5,"service":"Shop Renovation","date":"Sep 2025","text":"Butchery and shop renovation in Thika: shelving, cold-room partition and lighting, all done well."},
  {"name":"Faith Kilonzo","location":"Barnabas, Nakuru","rating":5,"service":"Kitchen Cabinets","date":"Aug 2025","text":"Our kitchen in Barnabas was finished in eighteen days, including the worktop cut-outs. The team travelled from Nairobi every morning and never kept us waiting."},
  {"name":"Vincent Kirui","location":"Kiamunyi, Nakuru","rating":5,"service":"Materials Supply","date":"Jun 2025","text":"I ordered boards, hinges and runners for a three-bedroom rental in Kiamunyi. Delivered on the second day, well packed, and the prices beat the local hardware shops."},
  {"name":"Mercy Wanjala","location":"Kamere, Naivasha","rating":5,"service":"Wardrobes","date":"Jul 2025","text":"Two sliding wardrobes for our home in Kamere. The mirrors are perfect and the doors glide smoothly even on our slightly uneven floor."},
  {"name":"Daniel Mwangi","location":"Moi South Lake Road, Naivasha","rating":5,"service":"Gypsum Works","date":"Sep 2025","text":"They did a gypsum ceiling with cove lighting for our guest house near the lake. Guests mention it in their reviews now, which says it all."},
  {"name":"Grace Nyambura","location":"Matasia, Ngong","rating":5,"service":"Wardrobes","date":"Aug 2025","text":"A combined wardrobe and study unit for my son’s room in Matasia. Clever use of the corner and excellent finishing on the desk."},
  {"name":"Julius Saitoti","location":"Oloolua, Ngong","rating":5,"service":"Shop Renovation","date":"Oct 2025","text":"Renovated my shop in Oloolua with new shelving, counter and ceiling lighting. They worked at night in the last week so I never closed."},
  {"name":"Sarah Chelangat","location":"Naivasha Town, Nakuru County","rating":5,"service":"Wardrobes","date":"Sep 2025","text":"Fitted wardrobe delivered to Naivasha and installed in a single day. No scratches, no missing parts."},
  {"name":"Mark Kipchumba","location":"Milimani, Nakuru","rating":5,"service":"Kitchen Cabinets","date":"Sep 2025","text":"A modern kitchen for our Nakuru home. The team travelled from Nairobi and still delivered on schedule."},
  {"name":"Josephine Mwende","location":"Section 58, Nakuru","rating":5,"service":"Materials Supply","date":"Aug 2025","text":"Handles, hinges and runners for a twelve-unit rental project in Nakuru. Very good bulk pricing."},
  {"name":"Hellen Atieno","location":"Kihoto, Naivasha","rating":5,"service":"Aluminium Works","date":"Aug 2025","text":"Aluminium windows for our farm house near Naivasha. Strong frames, well sealed and no leaks in the rains."},
  {"name":"Nicholas Mutiso","location":"Gate C, Juja","rating":5,"service":"Materials Supply","date":"Aug 2025","text":"Wardrobe fittings and sliding rails for a client project. The quality of the rollers is clearly better than what I used before."},
  {"name":"Diana Wangui","location":"Kimbo, Ruiru","rating":5,"service":"Kitchen Cabinets","date":"Jul 2025","text":"A small apartment kitchen with big quality. They maximised every centimetre of space."},
  {"name":"Fredrick Waweru","location":"Kiganjo, Thika","rating":5,"service":"Gypsum Works","date":"Jul 2025","text":"Gypsum ceiling with hidden lighting for our shop in Kiganjo. Customers notice it the moment they walk in."},
  {"name":"Caroline Nasimiyu","location":"Kibiko, Ngong","rating":5,"service":"Shop Renovation","date":"Jul 2025","text":"Boutique fit-out in Ngong. The fluted panels and display shelving look very premium."},
  {"name":"Solomon Chege","location":"Nairobi CBD","rating":5,"service":"Materials Supply","date":"Jun 2025","text":"They supply boards and hardware for my workshop in CBD. Reliable and consistent stock every time."},
  {"name":"Kelvin Mugo","location":"Kahawa Sukari, Nairobi","rating":5,"service":"Shop Renovation","date":"Apr 2025","text":"Barbershop renovation: mirrors, counter, ceiling and lighting. We opened on schedule."},
  {"name":"Rehema Abdalla","location":"Nyali, Mombasa","rating":5,"service":"Materials Supply","date":"Apr 2025","text":"They shipped materials to Mombasa for our project. Well packed and nothing arrived damaged."},
  {"name":"Alice Wangui","location":"JKUAT, Juja","rating":5,"service":"Materials Supply","date":"Sep 2025","text":"I run a small workshop near JKUAT and they supply boards and edge tape weekly. Always the same quality, always on time."},
  {"name":"Boniface Kimani","location":"Highpoint, Juja","rating":5,"service":"Aluminium Works","date":"Nov 2025","text":"Aluminium windows and a sliding door for our house in Highpoint Juja. Sealed properly — we had no leaks at all in the long rains."},
  {"name":"Nancy Wambui","location":"Kamakis, Ruiru","rating":5,"service":"Kitchen Cabinets","date":"Oct 2025","text":"Kitchen cabinets for our Kamakis home with a pantry and a small island. Fair price, and they cleaned up every single evening."},
  {"name":"Charles Ngugi","location":"Eastern Bypass, Ruiru","rating":5,"service":"Shop Renovation","date":"Dec 2025","text":"Shop fit-out near the Eastern Bypass: shelving, glass counter and lighting. Open for business in three weeks as promised."},
  {"name":"Ruth Mumbi","location":"Section 9, Thika","rating":5,"service":"Fittings","date":"Aug 2025","text":"All the fittings for our new house in Section 9 Thika — doors, locks, taps and sinks. Supplied and installed in four days."},
  {"name":"Patrick Muiruri","location":"Ngoingwa, Thika","rating":5,"service":"Gypsum Works","date":"Nov 2025","text":"Gypsum ceilings in the sitting room and all bedrooms at Ngoingwa. The cornice lines are perfectly straight, which is rare."}
];

/* --------------------------------------------------------------- SERVICE AREAS */
const AREAS = [
  'Kilimani', 'Lavington', 'Westlands', 'Karen', 'Runda', 'Kileleshwa', 'Parklands', 'South B', 'South C',
  'Buruburu', 'Donholm', 'Umoja', 'Embakasi', 'Roysambu', 'Kasarani', 'Githurai', 'Zimmerman', 'Kahawa',
  'Lang\u2019ata', 'Utawala', 'Komarock', 'Pipeline', 'Ngara', 'Muthaiga', 'Ruaka', 'Kikuyu', 'Rongai',
  'Kitengela', 'Syokimau', 'Athi River', 'Kiambu', 'Limuru', 'Juja', 'Ruiru', 'Thika', 'Ngong', 'Naivasha',
  'Nakuru', 'Gilgil', 'Machakos', 'Nyeri', 'Mombasa', 'Kisumu', 'Eldoret', 'Kajiado', 'Narok', 'Kericho'
];

/* -------------------------------------------------------------------- FAQS */
const FAQS = [
  { q: 'How do you quote a kitchen?', a: 'Every kitchen starts with a site measurement. You then receive an itemised written quotation covering carcasses, doors, worktops and fittings — the figure depends on the length of your kitchen run, the worktop you choose and the internals. No commitment until you approve it.' },
  { q: 'Do you supply materials to my own fundi?', a: 'Yes. We supply MDF, laminate, gypsum, aluminium, tiles, hardware and fittings, with delivery to your site anywhere in Kenya. You can also hire our installation team if you prefer.' },
  { q: 'How do site visits and measurements work?', a: 'Our technician visits your site, measures precisely and checks the space before we quote. Within Nairobi and the surrounding areas such as Ruiru, Juja, Ngong and Kiambu visits are arranged at short notice. For Nakuru, Naivasha, Thika and other counties we charge a small transport fee that is deducted from your project once you award us the work.' },
  { q: 'How long does a project take?', a: 'Wardrobes normally take 7–14 days, kitchens 2–4 weeks, gypsum ceilings 3–9 days and full shop renovations 3–6 weeks from the day materials are approved. We agree the timeline in writing before starting.' },
  { q: 'How do payments work?', a: 'We work on a clear milestone basis: a deposit to buy materials and start fabrication, then progressive payments as agreed in your contract. Every payment is receipted and itemised.' },
  { q: 'Do you serve areas outside Nairobi?', a: 'Yes — we serve all parts of Kenya. We regularly complete projects in Nakuru, Naivasha, Ngong, Juja, Ruiru, Thika, Machakos, Kajiado, Eldoret and Mombasa. Distance affects transport cost only, never the quality.' }
];

/* --------------------------------------------------------- NAV / PAGE HELPERS */

/* ------------------------------------------------------ CATEGORIES (FILTERS)
   The chips above the Designs, Materials and Services grids. They live in the
   `categories` table in Supabase and are fully editable from the admin bar →
   "Categories" (add · rename · reorder · hide · delete). This object is the
   built-in fallback used before the database answers, and the shape is:
   { design: [], material: [], service: [] }.
   `hidden: true` keeps a category out of the visitor-facing filter bar.      */
const CATEGORIES = {
  design: [
    { name: 'Kitchen Cabinets' },
    { name: 'Wardrobes' },
    { name: 'Aluminium Works' },
    { name: 'Gypsum Works' },
    { name: 'Shop Renovation' },
    { name: 'Fittings' }
  ],
  material: [
    { name: 'Boards & Panels' },
    { name: 'Hardware & Fittings' },
    { name: 'Gypsum & Ceilings' },
    { name: 'Aluminium' },
    { name: 'Tiles & Finishes' },
    { name: 'Countertops' },
    { name: 'Lighting' }
  ],
  service: [
    { name: 'Kitchen Cabinets' },
    { name: 'Wardrobes' },
    { name: 'Aluminium Works' },
    { name: 'Gypsum Works' },
    { name: 'Shop Renovation' },
    { name: 'Fittings' }
  ]
};

const categoryNames = (kind) => (CATEGORIES[kind] || []).map((c) => c.name);

/* legacy names, still used by a few pages/components */
const DESIGN_CATEGORIES = ['All'].concat(categoryNames('design'));
const MATERIAL_CATEGORIES = ['All'].concat(categoryNames('material'));
const SERVICE_CATEGORIES = ['All'].concat(categoryNames('service'));

/* ------------------------------------------------- HOMEPAGE SLIDESHOW (HERO)
   The hero frame no longer has its own list of pictures: it rotates the
   DESIGNS below that are ticked as `featured: true` (admin bar → Slideshow, or
   the ★ button on any design card). A design's photo — including whatever was
   uploaded to replace it — is what appears in the slideshow, so the two are
   never out of step. If nothing is ticked, the first five designs are used.  */
const heroDesigns = (list) => {
  const items = (list || []).filter((d) => d && d.image);
  const featured = items.filter((d) => d.featured === true);
  return featured.length ? featured : items.slice(0, 5);
};
