import en from "@/locales/en.json";

type Translations = typeof en;
type Namespace = keyof Translations;
// Keys of a given namespace that map to string values (not objects)
type StringKeys<N extends Namespace> = {
  [K in keyof Translations[N]]: Translations[N][K] extends string ? K : never;
}[keyof Translations[N]];

/**
 * Returns a typed `t()` function scoped to a JSON namespace.
 * Zero runtime dependencies — reads directly from the bundled JSON.
 * To add a language, swap the import based on an `Accept-Language` signal.
 *
 * Usage:
 *   const t = useTranslations("board");
 *   t("unitMs")          // "ms"
 *   t("providerAws")     // "AWS"
 */
export function useTranslations<N extends Namespace>(namespace: N) {
  const ns = en[namespace] as Record<string, string>;
  return function t(key: StringKeys<N> & string, vars?: Record<string, string | number>): string {
    let value = ns[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  };
}
