import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { useUpdateLanguage } from "@/hooks/user/useUpdateLanguage";
import { useAppLanguage } from "@/i18n/language-context";
import type { AppLanguage } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  component: function SettingsPage() {
    const { t } = useTranslation(["settings", "common"]);
    const { language, setLanguage, isSaving } = useAppLanguage();
    const updateLanguage = useUpdateLanguage();

    const handleLanguageChange = (next: AppLanguage) => {
      setLanguage(next);
      updateLanguage.mutate({ language: next });
    };

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Field>
              <FieldLabel htmlFor="settings-language">{t("languageLabel")}</FieldLabel>
              <FieldDescription id="language-description">
                {t("languageDescription")}
              </FieldDescription>
              <LanguageSelect
                id="settings-language"
                value={language}
                onValueChange={handleLanguageChange}
                disabled={isSaving}
                triggerClassName="w-full"
              />
            </Field>
            <Field>
              <FieldTitle>{t("themeLabel")}</FieldTitle>
              <FieldDescription id="theme-description">{t("themeDescription")}</FieldDescription>
              <ThemeToggle descriptionId="theme-description" />
            </Field>
          </CardContent>
        </Card>
      </div>
    );
  },
});
