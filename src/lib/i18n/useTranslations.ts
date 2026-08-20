import en from "@/locales/en.json";

type Key = keyof typeof en;

export function useTranslations() {
  return function t(key: Key, vars?: Record<string, string | number>): string {
    let value = ((en as Record<string, string>)[key]) ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  };
}
