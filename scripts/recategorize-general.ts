/**
 * Conservative recategorization of icons whose categories include "General".
 *
 * Only icons currently tagged "General" are considered. Targets must be
 * categories that already exist in src/data/icons.json. An icon moves only
 * when at least one rule matches and every matching rule agrees on the same
 * category set. Otherwise it is left untouched.
 *
 * The file is edited as text so the diff only touches the `categories`
 * block of moved icons.
 *
 * Usage:
 *   tsx scripts/recategorize-general.ts            (dry run, prints report)
 *   tsx scripts/recategorize-general.ts --write    (rewrites icons.json)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface IconEntry {
  slug: string;
  title: string;
  categories: string[];
  url: string;
}

export interface Rule {
  id: string;
  /** Why this mapping is safe. Shown in the report. */
  reason: string;
  /** Tested against the icon url (vendor scope). */
  domain: RegExp;
  /** Tested against the slug with vendor prefixes stripped. */
  name: RegExp;
  /** Categories added (General is dropped when a rule applies). */
  categories: string[];
}

const AZURE = /azure\.microsoft\.com/;
const GCP = /cloud\.google\.com/;
const AWS = /aws\.amazon\.com/;
const AZURE_OR_GCP = /azure\.microsoft\.com|cloud\.google\.com/;
const CLOUD_ALL = new RegExp(`${AZURE.source}|${GCP.source}|${AWS.source}`);

export const RULES: Rule[] = [
  {
    id: "marketplace",
    reason: "Cloud vendor marketplace icons",
    domain: CLOUD_ALL,
    name: /(^|-)marketplace(-|$)/,
    categories: ["Marketplace"],
  },
  {
    id: "azure-cost",
    reason: "Azure cost and billing services",
    domain: AZURE,
    name: /^(cost-(alerts|analysis|budgets|export|management|management-and-billing)|savings-plans|reservations|reserved-capacity|consumption-commitment)$/,
    categories: ["Cost Management"],
  },
  {
    id: "gcp-billing",
    reason: "Google Cloud Billing",
    domain: GCP,
    name: /^billing$/,
    categories: ["Cost Management"],
  },
  {
    id: "azure-storage",
    reason: "Azure storage services (siblings azure-storage-accounts etc. use Storage)",
    domain: AZURE,
    name: /^(storage-(azure-files|container|functions|hubs|queue|mover)|blob-(block|page)|disk-pool|elastic-san|files|ssd|edge-storage-accelerator)$/,
    categories: ["Storage"],
  },
  {
    id: "azure-containers",
    reason: "AKS, Kubernetes fleet and Container Apps",
    domain: AZURE,
    name: /^(aks-(istio|network-policy)|kubernetes-(fleet-manager|hub)|container-apps-environments|worker-container-app)$/,
    categories: ["Containers"],
  },
  {
    id: "gcp-containers",
    reason: "Google Cloud Run for Anthos and Container-Optimized OS",
    domain: GCP,
    name: /^(kuberun)$/,
    categories: ["Containers"],
  },
  {
    id: "gcp-container-os",
    reason: "Container-Optimized OS is a container host image on Compute Engine",
    domain: GCP,
    name: /^container-optimized-os$/,
    categories: ["Containers", "Compute"],
  },
  {
    id: "azure-arc-data",
    reason: "Azure Arc enabled data services",
    domain: AZURE,
    name: /^arc-(data-services|postgresql|sql-managed-instance|sql-server)$/,
    categories: ["Database", "Hybrid Cloud"],
  },
  {
    id: "azure-arc-k8s",
    reason: "Azure Arc enabled Kubernetes",
    domain: AZURE,
    name: /^arc-kubernetes$/,
    categories: ["Containers", "Hybrid Cloud"],
  },
  {
    id: "azure-local",
    reason: "Azure Local is the hybrid (formerly Stack HCI) offering",
    domain: AZURE,
    name: /^local$/,
    categories: ["Hybrid Cloud"],
  },
  {
    id: "azure-database",
    reason: "Azure managed database services",
    domain: AZURE,
    name: /^(managed-redis|managed-instance-apache-cassandra|instance-pools|production-ready-database|database-instance-for-sap|sql-database-fleet-manager)$/,
    categories: ["Database"],
  },
  {
    id: "azure-networking",
    reason: "Azure networking services",
    domain: AZURE,
    name: /^(network-(foundation-hub|managers)|vnet-appliance|peering-service|peerings|custom-ip-prefix|express-route-traffic-collector|expressroute-direct|private-endpoints|load-balancer-hub|local-network-gateways|vpnclientwindows|network-function-manager(-functions)?)$/,
    categories: ["Networking"],
  },
  {
    id: "azure-network-security",
    reason: "Network security perimeters and hubs are both networking and security",
    domain: AZURE,
    name: /^network-security-(hub|perimeters)$/,
    categories: ["Networking", "Security"],
  },
  {
    id: "gcp-networking",
    reason: "Google Cloud VPC, Private Service Connect and domains",
    domain: GCP,
    name: /^(virtual-private-cloud|private-connectivity|private-service-connect|connectivity-test|cloud-domains)$/,
    categories: ["Networking"],
  },
  {
    id: "azure-security",
    reason: "Azure security, attestation and compliance services",
    domain: AZURE,
    name: /^(dedicated-hsm|azureattestation|confidential-ledgers|compliance-center|app-compliance-automation|resource-guard|virtual-enclaves)$/,
    categories: ["Security"],
  },
  {
    id: "gcp-security",
    reason: "Google Cloud security services",
    domain: GCP,
    name: /^(access-context-manager|cloud-security-scanner|security)$/,
    categories: ["Security"],
  },
  {
    id: "gcp-audit-logs",
    reason: "Audit logs are security logging",
    domain: GCP,
    name: /^cloud-audit-logs$/,
    categories: ["Security", "Monitoring"],
  },
  {
    id: "identity",
    reason: "Entra ID, app registrations, managed Active Directory",
    domain: AZURE_OR_GCP,
    name: /^(app-registrations|entra-identity-licenses|external-id|external-id-modified|managed-service-for-microsoft-active-directory)$/,
    categories: ["Identity"],
  },
  {
    id: "azure-monitoring",
    reason: "Azure Monitor family (azure-monitor already uses Monitoring)",
    domain: AZURE,
    name: /^(monitor-(dashboard|health-models|issues)|managed-grafana|promethus|workbooks|service-health|data-collection-rules|log-analytics-query-pack)$/,
    categories: ["Monitoring"],
  },
  {
    id: "azure-ai",
    reason: "Azure AI services",
    domain: AZURE,
    name: /^(ai-at-edge|video-indexer)$/,
    categories: ["AI"],
  },
  {
    id: "gcp-ai",
    reason: "Google Cloud AI and ML services",
    domain: GCP,
    name: /^(advanced-agent-modeling|agent-assist|cloud-optimization-ai|data-labeling|visual-inspection)$/,
    categories: ["AI"],
  },
  {
    id: "azure-iot",
    reason: "Azure IoT and embedded services",
    domain: AZURE,
    name: /^(sphere|rtos|device-update-iot-hub)$/,
    categories: ["IoT"],
  },
  {
    id: "azure-connected-vehicle",
    reason: "Connected Vehicle Platform is IoT for automotive",
    domain: AZURE,
    name: /^connected-vehicle-platform$/,
    categories: ["IoT", "Automotive"],
  },
  {
    id: "azure-defender-ot",
    reason: "Defender for IoT operational technology device icons",
    domain: AZURE,
    name: /^defender-/,
    categories: ["IoT", "Security"],
  },
  {
    id: "azure-compute",
    reason: "Azure VM, VMware and bare metal compute",
    domain: AZURE,
    name: /^(vm-app-definitions|vm-app-versions|vm-image-version|compute-galleries|capacity-reservation-groups|avs-vm|vmware-solution|bare-metal-infrastructure|cloud-services-extended-support)$/,
    categories: ["Compute"],
  },
  {
    id: "gcp-game-servers",
    reason: "Game Servers hosts dedicated game server fleets",
    domain: GCP,
    name: /^game-servers$/,
    categories: ["Gaming", "Compute"],
  },
  {
    id: "gcp-quantum",
    reason: "Quantum Engine",
    domain: GCP,
    name: /^quantum-engine$/,
    categories: ["Quantum"],
  },
  {
    id: "gcp-genomics",
    reason: "Genomics processing",
    domain: GCP,
    name: /^genomics$/,
    categories: ["Health", "Analytics"],
  },
  {
    id: "azure-devops",
    reason: "Azure DevOps and testing (azure-load-testing sibling is DevOps)",
    domain: AZURE,
    name: /^(bug|branch|builds|commit|backlog|tfs-vc-repository|load-testing|load-test|web-test|app-testing|test-base|chaos-studio|deployment-environments)$/,
    categories: ["DevOps"],
  },
  {
    id: "azure-app-services",
    reason: "App Service web jobs, slots and staging (siblings use App Services + Web)",
    domain: AZURE,
    name: /^(web-jobs|web-slots|website-staging)$/,
    categories: ["App Services", "Web"],
  },
  {
    id: "azure-integration",
    reason: "Azure integration services",
    domain: AZURE,
    name: /^(biz-talk|logic-apps-template|pubsub)$/,
    categories: ["Integration"],
  },
  {
    id: "azure-communication",
    reason: "Azure Communication Services",
    domain: AZURE,
    name: /^communication-services$/,
    categories: ["Communication"],
  },
  {
    id: "management",
    reason: "Resource, project and inventory management consoles",
    domain: AZURE_OR_GCP,
    name: /^(management-groups|resource-groups|resource-group-list|resource-explorer|all-resources|subscriptions|quotas|service-groups|update-management-center|osconfig|management-portal|administration|asset-inventory|cloud-asset-inventory|configuration-management|gce-systems-management|os-(configuration|inventory|patch)-management|project)$/,
    categories: ["Management"],
  },
  {
    id: "azure-health",
    reason: "Azure Health Data Services",
    domain: AZURE,
    name: /^(fhir-service|medtech-service)$/,
    categories: ["Health"],
  },
  {
    id: "azure-mobile",
    reason: "Mobile engagement service",
    domain: AZURE,
    name: /^mobile-engagement$/,
    categories: ["Mobile"],
  },
  {
    id: "azure-orbital",
    reason: "Azure Orbital ground station",
    domain: AZURE,
    name: /^orbital$/,
    categories: ["Satellite"],
  },
  {
    id: "gcp-marketing",
    reason: "Google Cloud for Marketing",
    domain: GCP,
    name: /^cloud-for-marketing$/,
    categories: ["Marketing"],
  },
  {
    id: "gcp-media",
    reason: "Cloud Media Edge",
    domain: GCP,
    name: /^cloud-media-edge$/,
    categories: ["Media"],
  },
];

export function stripVendor(slug: string): string {
  return slug.replace(/^(azure-|gcp-|aws-)+/, "");
}

export interface Move {
  slug: string;
  title: string;
  from: string[];
  to: string[];
  rules: string[];
}

/** Returns the new category list, or null when no rule applies or rules disagree. */
export function resolve(
  icon: IconEntry,
  rules: Rule[] = RULES,
): { to: string[]; rules: string[] } | null {
  if (!icon.categories.includes("General")) return null;
  const name = stripVendor(icon.slug);
  const hits = rules.filter((r) => r.domain.test(icon.url) && r.name.test(name));
  if (hits.length === 0) return null;
  const keys = new Set(hits.map((r) => [...r.categories].sort().join("|")));
  if (keys.size > 1) return null;
  const kept = icon.categories.filter((c) => c !== "General");
  const to = [...kept];
  for (const c of hits[0].categories) if (!to.includes(c)) to.push(c);
  return { to, rules: hits.map((r) => r.id) };
}

export function planMoves(icons: IconEntry[], rules: Rule[] = RULES): Move[] {
  const moves: Move[] = [];
  for (const icon of icons) {
    const r = resolve(icon, rules);
    if (r) {
      moves.push({
        slug: icon.slug,
        title: icon.title,
        from: icon.categories,
        to: r.to,
        rules: r.rules,
      });
    }
  }
  return moves;
}

/** Text-level rewrite of only the `categories` blocks of moved icons. */
export function applyMoves(raw: string, moves: Move[]): string {
  const bySlug = new Map(moves.map((m) => [m.slug, m]));
  const lines = raw.split("\n");
  const out: string[] = [];
  let current: Move | undefined;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const slugMatch = /^ {4}"slug": "([^"]+)",$/.exec(line);
    if (slugMatch) current = bySlug.get(slugMatch[1]);
    if (current && line === '    "categories": [') {
      out.push(line);
      i++;
      while (lines[i] !== "    ],") i++;
      current.to.forEach((c, idx) => {
        out.push(`      ${JSON.stringify(c)}${idx < current!.to.length - 1 ? "," : ""}`);
      });
      out.push(lines[i]);
      current = undefined;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function main(): void {
  const file = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/data/icons.json",
  );
  const raw = fs.readFileSync(file, "utf8");
  const icons = JSON.parse(raw) as IconEntry[];
  const moves = planMoves(icons);
  const general = icons.filter((i) => i.categories.includes("General")).length;
  console.log(`General icons: ${general}, moving: ${moves.length}, staying: ${general - moves.length}`);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(file, applyMoves(raw, moves));
    console.log("icons.json updated");
  }
  if (process.argv.includes("--table")) {
    console.log("| slug | title | old | new | rule |\n| --- | --- | --- | --- | --- |");
    for (const m of moves) {
      console.log(`| ${m.slug} | ${m.title.trim()} | ${m.from.join(", ")} | ${m.to.join(", ")} | ${m.rules.join(", ")} |`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
