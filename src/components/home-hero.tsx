"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Anchor, ArrowRight, Clock, Cloud, Package, Shapes, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import type { Collection, IconEntry } from "@/lib/icons";
import { loadIconsManifest } from "@/lib/icons-manifest";
import { IconCard } from "@/components/icons/icon-card";
import { IconGrid } from "@/components/icons/icon-grid";
import { IconDetail } from "@/components/icons/icon-detail";

/** Inline AWS logo - text inherits currentColor, arrow stays orange */
function AwsLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className}>
      <path d="M6.763 11.212c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 01-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 01-.287-.375 6.18 6.18 0 01-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.39-.384-.59-.894-.59-1.533 0-.678.24-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.4 2.4 0 01-.28.104.488.488 0 01-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 01.224-.167 4.577 4.577 0 011.005-.36 4.84 4.84 0 011.246-.151c.95 0 1.644.216 2.091.647.44.43.662 1.085.662 1.963v2.586h.016zm-3.24 1.214c.263 0 .534-.048.822-.144a1.78 1.78 0 00.758-.51 1.27 1.27 0 00.272-.512c.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 00-.735-.136 6.02 6.02 0 00-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 6.726a1.398 1.398 0 01-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 01.32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 01.311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 01-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 01-.303.08h-.687c-.15 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32L12.32 7.747l-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08l-.686.001zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 01-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.32.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 00.415-.758.777.777 0 00-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 01-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .36.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 01.24.2.43.43 0 01.071.263v.375c0 .168-.064.256-.184.256a.83.83 0 01-.303-.096 3.652 3.652 0 00-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.16.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926a2.157 2.157 0 01-.583.703c-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167z" />
      <path d="M.378 15.475c3.384 1.963 7.56 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.44-.2.814.287.383.607-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351zm23.531-.2c.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151l.175-.439c.343-.88.802-2.198.52-2.555-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399z" fill="#F90" />
    </svg>
  );
}

/** Hand-picked popular brand slugs */
const POPULAR_SLUGS = [
  "google", "apple", "github", "microsoft", "amazon", "meta",
  "netflix", "spotify", "discord", "slack", "figma", "notion",
  "stripe", "vercel", "docker", "react", "nextdotjs", "typescript",
  "tailwindcss", "nodejs", "python", "rust", "openai", "claude",
  "firebase", "supabase", "postgresql", "mongodb", "redis", "linux",
  "aws", "cloudflare", "digitalocean", "github-copilot", "visual-studio-code",
  "chrome", "firefox", "safari", "android", "swift",
];

/** Hand-picked popular AWS slugs */
const POPULAR_AWS_SLUGS = [
  "aws-aws-lambda", "aws-amazon-ec2", "aws-amazon-s3", "aws-amazon-rds",
  "aws-amazon-dynamodb", "aws-amazon-cloudfront", "aws-amazon-api-gateway",
  "aws-amazon-sqs", "aws-amazon-sns", "aws-amazon-bedrock",
  "aws-amazon-ecs", "aws-amazon-eks", "aws-aws-fargate",
  "aws-amazon-cognito", "aws-amazon-cloudwatch", "aws-aws-iam-identity-center",
  "aws-amazon-route-53", "aws-amazon-elasticache", "aws-aws-step-functions",
  "aws-amazon-kinesis", "aws-aws-cloudformation", "aws-amazon-sagemaker",
  "aws-aws-app-runner", "aws-amazon-eventbridge",
];

/** Hand-picked popular Azure slugs */
const POPULAR_AZURE_SLUGS = [
  "azure-virtual-machines", "azure-app-services", "azure-sql-database",
  "azure-cosmos-db", "azure-kubernetes-service-aks", "azure-functions",
  "azure-storage-accounts", "azure-active-directory", "azure-devops",
  "azure-api-management-services", "azure-key-vaults", "azure-cognitive-services",
  "azure-load-balancers", "azure-virtual-networks", "azure-container-apps",
  "azure-application-gateways", "azure-azure-sql", "azure-monitor",
  "azure-azure-cache-for-redis", "azure-event-hubs",
  "azure-service-bus", "azure-logic-apps", "azure-bot-services", "azure-cdn-profiles",
];

/** Hand-picked popular GCP slugs */
const POPULAR_GCP_SLUGS = [
  "gcp-compute-engine", "gcp-cloud-storage", "gcp-bigquery",
  "gcp-cloud-functions", "gcp-cloud-run", "gcp-google-kubernetes-engine",
  "gcp-cloud-sql", "gcp-app-engine", "gcp-cloud-cdn",
  "gcp-cloud-build", "gcp-pubsub", "gcp-cloud-spanner",
  "gcp-vertexai", "gcp-cloud-armor", "gcp-artifact-registry",
  "gcp-cloud-dns", "gcp-firestore", "gcp-memorystore",
  "gcp-cloud-monitoring", "gcp-cloud-logging", "gcp-secret-manager",
  "gcp-identity-and-access-management", "gcp-cloud-load-balancing", "gcp-apigee-api-platform",
];

/** Hand-picked popular Kubernetes slugs */
const POPULAR_K8S_SLUGS = [
  "k8s-deployment", "k8s-pod", "k8s-service", "k8s-ingress",
  "k8s-configmap", "k8s-secret", "k8s-daemonset", "k8s-statefulset",
  "k8s-cronjob", "k8s-namespace", "k8s-node", "k8s-persistentvolume",
  "k8s-api-server", "k8s-etcd-cluster", "k8s-horizontalpodautoscaler",
  "k8s-replicaset", "k8s-serviceaccount", "k8s-storageclass",
  "k8s-controller-manager", "k8s-clusterrole",
];

const COLLECTION_LABELS: Record<string, { label: string; description: string }> = {
  brands: { label: "Brand Icons", description: "Logos and brand marks" },
  aws: { label: "AWS Architecture", description: "AWS service and resource icons (2026-Q1)" },
  azure: { label: "Azure Services", description: "Microsoft Azure service icons (2026-Q1)" },
  gcp: { label: "Google Cloud", description: "Google Cloud Platform icons (2026-Q1)" },
  k8s: { label: "Kubernetes", description: "Official Kubernetes architecture icons" },
};

const ALL_SLIDES = [
  {
    badge: "Open Source",
    badgeIcon: Sparkles,
    title: "5,600+ SVG Icons. Search. Copy. Ship.",
    description: "Search, copy, and ship brand icons in seconds. Free, open-source, and community-driven.",
    cta: { label: "Get Started", href: "/extensions" },
    ctaSecondary: { label: "Submit an Icon", href: "/submit" },
    gradient: "from-orange-50/50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10",
    accent: "border-orange-200/50 bg-orange-50/80 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
    blob: "bg-orange-400/10 dark:bg-orange-500/5",
    collection: "brands" as const,
    floatSlugs: POPULAR_SLUGS,
  },
  {
    badge: "npm install thesvg",
    badgeIcon: Package,
    title: "One Package, Every Brand",
    description: "Tree-shakeable, typed, dual ESM/CJS. Import any icon with zero config.",
    cta: { label: "View on npm", href: "https://www.npmjs.com/package/thesvg" },
    ctaSecondary: { label: "Extensions", href: "/extensions" },
    gradient: "from-blue-50/50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10",
    accent: "border-blue-200/50 bg-blue-50/80 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    blob: "bg-blue-400/10 dark:bg-blue-500/5",
    collection: "brands" as const,
    floatSlugs: POPULAR_SLUGS,
  },
  {
    badge: "Copy & Ship",
    badgeIcon: Zap,
    title: "SVG, JSX, CDN, or Download",
    description: "Every format you need. Copy raw SVG, grab a CDN link, or download files. Dark mode variants included.",
    cta: { label: "Browse Icons", href: "/" },
    ctaSecondary: { label: "Extensions", href: "/extensions" },
    gradient: "from-emerald-50/50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10",
    accent: "border-emerald-200/50 bg-emerald-50/80 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    blob: "bg-emerald-400/10 dark:bg-emerald-500/5",
    collection: "brands" as const,
    floatSlugs: POPULAR_SLUGS,
  },
  {
    badge: "AWS Architecture",
    badgeIcon: Cloud,
    title: "Every AWS Icon for Your Diagrams",
    description: "300+ service icons, 400+ resource icons, and category icons. Browse, copy, and use in architecture diagrams instantly.",
    cta: { label: "Browse Services", href: "#popular" },
    ctaSecondary: { label: "All Categories", href: "#categories" },
    gradient: "from-[#232f3e]/5 via-background to-[#ff9900]/5 dark:from-[#232f3e]/30 dark:via-background dark:to-[#ff9900]/10",
    accent: "border-[#ff9900]/30 bg-[#ff9900]/10 text-[#c47b12] dark:border-[#ff9900]/30 dark:bg-[#ff9900]/15 dark:text-[#ff9900]",
    blob: "bg-[#ff9900]/10 dark:bg-[#ff9900]/5",
    collection: "aws" as const,
    floatSlugs: POPULAR_AWS_SLUGS,
  },
  {
    badge: "2026-Q1 Release",
    badgeIcon: Package,
    title: "Official AWS Architecture Icons",
    description: "Unmodified SVGs from the official AWS icon set. Updated quarterly. Services, resources, categories, and groups.",
    cta: { label: "Browse All", href: "#all" },
    ctaSecondary: { label: "View License", href: "https://aws.amazon.com/architecture/icons/" },
    gradient: "from-[#ff9900]/5 via-background to-[#232f3e]/5 dark:from-[#ff9900]/10 dark:via-background dark:to-[#232f3e]/20",
    accent: "border-[#232f3e]/20 bg-[#232f3e]/10 text-[#232f3e] dark:border-[#ff9900]/20 dark:bg-[#ff9900]/10 dark:text-[#ff9900]",
    blob: "bg-[#232f3e]/10 dark:bg-[#232f3e]/5",
    collection: "aws" as const,
    floatSlugs: POPULAR_AWS_SLUGS,
  },
  {
    badge: "Microsoft Azure",
    badgeIcon: Cloud,
    title: "626 Azure Service Icons",
    description: "Every Azure service icon for your architecture diagrams. VMs, App Services, SQL, Cosmos DB, and more. Free to use.",
    cta: { label: "Browse Services", href: "#popular" },
    ctaSecondary: { label: "All Categories", href: "#categories" },
    gradient: "from-[#0078d4]/5 via-background to-[#0078d4]/5 dark:from-[#0078d4]/20 dark:via-background dark:to-[#0078d4]/10",
    accent: "border-[#0078d4]/30 bg-[#0078d4]/10 text-[#0078d4] dark:border-[#0078d4]/30 dark:bg-[#0078d4]/15 dark:text-[#3ba0e6]",
    blob: "bg-[#0078d4]/10 dark:bg-[#0078d4]/5",
    collection: "azure" as const,
    floatSlugs: POPULAR_AZURE_SLUGS,
  },
  {
    badge: "2026-Q1 Release",
    badgeIcon: Package,
    title: "Official Azure Architecture Icons",
    description: "29 categories of Microsoft Azure service icons. Compute, Networking, Databases, AI, Security, and more.",
    cta: { label: "Browse All", href: "#all" },
    ctaSecondary: { label: "View License", href: "https://learn.microsoft.com/en-us/azure/architecture/icons/" },
    gradient: "from-[#0078d4]/5 via-background to-[#50e6ff]/5 dark:from-[#0078d4]/15 dark:via-background dark:to-[#50e6ff]/10",
    accent: "border-[#50e6ff]/30 bg-[#50e6ff]/10 text-[#0078d4] dark:border-[#50e6ff]/20 dark:bg-[#50e6ff]/10 dark:text-[#50e6ff]",
    blob: "bg-[#50e6ff]/10 dark:bg-[#50e6ff]/5",
    collection: "azure" as const,
    floatSlugs: POPULAR_AZURE_SLUGS,
  },
  {
    badge: "Google Cloud",
    badgeIcon: Cloud,
    title: "214 GCP Service Icons",
    description: "Google Cloud Platform icons for architecture diagrams. Compute Engine, BigQuery, Cloud Run, GKE, and all GCP services.",
    cta: { label: "Browse Services", href: "#popular" },
    ctaSecondary: { label: "All Categories", href: "#categories" },
    gradient: "from-[#4285f4]/5 via-background to-[#34a853]/5 dark:from-[#4285f4]/20 dark:via-background dark:to-[#34a853]/10",
    accent: "border-[#4285f4]/30 bg-[#4285f4]/10 text-[#4285f4] dark:border-[#4285f4]/30 dark:bg-[#4285f4]/15 dark:text-[#6aa5f8]",
    blob: "bg-[#4285f4]/10 dark:bg-[#4285f4]/5",
    collection: "gcp" as const,
    floatSlugs: POPULAR_GCP_SLUGS,
  },
  {
    badge: "Apache 2.0 License",
    badgeIcon: Package,
    title: "Official Google Cloud Icons",
    description: "Free GCP icons under Apache 2.0. Auto-categorized into Compute, Storage, AI, Networking, and more.",
    cta: { label: "Browse All", href: "#all" },
    ctaSecondary: { label: "View License", href: "https://cloud.google.com/icons" },
    gradient: "from-[#ea4335]/5 via-background to-[#fbbc05]/5 dark:from-[#ea4335]/10 dark:via-background dark:to-[#fbbc05]/10",
    accent: "border-[#34a853]/30 bg-[#34a853]/10 text-[#34a853] dark:border-[#34a853]/20 dark:bg-[#34a853]/10 dark:text-[#34a853]",
    blob: "bg-[#34a853]/10 dark:bg-[#34a853]/5",
    collection: "gcp" as const,
    floatSlugs: POPULAR_GCP_SLUGS,
  },
  {
    badge: "Kubernetes",
    badgeIcon: Anchor,
    title: "38 Official Kubernetes Icons",
    description: "Pods, Deployments, Services, Ingress, ConfigMaps, and more. The full CNCF Kubernetes icon set for your architecture diagrams.",
    cta: { label: "Browse Icons", href: "#popular" },
    ctaSecondary: { label: "All Resources", href: "#categories" },
    gradient: "from-[#326ce5]/5 via-background to-[#326ce5]/5 dark:from-[#326ce5]/20 dark:via-background dark:to-[#326ce5]/10",
    accent: "border-[#326ce5]/30 bg-[#326ce5]/10 text-[#326ce5] dark:border-[#326ce5]/30 dark:bg-[#326ce5]/15 dark:text-[#5b8eef]",
    blob: "bg-[#326ce5]/10 dark:bg-[#326ce5]/5",
    collection: "k8s" as const,
    floatSlugs: POPULAR_K8S_SLUGS,
  },
  {
    badge: "Apache 2.0 License",
    badgeIcon: Package,
    title: "CNCF Kubernetes Architecture Icons",
    description: "Official icons from the Kubernetes project. Free under Apache 2.0. Use in docs, diagrams, and presentations.",
    cta: { label: "Browse All", href: "#all" },
    ctaSecondary: { label: "View License", href: "https://github.com/kubernetes/community/tree/master/icons" },
    gradient: "from-[#326ce5]/5 via-background to-[#ffffff]/5 dark:from-[#326ce5]/15 dark:via-background dark:to-[#326ce5]/10",
    accent: "border-[#326ce5]/20 bg-[#326ce5]/10 text-[#326ce5] dark:border-[#326ce5]/20 dark:bg-[#326ce5]/10 dark:text-[#5b8eef]",
    blob: "bg-[#326ce5]/10 dark:bg-[#326ce5]/5",
    collection: "k8s" as const,
    floatSlugs: POPULAR_K8S_SLUGS,
  },
];

const SLIDE_DURATION = 6000;

interface HomeHeroProps {
  categoryCounts: { name: string; count: number }[];
  count: number;
  recentIcons: IconEntry[];
  collections: { name: Collection; count: number }[];
  defaultCollection?: Collection;
  onSelectIcon: (icon: IconEntry) => void;
  onCategorySelect: (category: string) => void;
  onCollectionSelect: (collection: string) => void;
}

export function HomeHero({
  categoryCounts: _categoryCounts,
  count,
  recentIcons,
  collections,
  defaultCollection,
  onCategorySelect,
  onCollectionSelect,
}: HomeHeroProps) {
  // Lazy-load the full icons manifest for decorative elements (floating icons,
  // popular grids, category rows). The hero carousel content renders immediately;
  // icons appear progressively as the manifest loads.
  const [icons, setIcons] = useState<IconEntry[]>([]);
  useEffect(() => {
    loadIconsManifest()
      .then(setIcons)
      .catch(() => {
        // Decorative elements are non-critical; silently ignore load failures
      });
  }, []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconEntry | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection>(defaultCollection ?? "brands");

  // Filter slides by active collection
  const collectionSlides = useMemo(
    () => ALL_SLIDES.filter((s) => s.collection === activeCollection),
    [activeCollection]
  );

  // Reset slide when collection changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [activeCollection]);

  // Auto-rotate carousel through collection slides
  useEffect(() => {
    if (isPaused || collectionSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % collectionSlides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, collectionSlides.length]);

  const handleSelectIcon = useCallback((icon: IconEntry) => {
    setSelectedIcon(icon);
  }, []);

  // Filter icons by active collection
  const collectionIcons = useMemo(
    () => icons.filter((i) => i.collection === activeCollection),
    [icons, activeCollection]
  );

  // Popular icons per collection
  const popularIcons = useMemo(() => {
    const slugMap: Record<string, string[]> = {
      brands: POPULAR_SLUGS,
      aws: POPULAR_AWS_SLUGS,
      azure: POPULAR_AZURE_SLUGS,
      gcp: POPULAR_GCP_SLUGS,
      k8s: POPULAR_K8S_SLUGS,
    };
    const slugs = slugMap[activeCollection] ?? POPULAR_SLUGS;
    return slugs
      .map((slug) => icons.find((i) => i.slug === slug))
      .filter(Boolean) as IconEntry[];
  }, [icons, activeCollection]);

  // Categories for active collection
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const icon of collectionIcons) {
      for (const c of icon.categories) {
        counts.set(c, (counts.get(c) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [collectionIcons]);

  // Recently added for active collection
  const collectionRecentIcons = useMemo(() => {
    if (activeCollection === "brands") return recentIcons;
    return [...collectionIcons]
      .filter((i) => i.dateAdded)
      .sort((a, b) => (b.dateAdded as string).localeCompare(a.dateAdded as string))
      .slice(0, 12);
  }, [activeCollection, collectionIcons, recentIcons]);

  const fallbackSlide = ALL_SLIDES[0];
  const slide = collectionSlides.length > 0
    ? collectionSlides[currentSlide % collectionSlides.length]
    : fallbackSlide;
  const BadgeIcon = slide.badgeIcon;

  // Pick 6 floating icons matching the current slide's collection
  const floatingIcons = useMemo(() => {
    const activeSlide = collectionSlides.length > 0
      ? collectionSlides[currentSlide % collectionSlides.length]
      : fallbackSlide;
    const slugs = activeSlide.floatSlugs.slice(0, 6);
    return slugs
      .map((s) => icons.find((i) => i.slug === s))
      .filter(Boolean) as IconEntry[];
  }, [icons, currentSlide, collectionSlides, fallbackSlide]);

  // Predefined positions for floating icons (scattered, not grid)
  const FLOAT_POSITIONS = [
    { top: "8%", right: "5%", size: "h-10 w-10", delay: "0s", opacity: "opacity-25" },
    { top: "20%", right: "18%", size: "h-8 w-8", delay: "0.8s", opacity: "opacity-20" },
    { top: "55%", right: "3%", size: "h-9 w-9", delay: "1.6s", opacity: "opacity-15" },
    { top: "40%", right: "22%", size: "h-7 w-7", delay: "2.4s", opacity: "opacity-20" },
    { top: "70%", right: "15%", size: "h-11 w-11", delay: "0.4s", opacity: "opacity-15" },
    { top: "15%", right: "30%", size: "h-6 w-6", delay: "1.2s", opacity: "opacity-10" },
  ];

  return (
    <div className="space-y-8 pb-6">
      {/* Visually hidden h1 for screen readers and SEO */}
      <h1 className="sr-only">thesvg - The Open SVG Brand Library</h1>

      {/* Hero carousel - lifted card with depth */}
      <div className="relative">
        {/* Bottom shadow layer for lifted effect */}
        <div className="absolute -bottom-2 left-4 right-4 h-8 rounded-3xl bg-black/5 blur-xl dark:bg-black/30" />
        <div className="absolute -bottom-1 left-8 right-8 h-4 rounded-2xl bg-black/[0.03] blur-md dark:bg-black/20" />

        <div
          className={`relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br ${slide.gradient} px-6 py-12 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-700 sm:px-10 sm:py-16 dark:border-white/[0.08] dark:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.4),0_2px_8px_-2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top highlight edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />

          <div className="relative z-10 max-w-2xl">
            {/* Slide content with fade */}
            <div key={currentSlide} className="animate-fade-in">
              <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${slide.accent}`}>
                <BadgeIcon className="h-3 w-3" />
                {slide.badge === "Open Source"
                  ? `${count.toLocaleString()}+ icons`
                  : slide.badge}
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {slide.title}
              </h2>
              <p className="mb-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {slide.cta.href.startsWith("http") ? (
                  <a
                    href={slide.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl dark:shadow-black/30"
                  >
                    {slide.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    href={slide.cta.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl dark:shadow-black/30"
                  >
                    {slide.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <Link
                  href={slide.ctaSecondary.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-5 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md dark:border-white/[0.1] dark:bg-white/[0.05]"
                >
                  {slide.ctaSecondary.label}
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className={`pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full ${slide.blob} opacity-80 blur-3xl transition-colors duration-700`} />
          <div className={`pointer-events-none absolute -bottom-14 -right-14 h-52 w-52 rounded-full ${slide.blob} opacity-70 blur-2xl transition-colors duration-700`} />
          <div className={`pointer-events-none absolute top-1/2 left-1/3 h-40 w-40 -translate-y-1/2 rounded-full ${slide.blob} opacity-30 blur-3xl transition-colors duration-700`} />

          {/* Floating scattered icons */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {floatingIcons.map((icon, i) => {
              const pos = FLOAT_POSITIONS[i];
              return (
                <div
                  key={icon.slug}
                  className={`absolute animate-float ${pos.opacity}`}
                  style={{
                    top: pos.top,
                    right: pos.right,
                    animationDelay: pos.delay,
                    animationDuration: `${4 + i * 0.5}s`,
                  }}
                >
                  <div className={`${pos.size} rounded-xl border border-white/10 ${slide.collection === "aws" ? "bg-[#ff9900]/10 dark:bg-[#ff9900]/5" : slide.collection === "azure" ? "bg-[#0078d4]/10 dark:bg-[#0078d4]/5" : slide.collection === "gcp" ? "bg-[#4285f4]/10 dark:bg-[#4285f4]/5" : "bg-background/30"} p-1.5 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-white/5 dark:shadow-black/20`}>
                    <img src={icon.variants.light || icon.variants.default} alt="" className="h-full w-full object-contain dark:hidden" />
                    <img src={icon.variants.dark || icon.variants.default} alt="" className="hidden h-full w-full object-contain dark:block" />
                  </div>
                </div>
              );
            })}
          </div>

        {/* Thin glowing progress dots */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {collectionSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className="group relative"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-10 bg-foreground/50 shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                    : "w-2 bg-foreground/15 hover:bg-foreground/25"
                }`}
              />
              {/* Active glow fill */}
              {i === currentSlide && !isPaused && (
                <div
                  className="animate-progress absolute inset-y-0 left-0 rounded-full bg-foreground/70 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  style={{
                    animationName: "progress",
                    animationDuration: `${SLIDE_DURATION}ms`,
                    animationTimingFunction: "linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Collection tabs */}
      {collections.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Icon collections">
          {collections.map((col) => {
            const info = COLLECTION_LABELS[col.name];
            const isActive = activeCollection === col.name;
            return (
              <button
                key={col.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCollection(col.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-white/[0.06]"
                }`}
              >
                {col.name === "brands" && <Shapes className="h-3.5 w-3.5" />}
                {col.name === "aws" && <AwsLogo className="h-4.5 w-4.5" />}
                {info?.label || col.name}
                <span className={`rounded-full px-1.5 font-mono text-[10px] ${
                  isActive
                    ? "bg-background/20 text-background/70"
                    : "bg-muted/60 text-muted-foreground dark:bg-white/[0.06]"
                }`}>
                  {col.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Popular icons */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {activeCollection === "aws" ? "Popular AWS Services" : activeCollection === "azure" ? "Popular Azure Services" : activeCollection === "gcp" ? "Popular GCP Services" : "Popular"}
          </h2>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {popularIcons.map((icon) => (
            <IconCard key={icon.slug} icon={icon} onSelect={handleSelectIcon} />
          ))}
        </div>
      </section>

      {/* Recently Added */}
      {collectionRecentIcons.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recently Added</h2>
            <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
            {collectionRecentIcons.map((icon) => (
              <IconCard key={icon.slug} icon={icon} onSelect={handleSelectIcon} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by category */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Browse by Category</h2>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                onCollectionSelect(activeCollection);
                onCategorySelect(cat.name);
              }}
              className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3 text-left transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]"
            >
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
              <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* All Icons - with infinite scroll */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {activeCollection === "brands" ? "All Icons" : `All ${COLLECTION_LABELS[activeCollection]?.label ?? activeCollection} Icons`}
          </h2>
          <span className="text-xs text-muted-foreground">{collectionIcons.length.toLocaleString()}</span>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <IconGrid icons={collectionIcons} />
      </section>

      {/* Cloud provider attributions */}
      {activeCollection === "aws" && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          AWS Architecture Icons provided under CC-BY-ND 2.0. Amazon Web Services and all related marks are trademarks of Amazon.com, Inc.
        </p>
      )}
      {activeCollection === "azure" && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          Microsoft Azure icons provided under MIT license. Microsoft Azure and all related marks are trademarks of Microsoft Corporation.
        </p>
      )}
      {activeCollection === "gcp" && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          Google Cloud icons provided under Apache 2.0 license. Google Cloud and all related marks are trademarks of Google LLC.
        </p>
      )}

      {/* Detail modal */}
      <IconDetail icon={selectedIcon} onClose={() => setSelectedIcon(null)} />
    </div>
  );
}
