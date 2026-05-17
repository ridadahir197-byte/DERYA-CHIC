import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — DERYA Chic Admin" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings" as any)
        .select("phone,map_url")
        .maybeSingle();
      if (data) {
        const d = data as any;
        setPhone(d.phone ?? "");
        setMapUrl(d.map_url ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("store_settings" as any)
      .upsert({ singleton: true, phone, map_url: mapUrl }, { onConflict: "singleton" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Store info updated");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Configuration</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[0.04em] mt-2">Store Info &amp; Location</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These values power the public Localisation page and contact links.
        </p>
      </header>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : (
        <div className="glass rounded-2xl border border-border/60 p-6 md:p-8 space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" strokeWidth={1.6} /> Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 615-624760"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.6} /> Map link
            </label>
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.apple/p/..."
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-xs uppercase tracking-[0.22em] font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
