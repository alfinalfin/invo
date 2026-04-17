export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  note: string;
  featured?: boolean;
};

export type Industry = {
  slug: string;
  title: string;
  blurb: string;
};

export type Vehicle = {
  id: string;
  name: string;
  payload: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const services: Service[] = [
  {
    slug: "same-day-courier",
    title: "Same Day Courier",
    eyebrow: "Rapid Response",
    description:
      "Dedicated collection with urgent dispatch coordination for critical freight, samples, parts, and business documents.",
    note: "Average collection planning starts within 60 minutes.",
    featured: true,
  },
  {
    slug: "next-day-delivery",
    title: "Next Day Delivery",
    eyebrow: "Planned Precision",
    description:
      "Cost-aware, next-day routing designed for scheduled business deliveries that still need transparent updates and proof of delivery.",
    note: "Ideal for repeat lanes and lower-cost shipments.",
  },
  {
    slug: "full-day-hire",
    title: "Full Day Dedicated Hire",
    eyebrow: "Fleet On Demand",
    description:
      "Reserve a vehicle and driver for the full working day when your team needs rolling dispatch support across multiple stops.",
    note: "Built for launches, field teams, and live events.",
  },
  {
    slug: "half-day-hire",
    title: "Half Day Dedicated Hire",
    eyebrow: "Flexible Coverage",
    description:
      "Reliable short-window vehicle hire for peak trading sessions, morning route support, or time-sensitive delivery batches.",
    note: "A premium option for compact route blocks.",
  },
  {
    slug: "import-coordination",
    title: "Import Coordination",
    eyebrow: "Border Flow",
    description:
      "Hand-off support for inbound freight moving from port, hub, or warehouse into your final-mile network without operational drag.",
    note: "Useful for urgent inbound replenishment.",
  },
  {
    slug: "export-movements",
    title: "Export Movements",
    eyebrow: "Outbound Control",
    description:
      "Dedicated transport for outbound consignments heading to airports, depots, consolidation points, and shipping partners.",
    note: "Includes timed collections for cut-off protection.",
    featured: true,
  },
  {
    slug: "multi-drop",
    title: "Multi-Drop Distribution",
    eyebrow: "Network Reach",
    description:
      "Sequenced route planning for same-day or next-day delivery runs across multiple destinations and operating windows.",
    note: "Smart for retail, healthcare, and trade supply runs.",
  },
  {
    slug: "two-person-delivery",
    title: "Two-Person Delivery",
    eyebrow: "Hands-On Handling",
    description:
      "Extra crew support for delicate, bulky, or high-touch consignments that need careful loading, carrying, and placement.",
    note: "Suitable for premium residential or showroom drops.",
  },
  {
    slug: "temperature-controlled",
    title: "Temperature Controlled",
    eyebrow: "Protected Transit",
    description:
      "Time-sensitive transport options for pharmaceutical, food, and specialist cargo that cannot drift outside target conditions.",
    note: "Supports controlled and sensitive goods workflows.",
  },
  {
    slug: "fragile-high-value",
    title: "Fragile & High Value",
    eyebrow: "White-Glove Care",
    description:
      "Security-minded courier cover for prototypes, exhibition pieces, legal records, and high-value retail stock.",
    note: "Handled with direct-driver accountability.",
  },
  {
    slug: "contract-logistics",
    title: "Contract Logistics",
    eyebrow: "Embedded Support",
    description:
      "Ongoing transport partnerships for businesses that need a dedicated logistics layer without building one from scratch.",
    note: "Built for recurring lanes and operational continuity.",
  },
  {
    slug: "warehousing-cross-dock",
    title: "Warehousing & Cross-Dock",
    eyebrow: "Storage Sync",
    description:
      "Short-term holding, consolidation, and cross-docking support to keep inventory moving without bottlenecks.",
    note: "Useful for overflow periods and urgent re-routing.",
  },
];

export const industries: Industry[] = [
  { slug: "retail", title: "Retail", blurb: "Fast replenishment for stores, pop-ups, and flagship launches." },
  { slug: "aviation", title: "Aviation", blurb: "Time-critical movement for ground ops, parts, and support cargo." },
  { slug: "pharma", title: "Pharma", blurb: "Controlled, traceable logistics for sensitive medical products." },
  { slug: "automotive", title: "Automotive", blurb: "Urgent parts supply that protects workshop uptime." },
  { slug: "manufacturing", title: "Manufacturing", blurb: "Component transport that keeps production moving." },
  { slug: "events", title: "Events", blurb: "Dedicated delivery for staging, AV, and exhibition freight." },
  { slug: "healthcare", title: "Healthcare", blurb: "Responsive transport for clinical supplies and equipment." },
  { slug: "construction", title: "Construction", blurb: "Site-bound tools, spares, and materials on tight timelines." },
  { slug: "aerospace", title: "Aerospace", blurb: "Secure movement for specialist engineering components." },
  { slug: "technology", title: "Technology", blurb: "High-value device, server, and hardware distribution." },
  { slug: "print-media", title: "Print & Media", blurb: "Rush movement for campaign materials and print deadlines." },
  { slug: "legal", title: "Legal", blurb: "Confidential courier support for time-sensitive case materials." },
  { slug: "hospitality", title: "Hospitality", blurb: "Rapid supply cover for venues, kitchens, and guest operations." },
  { slug: "public-sector", title: "Public Sector", blurb: "Reliable logistics for civic, education, and service teams." },
  { slug: "ecommerce", title: "E-Commerce", blurb: "Overflow and priority delivery support for online brands." },
  { slug: "fashion", title: "Fashion", blurb: "Launch-ready transport for samples, stock, and showroom edits." },
  { slug: "food-beverage", title: "Food & Beverage", blurb: "Responsive deliveries for ingredients, packaged goods, and events." },
  { slug: "fine-art", title: "Fine Art", blurb: "Special handling for framed, delicate, and valuable works." },
];

export const vehicles: Vehicle[] = [
  {
    id: "small-van",
    name: "Small Van",
    payload: "Up to 400 kg",
    description: "Ideal for documents, samples, cartons, and lightweight urgent freight across urban routes.",
  },
  {
    id: "transit",
    name: "Transit",
    payload: "Up to 1,200 kg",
    description: "Balanced capacity for general business freight, boxed stock, and multi-stop same-day runs.",
  },
  {
    id: "luton",
    name: "Luton",
    payload: "Up to 1,000 kg",
    description: "Box-bodied volume for bulky loads, event equipment, and high-cube retail or trade deliveries.",
  },
  {
    id: "75t",
    name: "7.5T",
    payload: "Up to 2,800 kg",
    description: "Heavier-duty support for palletised freight, oversized cargo, and larger scheduled movements.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Do you provide large vehicles?",
    answer:
      "Yes. We source everything from agile vans to larger dedicated vehicles, depending on payload, dimensions, and delivery urgency.",
  },
  {
    question: "What is your fastest service?",
    answer:
      "Our fastest option is a dedicated same-day response with rapid dispatch planning, live updates, and direct point-to-point movement.",
  },
  {
    question: "How much notice do you need?",
    answer:
      "For urgent jobs, we can usually begin dispatch planning immediately. Larger or specialist vehicles benefit from more notice, especially for time-specific windows.",
  },
  {
    question: "What are your rates?",
    answer:
      "Pricing is tailored to route length, urgency, vehicle type, load profile, and any handling requirements. That keeps quotes accurate instead of generic.",
  },
  {
    question: "Can individuals use your services, or is it for businesses only?",
    answer:
      "Our focus is business logistics, but we can also support private clients when the shipment suits a dedicated courier workflow.",
  },
];

export const placeSuggestions = [
  { postcode: "EC1A 1BB", label: "St Bartholomew's, London EC1A 1BB" },
  { postcode: "W1A 0AX", label: "Broadcast Centre, London W1A 0AX" },
  { postcode: "M1 1AE", label: "Piccadilly, Manchester M1 1AE" },
  { postcode: "B1 1AA", label: "Victoria Square, Birmingham B1 1AA" },
  { postcode: "LS1 4AP", label: "Leeds Station, Leeds LS1 4AP" },
  { postcode: "BS1 4DJ", label: "Harbourside, Bristol BS1 4DJ" },
  { postcode: "SO14 7DU", label: "Dock Gate, Southampton SO14 7DU" },
  { postcode: "CF10 1EP", label: "Central Square, Cardiff CF10 1EP" },
  { postcode: "NG1 5FS", label: "Lace Market, Nottingham NG1 5FS" },
  { postcode: "G1 1XQ", label: "Merchant City, Glasgow G1 1XQ" },
];

export const industryOptions = industries.map((industry) => industry.title);

export const statusItems = [
  "NETWORK: 100% OPERATIONAL",
  "COLLECTION: 60 MIN AVG",
  "DISPATCH: 24/7 UK COVERAGE",
  "PROOF OF DELIVERY: LIVE UPDATES",
];
