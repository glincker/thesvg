import type { ComponentType } from "react";
import { Cloud, ShieldCheck, Shapes, Users } from "lucide-react";

/**
 * Single source of truth for collection metadata. Every collection that
 * exists in `src/data/icons.json` (see `getCollections()` in `src/lib/icons.ts`)
 * must have an entry here. Previously this metadata was duplicated across
 * `sidebar.tsx`, `collection/[name]/page.tsx`, `home-hero.tsx`, and
 * `header.tsx` - the four copies drifted out of sync with each other and
 * with the real data, which is how the "community" collection ended up
 * missing from the static-page allowlist and 404ing in production.
 *
 * Add a new collection by adding one entry here; every consumer (sidebar,
 * collection pages, hero carousel, header) picks it up automatically.
 */
export const COLLECTION_IDS = ["brands", "aws", "azure", "gcp", "k8s", "community", "auth-badges"] as const;

export type CollectionId = (typeof COLLECTION_IDS)[number];

export interface CollectionMeta {
  id: CollectionId;
  /** Label used in the sidebar and hero carousel tabs. */
  label: string;
  /** Compact 1-2 word label for tight nav chrome (header collection switcher). */
  shortLabel: string;
  /** Lucide icon component used to represent the collection in UI chrome. */
  icon: ComponentType<{ className?: string }>;
  /** Tailwind text-color class applied to the icon when active/selected. */
  color: string;
  /** `<title>` for the collection's static page. */
  pageTitle: string;
  /** Meta/OG description for the collection's static page. */
  pageDescription: string;
  /** SEO keywords for the collection's static page. */
  pageKeywords: string[];
  /** Label shown in the home hero carousel's collection tabs. */
  heroLabel: string;
  /** Short description shown alongside the hero carousel tab. */
  heroDescription: string;
}

export const COLLECTIONS_META: Record<CollectionId, CollectionMeta> = {
  brands: {
    id: "brands",
    label: "Brand Icons",
    shortLabel: "Brands",
    icon: Shapes,
    color: "text-orange-500",
    pageTitle: "Brand SVG Icons - Free Logo Download",
    pageDescription:
      "Browse and download 4,675 brand SVG icons. GitHub, Stripe, Vercel, Docker, React, and thousands more. Multiple variants: color, mono, dark, light, wordmark.",
    pageKeywords: [
      "brand icons",
      "brand SVG",
      "logo SVG",
      "brand logos",
      "free logo download",
      "SVG icons",
      "developer icons",
    ],
    heroLabel: "Brand Icons",
    heroDescription: "Logos and brand marks",
  },
  aws: {
    id: "aws",
    label: "AWS Architecture",
    shortLabel: "AWS",
    icon: Cloud,
    color: "text-[#ff9900]",
    pageTitle: "AWS Architecture Icons - Free SVG Download",
    pageDescription:
      "Browse and download 739 official AWS Architecture SVG icons. Lambda, EC2, S3, RDS, DynamoDB, and all AWS services. Free for developers. Copy as SVG, JSX, React component, or CDN link.",
    pageKeywords: [
      "AWS icons",
      "AWS architecture icons",
      "AWS SVG",
      "AWS Lambda icon",
      "Amazon EC2 icon",
      "AWS service icons",
      "cloud architecture icons",
      "AWS diagram icons",
    ],
    heroLabel: "AWS Architecture",
    heroDescription: "AWS service and resource icons (2026-Q1)",
  },
  azure: {
    id: "azure",
    label: "Azure Services",
    shortLabel: "Azure",
    icon: Cloud,
    color: "text-[#0078d4]",
    pageTitle: "Microsoft Azure Icons - Free SVG Download",
    pageDescription:
      "Browse and download 626 official Microsoft Azure service SVG icons. Virtual Machines, App Services, Azure SQL, Cosmos DB, and all Azure services. Free for developers.",
    pageKeywords: [
      "Azure icons",
      "Microsoft Azure icons",
      "Azure SVG",
      "Azure service icons",
      "Azure architecture icons",
      "cloud icons",
      "Azure VM icon",
      "Azure Functions icon",
    ],
    heroLabel: "Azure Services",
    heroDescription: "Microsoft Azure service icons (2026-Q1)",
  },
  gcp: {
    id: "gcp",
    label: "Google Cloud",
    shortLabel: "GCP",
    icon: Cloud,
    color: "text-[#4285f4]",
    pageTitle: "Google Cloud Platform Icons - Free SVG Download",
    pageDescription:
      "Browse and download 214 Google Cloud Platform SVG icons. Compute Engine, BigQuery, Cloud Run, GKE, and all GCP services. Free for developers.",
    pageKeywords: [
      "GCP icons",
      "Google Cloud icons",
      "GCP SVG",
      "Google Cloud Platform icons",
      "BigQuery icon",
      "Cloud Run icon",
      "GKE icon",
      "cloud architecture icons",
    ],
    heroLabel: "Google Cloud",
    heroDescription: "Google Cloud Platform icons (2026-Q1)",
  },
  k8s: {
    id: "k8s",
    label: "Kubernetes",
    shortLabel: "K8s",
    icon: Cloud,
    color: "text-[#326ce5]",
    pageTitle: "Kubernetes Icons - Free SVG Download",
    pageDescription:
      "Browse and download 38 official Kubernetes architecture SVG icons. Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, and the full CNCF Kubernetes icon set. Apache 2.0.",
    pageKeywords: [
      "Kubernetes icons",
      "K8s icons",
      "Kubernetes SVG",
      "Pod icon",
      "Deployment icon",
      "Service icon",
      "Ingress icon",
      "CNCF icons",
      "cloud native icons",
    ],
    heroLabel: "Kubernetes",
    heroDescription: "Official Kubernetes architecture icons",
  },
  community: {
    id: "community",
    label: "Community",
    shortLabel: "Community",
    icon: Users,
    color: "text-teal-500",
    pageTitle: "Community SVG Icons - Free Download",
    pageDescription:
      "Browse and download 256 community-contributed SVG icons. Dev tools, databases, frameworks, and platforms sourced from the open-source community. Free for developers.",
    pageKeywords: [
      "community icons",
      "dev tool icons",
      "open source icons",
      "community SVG",
      "developer tool logos",
      "database icons",
      "framework icons",
      "SVG icon library",
    ],
    heroLabel: "Community",
    heroDescription: "Dev tools, databases, and frameworks from the community",
  },
  "auth-badges": {
    id: "auth-badges",
    label: "Auth Badges",
    shortLabel: "Auth",
    icon: ShieldCheck,
    color: "text-emerald-500",
    pageTitle: "Auth Badge Icons - Free 2FA Service SVG Download",
    pageDescription:
      "Browse and download 858 circular auth badge SVG icons for two-factor authentication apps and account security UIs. Covers exchanges, VPNs, hosting providers, games, and more. CC0, free for developers.",
    pageKeywords: [
      "auth badges",
      "2FA icons",
      "two-factor authentication icons",
      "authenticator app icons",
      "security badge SVG",
      "account icons",
      "service badge icons",
      "CC0 icons",
    ],
    heroLabel: "Auth Badges",
    heroDescription: "Circular service badges for 2FA and account security UIs",
  },
};

/** All collection metadata entries, in canonical display order. */
export const COLLECTIONS_LIST: CollectionMeta[] = COLLECTION_IDS.map((id) => COLLECTIONS_META[id]);

export function getCollectionMeta(id: string): CollectionMeta | undefined {
  return isValidCollectionId(id) ? COLLECTIONS_META[id] : undefined;
}

export function isValidCollectionId(id: string): id is CollectionId {
  return (COLLECTION_IDS as readonly string[]).includes(id);
}
