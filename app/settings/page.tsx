"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useT } from "@/lib/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const { t, lang, setLang } = useT();
  useEffect(() => {
    let mounted = true;
    const BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
    if (BYPASS) {
      if (mounted) setEmail("developer@localhost");
      return () => { mounted = false; };
    }
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        setEmail(data.session?.user?.email || "");
      })
      .catch(() => { if (mounted) setEmail(""); });
    const { data: sub } = supabase.auth.onAuthStateChange((_: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      setEmail(session?.user?.email || "");
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">{t("settings.title")}</h1>
      <div className="card p-4 max-w-xl mb-4">
        <label htmlFor="lang" className="block text-sm mb-1">{t("settings.language")}</label>
        <select
          id="lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="th">{t("settings.langTh")}</option>
          <option value="en">{t("settings.langEn")}</option>
        </select>
      </div>
      <div className="card p-4 max-w-xl space-y-4">
        <div>
          <div className="text-sm text-neutral-600">{t("settings.signedInEmail")}</div>
          <div className="mt-1 text-base">{email || t("common.notAvailable")}</div>
        </div>
        <div className="flex justify-end">
          <button
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
          >
            {t("common.signOut")}
          </button>
        </div>
      </div>
      <div className="card p-4 max-w-xl mt-4">
        <div className="text-sm text-neutral-600">{t("settings.contactSupport")}</div>
        <p className="mt-1 text-sm">
          {t("settings.contactLine")}
          {' '}
          <a href="mailto:support@myswipes.app" className="underline">support@myswipes.app</a>.
        </p>
      </div>
    </div>
  );
}
