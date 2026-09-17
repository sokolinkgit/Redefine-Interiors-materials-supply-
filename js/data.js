/* ==========================================================================
   REDEFINE INTERIORS & MATERIALS SUPPLY — CONTENT DATA
   Pure data layer. All prices are indicative "from" rates in Kenya Shillings.
   ========================================================================== */

const BUSINESS = {
  name: 'Redefine Interiors & Materials Supply',
  shortName: 'Redefine Interiors',
  tagline: 'Interiors, fittings & materials — done right.',
  phonePrimary: '0751 261 032',
  phonePrimaryDial: '+254751261032',
  waPrimary: '254751261032',
  phoneSecondary: '+254 703 142874',
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
    title: 'Modern L-Shaped Kitchen Cabinets',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-lshape.jpg',
    price: 185000,
    priceNote: 'from',
    badge: 'Best seller',
    time: '2 – 3 weeks',
    summary: 'Matte graphite cabinets with a warm walnut worktop, soft-close everything and a fully fitted corner unit that uses every centimetre of your kitchen.',
    features: ['18mm moisture-resistant MDF carcass', 'Soft-close hinges & drawer runners', 'Solid wood / quartz worktop', 'Designated appliance & bin housings'],
    materials: ['18mm MDF', 'Melamine laminate', 'Soft-close hardware']
  },
  {
    id: 'd02',
    title: 'White Gloss Kitchen & Breakfast Bar',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-white-gloss.jpg',
    price: 235000,
    priceNote: 'from',
    badge: 'Showroom finish',
    time: '3 weeks',
    summary: 'Handleless high-gloss doors, charcoal quartz tops and a slim breakfast bar — a bright, easy-clean kitchen that suits modern Nairobi apartments.',
    features: ['Handleless push-to-open doors', 'Quartz or granite worktop', 'Glass splashback option', 'Breakfast bar with seating'],
    materials: ['High-gloss acrylic', 'Quartz tops', 'Brass tap set']
  },
  {
    id: 'd03',
    title: 'U-Shaped Family Kitchen + Pantry',
    category: 'Kitchen Cabinets',
    image: 'assets/img/d-kitchen-ushape.jpg',
    price: 320000,
    priceNote: 'from',
    badge: '',
    time: '3 – 4 weeks',
    summary: 'A full family kitchen with a tall pantry, double oven housing and a generous island — designed for large households and serious cooking.',
    features: ['Tall pantry & larder units', 'Island with rails & pendant lighting', 'Built-in oven & microwave housing', 'Pull-out baskets and corner carousel'],
    materials: ['Shaker doors', 'Oak worktops', 'Pull-out baskets']
  },
  {
    id: 'd04',
    title: '4-Door Sliding Mirror Wardrobe',
    category: 'Wardrobes',
    image: 'assets/img/d-wardrobe-sliding.jpg',
    price: 96000,
    priceNote: 'from',
    badge: 'Best value',
    time: '7 – 10 days',
    summary: 'Two mirror doors, two veneer doors and internal fittings that actually make sense — hanging rails, shelves, shoe rack and a lockable drawer.',
    features: ['Soft-close sliding system', 'Full-length mirror doors', 'Interior LED downlighting', 'Drawers, shelves & shoe rack'],
    materials: ['18mm MDF', 'Veneer / laminate', 'Sliding rails & rollers']
  },
  {
    id: 'd05',
    title: 'Luxury Walk-In Closet',
    category: 'Wardrobes',
    image: 'assets/img/d-walkin-closet.jpg',
    price: 210000,
    priceNote: 'from',
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
    price: 118000,
    priceNote: 'from',
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
    price: 9500,
    priceNote: 'from',
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
    price: 3200,
    priceNote: 'from',
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
    price: 380000,
    priceNote: 'from',
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
    price: 750000,
    priceNote: 'from',
    badge: 'Save 12%',
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
    name: '18mm MDF Board',
    category: 'Boards & Panels',
    swatch: 'mdf', icon: 'box',
    price: 3200,
    unit: 'per 8×4ft sheet',
    badge: 'In stock',
    note: 'Moisture-resistant grade for kitchens and bathrooms. Bulk discounts from 10 sheets.'
  },
  {
    id: 'm02',
    name: 'Melamine Laminate Sheet',
    category: 'Boards & Panels',
    swatch: 'laminate', icon: 'palette',
    price: 4600,
    unit: 'per 8×4ft sheet',
    badge: '40+ colours',
    note: 'Woodgrains, marbles and plain colours. Matching edge tape available.'
  },
  {
    id: 'm03',
    name: 'Cabinet Hardware Kit',
    category: 'Hardware & Fittings',
    swatch: 'hardware', icon: 'wrench',
    price: 4950,
    unit: 'per kit',
    badge: 'Soft-close',
    note: '20 soft-close hinges, 5 pairs of drawer runners, screws and buffers.'
  },
  {
    id: 'm04',
    name: 'Kitchen Sink & Pull-Out Tap Set',
    category: 'Hardware & Fittings',
    swatch: 'steel', icon: 'wrench',
    price: 12800,
    unit: 'per set',
    badge: '304 stainless',
    note: 'Undercut double bowl sink with pull-out mixer, waste kit and fittings.'
  },
  {
    id: 'm05',
    name: 'Gypsum Ceiling Board',
    category: 'Gypsum & Ceilings',
    swatch: 'gypsum', icon: 'layers',
    price: 950,
    unit: 'per 1.2×2.4m board',
    badge: '9mm',
    note: 'Ceiling-grade boards. Studs, channels, joint tape and skim also available.'
  },
  {
    id: 'm06',
    name: 'Aluminium Window & Door Profiles',
    category: 'Aluminium',
    swatch: 'aluminium', icon: 'window',
    price: 780,
    unit: 'per kg',
    badge: 'Anodised',
    note: 'Silver, black and bronze finishes. Cut-to-size and fabrication on request.'
  },
  {
    id: 'm07',
    name: 'Porcelain Floor Tile 600×600',
    category: 'Tiles & Finishes',
    swatch: 'tile', icon: 'palette',
    price: 1450,
    unit: 'per sqm',
    badge: 'Matt / gloss',
    note: 'Lappato, marble-look and wood-look ranges. Free samples on request.'
  },
  {
    id: 'm08',
    name: 'Fluted WPC Wall Panel',
    category: 'Tiles & Finishes',
    swatch: 'fluted', icon: 'layers2',
    price: 2600,
    unit: 'per panel (300×2900mm)',
    badge: 'Waterproof',
    note: 'Popular for TV walls, shop fronts and reception areas. Trims available.'
  },
  {
    id: 'm09',
    name: 'Quartz Countertop Slab',
    category: 'Countertops',
    swatch: 'quartz', icon: 'spark',
    price: 14500,
    unit: 'per sqm fitted',
    badge: '20mm',
    note: 'Marble-look quartz with cut-outs, joins and edge profiling included.'
  },
  {
    id: 'm10',
    name: 'LED Spotlight & Cove Strip Pack',
    category: 'Lighting',
    swatch: 'led', icon: 'bulb',
    price: 3400,
    unit: 'per pack',
    badge: 'Warm / cool',
    note: '6 recessed spotlights plus 5m of cove strip with driver and connectors.'
  }
];

/* Extra price-list rows (materials page table, no photography needed) */
const PRICE_LIST = [
  { name: 'Gypsum metal studs & channels', unit: 'per length', price: 480, category: 'Gypsum & Ceilings' },
  { name: 'Ceiling cornice moulding', unit: 'per 3m length', price: 750, category: 'Gypsum & Ceilings' },
  { name: 'Tile adhesive', unit: 'per 20kg bag', price: 900, category: 'Tiles & Finishes' },
  { name: 'Cabinet handles & knobs', unit: 'per dozen', price: 2200, category: 'Hardware & Fittings' },
  { name: 'Washable wall emulsion paint', unit: 'per 20L bucket', price: 6400, category: 'Tiles & Finishes' },
  { name: 'Aluminium sliding door track set', unit: 'per set', price: 5900, category: 'Aluminium' }
];

/* --------------------------------------------------------- SERVICES (6 CORE) */
const SERVICES = [
  {
    slug: 'kitchen-cabinets',
    title: 'Kitchen Cabinets',
    icon: 'kitchen',
    from: 185000,
    text: 'Bespoke kitchens — carcasses, doors, worktops, sinks and appliance housing, built to your exact measurements.'
  },
  {
    slug: 'wardrobes',
    title: 'Wardrobes & Closets',
    icon: 'wardrobe',
    from: 96000,
    text: 'Sliding, hinged, walk-in and combined wardrobe-plus-desk units with fittings that last.'
  },
  {
    slug: 'aluminium-works',
    title: 'Aluminium Works',
    icon: 'aluminium',
    from: 9500,
    text: 'Windows, sliding doors, shop fronts, glass partitions, balustrades and burglar proofing.'
  },
  {
    slug: 'gypsum-works',
    title: 'Gypsum Works',
    icon: 'gypsum',
    from: 3200,
    text: 'Ceilings, cove lighting, cornices, partitions, TV feature walls and decorative curves.'
  },
  {
    slug: 'shop-renovation',
    title: 'Shop Renovation',
    icon: 'shop',
    from: 380000,
    text: 'Retail, salon, barbershop, clinic and office fit-outs — shelving, counters, lighting and branding surfaces.'
  },
  {
    slug: 'fittings',
    title: 'All Fittings Work',
    icon: 'fittings',
    from: 4500,
    text: 'Doors, locks, handles, hinges, sinks, taps, sanitary ware, lighting and finishing — supplied and installed.'
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
  {"name":"Anthony Njoroge","location":"Roysambu, Nairobi","rating":5,"service":"Wardrobes","date":"Mar 2026","text":"Walk-in closet for under KES 200,000 and it genuinely looks like a hotel. I highly recommend them."},
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
  { q: 'How much does a kitchen cost in Kenya?', a: 'Our kitchen cabinet packages start from about KES 185,000 including carcasses, doors, worktops and fittings. The final figure depends on the length of your kitchen run, the worktop you choose and the internals — we give an itemised quotation after a free site measurement.' },
  { q: 'Do you supply materials to my own fundi?', a: 'Yes. We supply MDF, laminate, gypsum, aluminium, tiles, hardware and fittings at affordable wholesale-friendly prices, with delivery to your site anywhere in Kenya. You can also hire our installation team if you prefer.' },
  { q: 'Is the site visit and measurement free?', a: 'Site visits and measurements are free within Nairobi and the surrounding areas such as Ruiru, Juja, Ngong and Kiambu. For Nakuru, Naivasha, Thika and other counties we charge a small transport fee that is deducted from your project once you award us the work.' },
  { q: 'How long does a project take?', a: 'Wardrobes normally take 7–14 days, kitchens 2–4 weeks, gypsum ceilings 3–9 days and full shop renovations 3–6 weeks from the day materials are approved. We agree the timeline in writing before starting.' },
  { q: 'How do payments work?', a: 'We work on a clear milestone basis: a deposit to buy materials and start fabrication, then progressive payments as agreed in your contract. Every payment is receipted and itemised.' },
  { q: 'Do you serve areas outside Nairobi?', a: 'Yes — we serve all parts of Kenya. We regularly complete projects in Nakuru, Naivasha, Ngong, Juja, Ruiru, Thika, Machakos, Kajiado, Eldoret and Mombasa. Distance affects transport cost only, never the quality.' }
];

/* --------------------------------------------------------- NAV / PAGE HELPERS */
const DESIGN_CATEGORIES = ['All', 'Kitchen Cabinets', 'Wardrobes', 'Aluminium Works', 'Gypsum Works', 'Shop Renovation', 'Fittings'];
const MATERIAL_CATEGORIES = ['All', 'Boards & Panels', 'Hardware & Fittings', 'Gypsum & Ceilings', 'Aluminium', 'Tiles & Finishes', 'Countertops', 'Lighting'];
