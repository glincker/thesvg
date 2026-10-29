import type { Metadata } from "next";
import { CategoriesIndex } from "@/components/ui-icons/category-page";

export const metadata: Metadata = {
  title: "UI icon categories",
  description: "Browse every UI icon category: interface, arrows, status, files, dev, security, space, robotics, agents and more.",
  alternates: { canonical: "https://thesvg.org/ui/categories" },
};

export default function UiCategories() {
  return <CategoriesIndex />;
}
