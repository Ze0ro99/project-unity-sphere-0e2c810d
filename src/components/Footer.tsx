import { useTranslation } from "react-i18next";
import logo from "@/assets/pirc-logo.png";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="PiRC" width={28} height={28} className="h-7 w-7" loading="lazy" />
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{t("brand")}</span> · {t("tagline")}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PiRC. {t("footer.rights")} {t("footer.built")}
        </div>
      </div>
    </footer>
  );
}
