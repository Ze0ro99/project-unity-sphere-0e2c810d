import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { LANGS, getSavedLanguage, setAppLanguage } from "@/i18n";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LangSwitcher() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setAppLanguage(getSavedLanguage());
  }, []);
  const current = mounted
    ? (LANGS.find((l) => l.code === i18n.language) ?? LANGS[0])
    : LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-foreground/80 hover:text-foreground" aria-label={t("language")}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.label}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setAppLanguage(l.code)} className="gap-2 cursor-pointer">
            <span>{l.flag}</span> <span>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
