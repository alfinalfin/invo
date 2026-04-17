import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

import type { LeadPriority, LeadRecord, LeadSource, LeadStatus } from "./crm";

type UnknownRecord = Record<string, unknown>;

const statusAliases: Array<{ match: string[]; value: LeadStatus }> = [
  { match: ["new", "fresh", "open"], value: "New" },
  { match: ["contacted", "contact", "followed up"], value: "Contacted" },
  { match: ["in progress", "progress"], value: "In progress" as LeadStatus },
  { match: ["pending", "quote sent", "waiting", "follow up"], value: "Pending" },
  { match: ["converted", "won", "booked", "confirmed"], value: "Converted" },
  { match: ["closed", "lost", "cancelled", "canceled"], value: "Closed" },
];

const sourceAliases: Array<{ match: string[]; value: LeadSource }> = [
  { match: ["website", "web", "form", "landing"], value: "Website" },
  { match: ["whatsapp", "wa"], value: "WhatsApp" },
  { match: ["referral", "reference", "word of mouth"], value: "Referral" },
  { match: ["google", "ads", "adwords", "meta"], value: "Google Ads" },
  { match: ["field", "sales", "offline"], value: "Field Sales" },
  { match: ["lead engine", "scraper", "search", "linkedin", "local pack"], value: "Lead Engine" },
];

const priorityAliases: Array<{ match: string[]; value: LeadPriority }> = [
  { match: ["urgent", "critical", "immediate"], value: "Urgent" },
  { match: ["high", "priority"], value: "High priority" },
  { match: ["warm", "interested"], value: "Warm" },
  { match: ["follow", "later", "nurture"], value: "Follow-up" },
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValue(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    if (key in record && record[key] != null) {
      return record[key];
    }
  }

  return undefined;
}

function pickString(record: UnknownRecord, keys: string[], fallback = "") {
  const value = getValue(record, keys);

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function pickNumber(record: UnknownRecord, keys: string[], fallback = 0) {
  const value = getValue(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function pickStringArray(record: UnknownRecord, keys: string[]) {
  const value = getValue(record, keys);

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function toIsoDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  if (typeof value === "number") {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
    return new Date(milliseconds).toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000).toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof value._seconds === "number"
  ) {
    return new Date(value._seconds * 1000).toISOString();
  }

  return new Date().toISOString();
}

function normalizeStatus(value: unknown): LeadStatus {
  if (typeof value !== "string") {
    return "New";
  }

  const normalized = value.trim().toLowerCase();

  for (const alias of statusAliases) {
    if (alias.match.some((entry) => normalized.includes(entry))) {
      return alias.value;
    }
  }

  return "New";
}

function normalizeSource(value: unknown): LeadSource {
  if (typeof value !== "string") {
    return "Website";
  }

  const normalized = value.trim().toLowerCase();

  for (const alias of sourceAliases) {
    if (alias.match.some((entry) => normalized.includes(entry))) {
      return alias.value;
    }
  }

  return "Website";
}

function normalizePriority(record: UnknownRecord): LeadPriority {
  const explicit = getValue(record, ["priority", "leadPriority", "urgency"]);

  if (typeof explicit === "string") {
    const normalized = explicit.trim().toLowerCase();

    for (const alias of priorityAliases) {
      if (alias.match.some((entry) => normalized.includes(entry))) {
        return alias.value;
      }
    }
  }

  if (record.urgent === true) {
    return "Urgent";
  }

  return "Warm";
}

function looksLikeLeadRecord(record: UnknownRecord) {
  return [
    "name",
    "phone",
    "mobile",
    "email",
    "pickup",
    "pickupAddress",
    "delivery",
    "deliveryAddress",
    "createdAt",
    "timestamp",
  ].some((key) => key in record);
}

function normalizeRouteLabel(record: UnknownRecord, pickupAddress: string, deliveryAddress: string) {
  const explicit = pickString(record, ["routeLabel", "route", "lane"]);

  if (explicit) {
    return explicit;
  }

  if (pickupAddress && deliveryAddress) {
    return `${pickupAddress} to ${deliveryAddress}`;
  }

  return "Pending route";
}

export function normalizeLeadRecord(id: string, rawValue: unknown): LeadRecord | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const pickupAddress = pickString(rawValue, [
    "pickupPostcode",
    "pickupAddress",
    "pickup",
    "pickup_location",
    "pickupLocation",
    "from",
    "origin",
  ], "Pending");
  const deliveryAddress = pickString(rawValue, [
    "deliveryPostcode",
    "deliveryAddress",
    "delivery",
    "drop",
    "dropoff",
    "destination",
    "to",
  ], "Pending");
  const status = normalizeStatus(
    getValue(rawValue, ["status", "leadStatus", "stage"]),
  );
  const message = pickString(rawValue, [
    "message",
    "request",
    "details",
    "description",
    "requirements",
    "customerNotes"
  ], "New logistics quote request");

  return {
    id,
    name: pickString(rawValue, ["name", "fullName", "customerName"], "Unknown Lead"),
    company: pickString(rawValue, ["company", "businessName", "organization"], "Invoaura Inquiry"),
    phone: pickString(rawValue, ["phone", "mobile", "phoneNumber", "whatsapp"], ""),
    email: pickString(rawValue, ["email", "mail"], ""),
    pickupAddress,
    deliveryAddress,
    routeLabel: normalizeRouteLabel(rawValue, pickupAddress, deliveryAddress),
    status,
    source: normalizeSource(getValue(rawValue, ["source", "leadSource", "channel"])),
    priority: normalizePriority(rawValue),
    tags: pickStringArray(rawValue, ["tags", "labels"]),
    notes: pickString(rawValue, ["adminNotes", "internalNotes", "admin_notes"], ""),
    goodsDescription: pickString(rawValue, ["goodsDescription", "Goods Description", "goods_description", "goods"], ""),
    weightDimensions: pickString(rawValue, ["weightDimensions", "Weight / Dimensions", "weight_dimensions", "weight"], ""),
    collectionTime: pickString(rawValue, ["collectionTime", "Collection Time", "collection_time"], ""),
    vehicleType: pickString(rawValue, ["vehicle", "Vehicle Type", "vehicleType", "vehicle_type"], ""),
    customerNotes: pickString(rawValue, ["notes", "Notes", "customerNotes", "customer_notes"], ""),
    message,
    assignedTo: pickString(rawValue, ["assignedTo", "assignee", "owner"], "Ops team"),
    estimatedValue: pickNumber(rawValue, ["estimatedValue", "quote", "amount", "price", "budget"], 0),
    createdAt: toIsoDate(
      getValue(rawValue, ["createdAt", "created_at", "timestamp", "submittedAt", "date"]),
    ),
    lastContactedAt: getValue(rawValue, [
      "lastContactedAt",
      "last_contacted_at",
      "updatedAt",
      "updated_at",
    ])
      ? toIsoDate(
          getValue(rawValue, [
            "lastContactedAt",
            "last_contacted_at",
            "updatedAt",
            "updated_at",
          ]),
        )
      : undefined,
    podDeliveryDate: pickString(rawValue, ["podDeliveryDate"]),
    podDriverName: pickString(rawValue, ["podDriverName"]),
    podVehicleReg: pickString(rawValue, ["podVehicleReg"]),
    podPieces: pickString(rawValue, ["podPieces"]),
    podWeight: pickString(rawValue, ["podWeight"]),
    podDimensions: pickString(rawValue, ["podDimensions"]),
    podGoodsDescription: pickString(rawValue, ["podGoodsDescription"]),
    podNotes: pickString(rawValue, ["podNotes"]),
  };
}

export function mapFirestoreLead(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): LeadRecord {
  return normalizeLeadRecord(snapshot.id, snapshot.data()) ?? {
    id: snapshot.id,
    name: "Unknown Lead",
    company: "Invoaura Inquiry",
    phone: "",
    email: "",
    pickupAddress: "Pending",
    deliveryAddress: "Pending",
    routeLabel: "Pending route",
    status: "New",
    source: "Website",
    priority: "Warm",
    tags: [],
    notes: "",
    message: "This lead record was synced from Firestore.",
    assignedTo: "Ops team",
    estimatedValue: 0,
    createdAt: new Date().toISOString(),
    podDeliveryDate: "",
    podDriverName: "",
    podVehicleReg: "",
    podPieces: "",
    podWeight: "",
    podDimensions: "",
    podGoodsDescription: "",
    podNotes: "",
  };
}

export function mapRealtimeLeads(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry, index) => normalizeLeadRecord(String(index), entry))
      .filter((entry): entry is LeadRecord => Boolean(entry));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (looksLikeLeadRecord(value)) {
    const singleLead = normalizeLeadRecord("root", value);
    return singleLead ? [singleLead] : [];
  }

  return Object.entries(value)
    .map(([key, entry]) => normalizeLeadRecord(key, entry))
    .filter((entry): entry is LeadRecord => Boolean(entry));
}
