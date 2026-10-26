import type { Metadata } from "next";
import { Changelog } from "@/components/ui-icons/changelog";

export const metadata: Metadata = { title: "What is new", description: "Every drop of UI icons, newest first." };

export default function ChangelogPage() {
  return <Changelog />;
}
