import { t } from "@/lib/i18n/translations";

export function SiteFooter() {
  return (
    <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 space-y-2">
      <div className="h-px bg-white/8" />
      <p className="text-mist text-xs font-sans leading-relaxed pt-2">
        {t("methodologyNote")}
      </p>
      <p className="text-mist text-xs font-sans">
        {t("gcpAttribution")} {t("cloudflareNote")}
      </p>
      <div className="pt-5 border-t border-white/5 flex justify-center">
        <a
          href="https://mizarnevelli.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-mist/40 text-[10px] tracking-[0.2em] hover:text-mist transition-colors duration-300"
        >
          built with ♥ by Mizar
        </a>
      </div>
    </footer>
  );
}
