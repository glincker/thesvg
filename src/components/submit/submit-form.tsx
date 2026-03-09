"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import {
  Check,
  CheckCircle,
  ClipboardCopy,
  ExternalLink,
  Github,
  Loader2,
  Palette,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateSvg, type ValidationResult } from "@/lib/svg-validation";

const GITHUB_ISSUES_URL =
  "https://github.com/glincker/thesvg/issues/new";

// All known categories from the dataset
const KNOWN_CATEGORIES = [
  "AI",
  "Analytics",
  "API",
  "Auth",
  "CDN",
  "CLI",
  "CMS",
  "Cloud",
  "Config",
  "Database",
  "Design",
  "Devtool",
  "Email",
  "Ecommerce",
  "Finance",
  "Framework",
  "Gaming",
  "Hardware",
  "Hosting",
  "IDE",
  "Language",
  "Library",
  "Logging",
  "Mapping",
  "Media",
  "Mobile",
  "Monitoring",
  "Networking",
  "OS",
  "Payment",
  "Protocol",
  "Runtime",
  "Security",
  "Social",
  "Software",
  "Storage",
  "Testing",
  "UI",
  "Version Control",
  "Web",
];

interface FileState {
  name: string;
  size: number;
  content: string;
  dataUrl: string;
  validation: ValidationResult | null;
}

interface FormState {
  iconName: string;
  slug: string;
  websiteUrl: string;
  guidelinesUrl: string;
  hex: string;
  categories: string[];
  newCategory: string;
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function filenameToName(filename: string): string {
  return filename
    .replace(/\.svg$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Sub-components ---

function ValidationBadge({ passed }: { passed: boolean }) {
  if (passed) {
    return <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  }
  return <X className="h-3.5 w-3.5 shrink-0 text-red-500" />;
}

function ValidationPanel({ result }: { result: ValidationResult }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        {result.valid ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          {result.valid ? "All checks passed" : "Some checks failed"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {result.checks.map((check) => (
          <li key={check.name} className="flex items-start gap-2 text-xs">
            <ValidationBadge passed={check.passed} />
            <span>
              <span className="font-medium">{check.name}:</span>{" "}
              <span className="text-muted-foreground">{check.message}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SvgPreview({ dataUrl, name }: { dataUrl: string; name: string }) {
  const SIZES = [16, 32, 64, 128] as const;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Preview</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Light background */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Light</p>
          <div className="icon-preview-bg flex flex-wrap items-end gap-3 rounded-lg p-4">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <img
                  src={dataUrl}
                  alt={name}
                  width={size}
                  height={size}
                  style={{ width: size, height: size }}
                  className="object-contain"
                />
                <span className="text-[10px] text-muted-foreground">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dark background */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Dark</p>
          <div className="dark flex flex-wrap items-end gap-3 rounded-lg bg-[oklch(0.18_0.008_260)] p-4">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <img
                  src={dataUrl}
                  alt={name}
                  width={size}
                  height={size}
                  style={{ width: size, height: size }}
                  className="object-contain"
                />
                <span className="text-[10px] text-zinc-500">{size}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySelector({
  categories,
  selected,
  onToggle,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
}: {
  categories: string[];
  selected: string[];
  onToggle: (cat: string) => void;
  newCategory: string;
  onNewCategoryChange: (val: string) => void;
  onAddCategory: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Categories</label>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const active = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/50 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          );
        })}
        {/* Custom categories added by user */}
        {selected
          .filter((c) => !categories.includes(c))
          .map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              className="rounded-full border border-orange-500/50 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400"
            >
              {cat} &times;
            </button>
          ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add custom category..."
          value={newCategory}
          onChange={(e) => onNewCategoryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddCategory();
            }
          }}
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAddCategory}
          className="h-7 shrink-0 text-xs"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// --- Main Form Component ---

export function SubmitForm({
  availableCategories,
}: {
  availableCategories?: string[];
}) {
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<FormState>({
    iconName: "",
    slug: "",
    websiteUrl: "",
    guidelinesUrl: "",
    hex: "",
    categories: [],
    newCategory: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const allCategories = availableCategories ?? KNOWN_CATEGORIES;

  // Keep slug in sync with name unless user has manually edited it
  const slugEditedRef = useRef(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(val: string) {
    updateField("iconName", val);
    if (!slugEditedRef.current) {
      updateField("slug", toKebabCase(val));
    }
  }

  function handleSlugChange(val: string) {
    slugEditedRef.current = true;
    updateField("slug", toKebabCase(val));
  }

  function toggleCategory(cat: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  function addNewCategory() {
    const cat = form.newCategory.trim();
    if (!cat || form.categories.includes(cat)) return;
    setForm((prev) => ({
      ...prev,
      categories: [...prev.categories, cat],
      newCategory: "",
    }));
  }

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".svg")) {
      return;
    }

    setIsValidating(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = validateSvg(content, file.size);

      // Generate data URL for preview
      const blob = new Blob([content], { type: "image/svg+xml" });
      const dataUrl = URL.createObjectURL(blob);

      setFileState({
        name: file.name,
        size: file.size,
        content,
        dataUrl,
        validation: result,
      });

      posthog.capture("submit_svg_uploaded", {
        file_size_bytes: file.size,
        validation_passed: result.valid,
        failed_checks: result.checks.filter((c) => !c.passed).map((c) => c.name),
      });

      // Auto-fill name from filename
      const suggestedName = filenameToName(file.name);
      setForm((prev) => ({
        ...prev,
        iconName: prev.iconName || suggestedName,
        slug: prev.iconName ? prev.slug : toKebabCase(suggestedName),
      }));

      setIsValidating(false);
    };

    reader.readAsText(file);
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function clearFile() {
    if (fileState?.dataUrl) {
      URL.revokeObjectURL(fileState.dataUrl);
    }
    setFileState(null);
    slugEditedRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (fileState?.dataUrl) {
        URL.revokeObjectURL(fileState.dataUrl);
      }
    };
    // Only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildSubmissionBody(): string {
    const validation = fileState?.validation;
    const checksText = validation
      ? validation.checks
          .map((c) => `- [${c.passed ? "x" : " "}] ${c.name}: ${c.message}`)
          .join("\n")
      : "No file uploaded";

    const lines = [
      `## Icon Submission: ${form.iconName || "(unnamed)"}`,
      ``,
      `### Details`,
      `- **Name**: ${form.iconName || "-"}`,
      `- **Slug**: ${form.slug || "-"}`,
      `- **Website URL**: ${form.websiteUrl || "-"}`,
      `- **Brand Guidelines**: ${form.guidelinesUrl || "-"}`,
      `- **Brand Hex Color**: ${form.hex ? `#${form.hex.replace(/^#/, "")}` : "-"}`,
      `- **Categories**: ${form.categories.length ? form.categories.join(", ") : "-"}`,
      ``,
      `### SVG Validation`,
      checksText,
      ``,
      `### SVG Content`,
      `\`\`\`svg`,
      fileState?.content ?? "(paste SVG here)",
      `\`\`\``,
      ``,
      `### icons.json Entry`,
      `\`\`\`json`,
      JSON.stringify(
        {
          slug: form.slug || "your-brand",
          title: form.iconName || "Your Brand",
          aliases: [],
          hex: form.hex.replace(/^#/, "") || "000000",
          categories: form.categories,
          variants: {
            default: `/icons/${form.slug || "your-brand"}/default.svg`,
          },
          license: "TODO",
          url: form.websiteUrl || "https://yourbrand.com",
          ...(form.guidelinesUrl ? { guidelines: form.guidelinesUrl } : {}),
        },
        null,
        2
      ),
      `\`\`\``,
    ];

    return lines.join("\n");
  }

  function buildGitHubUrl(): string {
    const title = encodeURIComponent(
      `[Icon Request] ${form.iconName || "New Icon"}`
    );
    const body = encodeURIComponent(buildSubmissionBody());
    return `${GITHUB_ISSUES_URL}?title=${title}&body=${body}&labels=icon-request`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildSubmissionBody());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

  const canSubmit = fileState !== null && form.iconName.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div>
        <p className="mb-2 text-sm font-medium">SVG File</p>
        {!fileState ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload SVG file"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              isDragging
                ? "border-orange-500 bg-orange-500/5"
                : "border-border hover:border-foreground/30 hover:bg-muted/30"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                isDragging ? "bg-orange-500/20" : "bg-muted"
              )}
            >
              {isValidating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isDragging ? "text-orange-500" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragging ? "Drop your SVG here" : "Drag & drop your SVG"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                or click to browse - .svg files only, max 50KB
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="icon-preview-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <img
                    src={fileState.dataUrl}
                    alt={fileState.name}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fileState.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(fileState.size / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove file"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Validation Results */}
      {fileState?.validation && (
        <ValidationPanel result={fileState.validation} />
      )}

      {/* Preview */}
      {fileState && <SvgPreview dataUrl={fileState.dataUrl} name={fileState.name} />}

      {/* Form Fields */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">Icon Details</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Icon Name */}
          <div className="space-y-1.5">
            <label htmlFor="icon-name" className="text-xs font-medium text-muted-foreground">
              Icon name <span className="text-red-500">*</span>
            </label>
            <Input
              id="icon-name"
              placeholder="e.g. Vercel"
              value={form.iconName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="icon-slug" className="text-xs font-medium text-muted-foreground">
              Slug (kebab-case)
            </label>
            <Input
              id="icon-slug"
              placeholder="e.g. vercel"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label htmlFor="website-url" className="text-xs font-medium text-muted-foreground">
            Website URL
          </label>
          <Input
            id="website-url"
            type="url"
            placeholder="https://vercel.com"
            value={form.websiteUrl}
            onChange={(e) => updateField("websiteUrl", e.target.value)}
          />
        </div>

        {/* Brand Guidelines URL */}
        <div className="space-y-1.5">
          <label htmlFor="guidelines-url" className="text-xs font-medium text-muted-foreground">
            Brand guidelines URL
          </label>
          <Input
            id="guidelines-url"
            type="url"
            placeholder="https://vercel.com/brand"
            value={form.guidelinesUrl}
            onChange={(e) => updateField("guidelinesUrl", e.target.value)}
          />
        </div>

        {/* Brand Color */}
        <div className="space-y-1.5">
          <label htmlFor="brand-hex" className="text-xs font-medium text-muted-foreground">
            Brand hex color
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Palette className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="brand-hex"
                placeholder="000000"
                value={form.hex}
                onChange={(e) =>
                  updateField(
                    "hex",
                    e.target.value.replace(/[^0-9a-fA-F#]/g, "").replace(/^#+/, "")
                  )
                }
                maxLength={6}
                className="pl-8 font-mono uppercase"
              />
            </div>
            {form.hex.length === 6 && (
              <div
                className="h-8 w-8 shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: `#${form.hex}` }}
                aria-label={`Color preview: #${form.hex}`}
              />
            )}
          </div>
        </div>

        {/* Categories */}
        <CategorySelector
          categories={allCategories}
          selected={form.categories}
          onToggle={toggleCategory}
          newCategory={form.newCategory}
          onNewCategoryChange={(val) => updateField("newCategory", val)}
          onAddCategory={addNewCategory}
        />
      </div>

      {/* Submit Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
        <a
          href={canSubmit ? buildGitHubUrl() : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canSubmit}
          tabIndex={canSubmit ? undefined : -1}
          onClick={() => {
            if (canSubmit) {
              posthog.capture("submit_form_completed", {
                icon_name: form.iconName,
                slug: form.slug,
                categories: form.categories,
                has_website_url: !!form.websiteUrl,
                has_guidelines_url: !!form.guidelinesUrl,
                has_hex_color: form.hex.length === 6,
                validation_passed: fileState?.validation?.valid ?? false,
              });
            }
          }}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
            canSubmit
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "pointer-events-none cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          <Github className="h-4 w-4" />
          Submit via GitHub
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </a>

        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={!canSubmit}
          className="h-9 gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy className="h-4 w-4" />
              Copy Submission
            </>
          )}
        </Button>
      </div>

      {!canSubmit && (
        <p className="text-xs text-muted-foreground">
          Upload an SVG file and enter an icon name to enable submission.
        </p>
      )}
    </div>
  );
}
