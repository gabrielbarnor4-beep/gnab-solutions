export interface CatalogueProduct {
  name: string
  desc: string
}

export interface CatalogueCategory {
  slug: string
  title: string
  shortTitle: string
  intro: string
  products: CatalogueProduct[]
}

export const CATALOGUE: CatalogueCategory[] = [
  {
    slug: 'office-stationery',
    title: 'Office Stationery & Consumables',
    shortTitle: 'Stationery',
    intro:
      'Everything an office consumes daily — sourced in bulk from trusted brands and delivered on schedule so your team never runs out.',
    products: [
      { name: 'A4 Copy Paper', desc: '70–80gsm premium multipurpose reams, boxed in fives.' },
      { name: 'Ballpoint Pens', desc: 'Blue, black and red; smooth-flow boxes of 50.' },
      { name: 'Permanent Markers', desc: 'Chisel and bullet tip, assorted colours.' },
      { name: 'Whiteboard Markers', desc: 'Low-odour dry-erase, assorted pack.' },
      { name: 'Lever-Arch Files', desc: 'A4 foolscap, heavy-duty spine, assorted colours.' },
      { name: 'Sticky Notes', desc: '76×76mm pads in neon and standard shades.' },
      { name: 'Stapler & Staples Set', desc: 'Heavy-duty desktop stapler with 5,000 staples.' },
      { name: 'Envelopes (Peel & Seal)', desc: 'DL and C4 sizes, boxes of 500.' },
      { name: 'Ink & Toner Cartridges', desc: 'Genuine and compatible HP, Canon, Epson, Brother.' },
      { name: 'Spiral Notebooks', desc: 'A4 ruled and plain, packs of 10.' },
      { name: 'Desk Organisers', desc: 'Multi-compartment trays for pens and documents.' },
      { name: 'Sticky Tape & Dispensers', desc: 'Clear tape rolls with weighted desktop dispensers.' },
    ],
  },
  {
    slug: 'it-equipment',
    title: 'IT Equipment & Accessories',
    shortTitle: 'IT Equipment',
    intro:
      'Work-ready technology from trusted global brands — specified to your needs, configured where required, and warrantied.',
    products: [
      { name: 'Business Laptops', desc: 'Core i5/i7 business-grade machines from HP, Dell, Lenovo.' },
      { name: 'Desktop Computers', desc: 'Tower and all-in-one setups for office workstations.' },
      { name: 'Monitors', desc: '21"–27" Full HD and QHD displays with adjustable stands.' },
      { name: 'Printers', desc: 'Laserjet, inkjet and multifunction units for any volume.' },
      { name: 'Scanners', desc: 'Flatbed and document-feed scanners with OCR software.' },
      { name: 'Projectors', desc: 'Boardroom projectors with ceiling-mount options.' },
      { name: 'Networking Equipment', desc: 'Routers, switches, access points and patch panels.' },
      { name: 'Keyboards & Mice', desc: 'Wired and wireless sets, ergonomic options available.' },
      { name: 'External Storage', desc: 'Portable SSDs and HDDs from 500GB to 4TB.' },
      { name: 'UPS Units', desc: 'Line-interactive backup power from 650VA to 3kVA.' },
      { name: 'Webcams & Headsets', desc: 'HD conferencing peripherals for hybrid teams.' },
      { name: 'Cables & Adapters', desc: 'HDMI, USB-C, VGA, Ethernet and power accessories.' },
    ],
  },
  {
    slug: 'cleaning-janitorial',
    title: 'Cleaning & Janitorial Supplies',
    shortTitle: 'Cleaning',
    intro:
      'Professional-grade hygiene supplies that keep offices, schools, hospitals and hospitality spaces spotless and safe.',
    products: [
      { name: 'Disinfectants & Sanitisers', desc: 'Surface disinfectants and hand sanitisers in bulk.' },
      { name: 'Mops, Buckets & Wringer Sets', desc: 'Industrial-grade microfibre systems.' },
      { name: 'Brooms & Brush Sets', desc: 'Hard and soft bristle sets with handles.' },
      { name: 'Waste Bins & Liners', desc: 'Pedal bins, colour-coded liners, outdoor bins.' },
      { name: 'Toilet Paper (Bulk)', desc: 'Jumbo rolls and standard rolls by the carton.' },
      { name: 'Hand Soap & Dispensers', desc: 'Foam and liquid soap with refillable dispensers.' },
      { name: 'Floor Cleaners', desc: 'Concentrated solutions for tile, marble and wood.' },
      { name: 'Glass & Multi-Surface Sprays', desc: 'Streak-free cleaners for daily use.' },
      { name: 'Vacuum Cleaners', desc: 'Commercial upright and backpack vacuums.' },
      { name: 'Air Fresheners', desc: 'Automatic dispensers with refill cartridges.' },
      { name: 'Microfibre Cloths', desc: 'Lint-free cloths in bulk packs.' },
      { name: 'Laundry & Dish Detergents', desc: 'Machine detergents for staff areas and lodgings.' },
    ],
  },
  {
    slug: 'ppe-safety',
    title: 'PPE & Safety Equipment',
    shortTitle: 'PPE & Safety',
    intro:
      'Certified personal protective equipment that meets international standards — protecting your people is non-negotiable.',
    products: [
      { name: 'Safety Helmets', desc: 'EN-certified hard hats in multiple colours.' },
      { name: 'Safety Boots', desc: 'Steel-toe, slip-resistant boots all sizes.' },
      { name: 'Work Gloves', desc: 'Cut-resistant, chemical and general-purpose gloves.' },
      { name: 'Safety Goggles', desc: 'Anti-fog, impact-rated eye protection.' },
      { name: 'High-Visibility Vests', desc: 'Reflective vests with company branding option.' },
      { name: 'Ear Protection', desc: 'Earplugs and earmuffs, NRR-rated.' },
      { name: 'Respiratory Masks', desc: 'N95/FFP2 respirators and half-mask respirators.' },
      { name: 'Coveralls', desc: 'Disposable and reusable protective suits.' },
      { name: 'Safety Harnesses', desc: 'Full-body fall-arrest harnesses with lanyards.' },
      { name: 'First Aid Kits', desc: 'Workplace-compliant kits in wall-mount cases.' },
      { name: 'Face Shields', desc: 'Full-face protection for grinding and lab work.' },
      { name: 'Reflective Traffic Cones', desc: 'Site cones and retractable belt barriers.' },
    ],
  },
  {
    slug: 'office-furniture',
    title: 'Office Furniture',
    shortTitle: 'Furniture',
    intro:
      'Ergonomic, durable furniture that shapes productive workspaces — delivered and assembled anywhere in Ghana.',
    products: [
      { name: 'Executive Desks', desc: 'Premium L-shaped and straight desks in wood finishes.' },
      { name: 'Ergonomic Office Chairs', desc: 'Adjustable lumbar support, mesh and leather options.' },
      { name: 'Staff Workstations', desc: 'Modular clusters for teams of 2–8 with dividers.' },
      { name: 'Filing Cabinets', desc: '2–4 drawer steel cabinets with locking bars.' },
      { name: 'Meeting Room Tables', desc: 'Boardroom tables seating 6–20 with cable ports.' },
      { name: 'Reception Counters', desc: 'Custom-branded front-desk units.' },
      { name: 'Bookshelves & Credenzas', desc: 'Open shelving and storage sideboards.' },
      { name: 'Visitor & Lounge Sofas', desc: 'Reception seating in fabric or leather.' },
      { name: 'Partition Screens', desc: 'Freestanding acoustic desk dividers.' },
      { name: 'Storage Cabinets', desc: 'Tambour and swing-door steel storage.' },
      { name: 'Conference Chairs', desc: 'Stackable and fixed meeting-room seating.' },
      { name: 'Height-Adjustable Desks', desc: 'Sit-stand electric desks for modern offices.' },
    ],
  },
  {
    slug: 'printing-branding',
    title: 'Printing & Branding',
    shortTitle: 'Printing',
    intro:
      'Corporate printing and branding that puts your identity on everything — from a business card to a building fascia.',
    products: [
      { name: 'Business Cards', desc: 'Premium card stock, matte or gloss lamination.' },
      { name: 'Letterheads & Envelopes', desc: 'Branded corporate stationery suites.' },
      { name: 'Brochures & Flyers', desc: 'Bi-fold, tri-fold and flyer runs in full colour.' },
      { name: 'Banners & Billboards', desc: 'Outdoor PVC banners and flex-face billboards.' },
      { name: 'Branded Corporate Gifts', desc: 'Mugs, pens, diaries and hampers with your logo.' },
      { name: 'Corporate Apparel', desc: 'Embroidered and printed polo shirts, overalls, tees.' },
      { name: 'Signage', desc: '3D office signs, directional signage and lightboxes.' },
      { name: 'Labels & Stickers', desc: 'Product labels, seals and die-cut stickers.' },
      { name: 'Branded Calendars', desc: 'Wall and desk calendars for client gifting.' },
      { name: 'Roll-Up Banners', desc: 'Portable pull-up stands for events and lobbies.' },
      { name: 'Vehicle Branding', desc: 'Full and partial vehicle wraps and decals.' },
      { name: 'Rubber Stamps', desc: 'Self-inking company and date stamps.' },
    ],
  },
  {
    slug: 'electrical-materials',
    title: 'Electrical Materials',
    shortTitle: 'Electrical',
    intro:
      'Certified electrical supplies for fit-outs, maintenance and construction — quality components that pass inspection first time.',
    products: [
      { name: 'Cables & Wires', desc: 'Single-core, armoured and flexible cables by the roll.' },
      { name: 'Circuit Breakers', desc: 'MCBs, RCCBs and distribution breakers.' },
      { name: 'LED Bulbs & Tubes', desc: 'Energy-saving lamps in all fittings and wattages.' },
      { name: 'Sockets & Switches', desc: 'UK-standard switched sockets and dimmers.' },
      { name: 'Distribution Boards', desc: 'Consumer units and panel boards fully equipped.' },
      { name: 'Extension Reels & Boards', desc: 'Industrial extension reels with surge protection.' },
      { name: 'Solar Panels & Inverters', desc: 'Backup solar kits for homes and offices.' },
      { name: 'Flood & Security Lights', desc: 'LED floods with PIR motion sensors.' },
      { name: 'Conduits & Trunkings', desc: 'PVC conduits, trunkings and accessories.' },
      { name: 'Generators', desc: 'Standby generators from 5kVA to 100kVA.' },
      { name: 'Street Lights', desc: 'Solar and mains-powered street lighting poles.' },
      { name: 'Electrical Tools', desc: 'Insulated tool kits, testers and multimeters.' },
    ],
  },
  {
    slug: 'custom-sourcing',
    title: 'Custom Procurement & Sourcing',
    shortTitle: 'Custom Sourcing',
    intro:
      'If it exists, we can source it. A sample of what our procurement team has tracked down for clients recently:',
    products: [
      { name: 'Branded Water Bottles', desc: 'Custom stainless bottles for events and staff.' },
      { name: 'School Lab Equipment', desc: 'Science lab kits sourced for private schools.' },
      { name: 'Kitchen Appliances', desc: 'Bulk kettles, microwaves and fridges for staff rooms.' },
      { name: 'Office Plants & Décor', desc: 'Greenery and interior décor sourcing service.' },
      { name: 'Promotional Umbrellas', desc: 'Branded golf umbrellas for campaigns.' },
      { name: 'ID Cards & Lanyards', desc: 'Printed staff IDs with holders and reels.' },
      { name: 'Conference Packs', desc: 'Complete delegate kits for events and workshops.' },
      { name: 'Safety Signage', desc: 'Custom site safety and wayfinding signs.' },
      { name: 'Cleaning Contracts Supplies', desc: 'Monthly consumable bundles for facility managers.' },
      { name: 'IT Disposal Bins', desc: 'Secure e-waste collection solutions.' },
      { name: 'Hospitality Amenities', desc: 'Guest toiletries and room supplies for hotels.' },
      { name: 'Anything Else You Need', desc: 'Send us the specification — consider it sourced.' },
    ],
  },
]

export const catalogueBySlug = (slug: string | null) =>
  CATALOGUE.find((c) => c.slug === slug)

export const TOTAL_PRODUCTS = CATALOGUE.reduce((n, c) => n + c.products.length, 0)
