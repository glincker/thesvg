import { getCategoryCounts, getIconsByCategory, getAllIcons } from "./src/lib/icons";

console.time("Original");
const brandCategories = getCategoryCounts("brands");
const awsCategories = getCategoryCounts("aws");

const samplesByCategory = new Map<string, { slug: string; src: string }[]>();
for (const cat of [...brandCategories, ...awsCategories]) {
  if (!samplesByCategory.has(cat.name)) {
    const icons = getIconsByCategory(cat.name).slice(0, 6);
    samplesByCategory.set(
      cat.name,
      icons.map((i) => ({
        slug: i.slug,
        src: i.variants.default,
      }))
    );
  }
}
console.timeEnd("Original");

console.time("Optimized");
const samplesByCategory2 = new Map<string, { slug: string; src: string }[]>();
const allIcons = getAllIcons();
for (let i = 0; i < allIcons.length; i++) {
  const icon = allIcons[i];
  const categories = icon.categories;
  for (let j = 0; j < categories.length; j++) {
    const cat = categories[j];
    let samples = samplesByCategory2.get(cat);
    if (!samples) {
      samples = [];
      samplesByCategory2.set(cat, samples);
    }
    if (samples.length < 6) {
      samples.push({ slug: icon.slug, src: icon.variants.default });
    }
  }
}
console.timeEnd("Optimized");
