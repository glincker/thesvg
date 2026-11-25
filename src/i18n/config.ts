import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en.json";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, matchLocale, type LocaleCode } from "./locales";

type Bundle = Record<string, unknown>;

// Non-English bundles are split out so English visitors never download them.
const LOADERS: Record<Exclude<LocaleCode, "en">, () => Promise<{ default: Bundle }>> = {
  es: () => import("@/locales/es.json"),
  fr: () => import("@/locales/fr.json"),
  de: () => import("@/locales/de.json"),
  "pt-BR": () => import("@/locales/pt-BR.json"),
  ja: () => import("@/locales/ja.json"),
  ko: () => import("@/locales/ko.json"),
  "zh-CN": () => import("@/locales/zh-CN.json"),
  ru: () => import("@/locales/ru.json"),
  tr: () => import("@/locales/tr.json"),
  hi: () => import("@/locales/hi.json"),
};

// Always starts in English so the static HTML and first client render match;
// the saved or browser language is applied right after mount.
void i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export async function setLocale(code: LocaleCode): Promise<void> {
  if (code !== DEFAULT_LOCALE && !i18n.hasResourceBundle(code, "translation")) {
    const mod = await LOADERS[code as Exclude<LocaleCode, "en">]();
    i18n.addResourceBundle(code, "translation", mod.default, true, true);
  }
  await i18n.changeLanguage(code);
  document.documentElement.lang = code;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    /* storage unavailable: the choice only lasts for this visit */
  }
}

/** Saved choice first, then the browser language list, else English. */
export function detectLocale(): LocaleCode {
  const detector = new LanguageDetector(null, {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: LOCALE_STORAGE_KEY,
    caches: [],
  });
  const found = detector.detect();
  const tags = Array.isArray(found) ? found : found ? [found] : [];
  for (const tag of tags) {
    const m = matchLocale(tag);
    if (m) return m;
  }
  return DEFAULT_LOCALE;
}

export { i18n };
