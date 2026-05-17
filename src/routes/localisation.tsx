import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PHONE = "+212 615-624760";
const DEFAULT_MAP = "https://maps.apple/p/01Io0xq0ZIbp7_";

export const Route = createFileRoute("/localisation")({
  head: () => ({
    meta: [
      { title: "Localisation — DERYA Chic" },
      { name: "description", content: "Visitez la boutique DERYA Chic. Adresse, contact et itinéraire." },
      { property: "og:title", content: "Localisation — DERYA Chic" },
      { property: "og:description", content: "Visitez la boutique DERYA Chic. Adresse, contact et itinéraire." },
    ],
  }),
  component: LocalisationPage,
});

function LocalisationPage() {
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [mapUrl, setMapUrl] = useState(DEFAULT_MAP);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings" as any)
        .select("phone,map_url")
        .maybeSingle();
      if (data) {
        const d = data as any;
        if (d.phone) setPhone(d.phone);
        if (d.map_url) setMapUrl(d.map_url);
      }
    })();
  }, []);

  const telHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  return (
    <div className="w-full max-w-full overflow-x-hidden px-5 md:px-10 py-16 md:py-24">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        <p className="text-[11px] uppercase tracking-[0.42em] text-muted-foreground">Boutique</p>
        <h1 className="mt-4 font-display text-3xl md:text-5xl font-light tracking-[0.32em] uppercase">
          Localisation
        </h1>
        <div className="mt-6 mx-auto w-12 h-px bg-foreground/30" />
        <p className="mt-6 text-sm text-muted-foreground tracking-wide">
          Rendez-nous visite ou contactez-nous directement.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-12 md:mt-16 mx-auto w-full max-w-lg glass-strong rounded-3xl border border-border/60 p-7 md:p-10 space-y-6"
      >
        {/* Phone row */}
        <a
          href={telHref}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-border/50 px-5 py-4 hover:bg-muted/30 transition-all duration-300"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="shrink-0 inline-flex w-10 h-10 rounded-full border border-border/60 items-center justify-center">
              <Phone className="w-4 h-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Téléphone</p>
              <p className="mt-1 font-display text-base tracking-wider truncate">{phone}</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:opacity-100 opacity-60 transition" strokeWidth={1.6} />
        </a>

        {/* Map row */}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-border/50 px-5 py-4 hover:bg-muted/30 transition-all duration-300"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="shrink-0 inline-flex w-10 h-10 rounded-full border border-border/60 items-center justify-center">
              <MapPin className="w-4 h-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Itinéraire</p>
              <p className="mt-1 font-display text-base tracking-wider">Ouvrir le plan</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:opacity-100 opacity-60 transition" strokeWidth={1.6} />
        </a>

        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3.5 text-[11px] uppercase tracking-[0.3em] font-semibold hover:opacity-90 transition"
        >
          <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
          Voir sur la carte
        </a>
      </motion.div>
    </div>
  );
}
