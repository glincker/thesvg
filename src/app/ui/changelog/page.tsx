import type { Metadata } from "next";
import { Changelog } from "@/components/ui-icons/changelog";

export const metadata: Metadata = { title: "UI Icons changelog", description: "Every drop of UI icons, newest first." };

export default function ChangelogPage() {
  return <Changelog />;
}
