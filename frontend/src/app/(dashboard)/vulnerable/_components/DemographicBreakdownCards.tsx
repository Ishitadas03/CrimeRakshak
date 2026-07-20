"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sociologicalDetails, type SocioCategoryDetail } from "@/data/sociologicalData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import { ShieldAlert, Baby, Users, ArrowUpRight, ArrowDownRight, MapPin } from "lucide-react";

export default function DemographicBreakdownCards({ details = sociologicalDetails }: { details?: SocioCategoryDetail[] }) {
  const { t } = useLanguage();

  const getGroupHeaderIcon = (category: string) => {
    switch (category) {
      case "Women":
        return <ShieldAlert className="w-5 h-5 text-brand-pink" />;
      case "Children":
        return <Baby className="w-5 h-5 text-brand-amber" />;
      default:
        return <Users className="w-5 h-5 text-brand-teal" />;
    }
  };

  const getGroupBorderColor = (category: string) => {
    switch (category) {
      case "Women":
        return "border-brand-pink/30 hover:border-brand-pink";
      case "Children":
        return "border-brand-amber/30 hover:border-brand-amber";
      default:
        return "border-brand-teal/30 hover:border-brand-teal";
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">
          {t("Sociological Sub-Head & Risk Driver Analysis")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Granular head-wise sociological context and geographical cluster drivers")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {details.map((group, idx) => (
          <Card
            key={group.category}
            className={`glass-card transition-all duration-300 border ${getGroupBorderColor(group.category)} flex flex-col`}
          >
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading flex items-center gap-2 text-foreground">
                  {getGroupHeaderIcon(group.category)}
                  {t(group.category)}
                </CardTitle>
                <div
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    group.yoyChangePct > 0
                      ? "bg-brand-red/10 text-brand-red border border-brand-red/20"
                      : "bg-brand-green/10 text-brand-green border border-brand-green/20"
                  }`}
                >
                  {group.yoyChangePct > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {group.yoyChangePct > 0 ? "+" : ""}
                  {group.yoyChangePct}% {t("YoY")}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-brand-purple" />
                <span>{t("Top Risk Clusters:")}</span>
                <span className="font-semibold text-foreground">
                  {group.hotspotDistricts.map((h) => t(h)).join(", ")}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              {/* Sub-categories */}
              <div className="space-y-3">
                {group.subCategories.map((sub) => (
                  <div
                    key={sub.name}
                    className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {t(sub.name)}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {sub.cases.toLocaleString()}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({sub.sharePct}%)
                        </span>
                      </span>
                    </div>
                    {/* Share progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-purple"
                        style={{ width: `${sub.sharePct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground italic leading-tight">
                      &ldquo;{t(sub.sociologicalContext)}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              {/* Sociological Drivers */}
              <div className="pt-3 border-t border-border/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {t("Key Sociological Risk Drivers")}
                </p>
                <ul className="space-y-1.5">
                  {group.keyDrivers.map((driver, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-foreground/90 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-1.5 shrink-0" />
                      <span>{t(driver)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
