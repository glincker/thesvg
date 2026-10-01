import type { CollectionId } from "@/lib/collections-meta";

/** Hand-picked popular slugs, shown on the homepage's Popular section and
 * backing the /?sort=popular view. Curated rather than metrics-driven -
 * there's no analytics pipeline feeding icon popularity (yet). */
const POPULAR_SLUGS = [
  "google", "apple", "github", "microsoft", "amazon", "meta",
  "netflix", "spotify", "discord", "slack", "figma", "notion",
  "stripe", "vercel", "docker", "react", "nextdotjs", "typescript",
  "tailwindcss", "nodejs", "python", "rust", "openai", "claude",
  "firebase", "supabase", "postgresql", "mongodb", "redis", "linux",
  "aws", "cloudflare", "digitalocean", "github-copilot", "visual-studio-code",
  "chrome", "firefox", "safari", "android", "swift",
];

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

const POPULAR_K8S_SLUGS = [
  "k8s-deployment", "k8s-pod", "k8s-service", "k8s-ingress",
  "k8s-configmap", "k8s-secret", "k8s-daemonset", "k8s-statefulset",
  "k8s-cronjob", "k8s-namespace", "k8s-node", "k8s-persistentvolume",
  "k8s-api-server", "k8s-etcd-cluster", "k8s-horizontalpodautoscaler",
  "k8s-replicaset", "k8s-serviceaccount", "k8s-storageclass",
  "k8s-controller-manager", "k8s-clusterrole",
];

const POPULAR_COMMUNITY_SLUGS = [
  "airflow", "cockroachdb", "envoy", "alpinejs", "chartjs", "cassandra",
];

const POPULAR_AUTH_BADGES_SLUGS = [
  "google-badge", "github-badge", "microsoft-badge", "apple-badge",
  "amazon-badge", "paypal-badge", "discord-badge", "dropbox-badge",
  "steam-badge", "bitwarden-badge", "proton-badge",
];

const POPULAR_SLUGS_BY_COLLECTION: Record<CollectionId, string[]> = {
  brands: POPULAR_SLUGS,
  aws: POPULAR_AWS_SLUGS,
  azure: POPULAR_AZURE_SLUGS,
  gcp: POPULAR_GCP_SLUGS,
  k8s: POPULAR_K8S_SLUGS,
  community: POPULAR_COMMUNITY_SLUGS,
  "auth-badges": POPULAR_AUTH_BADGES_SLUGS,
};

export function getPopularSlugs(collection: CollectionId | null): string[] {
  return POPULAR_SLUGS_BY_COLLECTION[collection ?? "brands"] ?? POPULAR_SLUGS;
}

/** Every curated slug across every collection, in collection order - backs
 * the /?sort=popular view when no collection filter is active. */
export function getAllPopularSlugs(): string[] {
  return Object.values(POPULAR_SLUGS_BY_COLLECTION).flat();
}
