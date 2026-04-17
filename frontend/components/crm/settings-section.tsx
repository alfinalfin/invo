import { CalendarRange, DatabaseZap, ShieldCheck } from "lucide-react";

type SettingsSectionProps = {
  sessionEmail: string;
  dataSourceLabel: string;
  leadDataPathLabel: string;
  rulesPreview: string;
};

export function SettingsSection({
  sessionEmail,
  dataSourceLabel,
  leadDataPathLabel,
  rulesPreview,
}: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-card-strong p-6 sm:p-8">
          <p className="soft-pill">Security and data</p>
          <h1 className="section-heading mt-5">
            Firebase-ready admin controls for the Invoaura CRM.
          </h1>
          <p className="subtle-copy mt-4">
            Leads sync from Firebase Authentication plus Firestore or Realtime
            Database using the paths shown below.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] bg-black/[0.03] p-5 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Authentication
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">
                Email/password admin sign-in with optional allowlist and custom
                `admin: true` Firebase claim support.
              </p>
            </div>
            <div className="rounded-[26px] bg-black/[0.03] p-5 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <DatabaseZap className="h-5 w-5 text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Live data sync
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">
                {dataSourceLabel} listeners update the inbox instantly and
                raise a live notification badge for newly added leads.
              </p>
            </div>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <p className="soft-pill">Connection status</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Workspace mode
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                Live Firebase
              </p>
            </div>
            <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Data source
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {dataSourceLabel}
              </p>
            </div>
            <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Lead path
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {leadDataPathLabel}
              </p>
            </div>
            <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Admin user
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {sessionEmail}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Environment checklist
              </p>
              <p className="text-sm text-muted">
                Add these keys in `.env.local` before deploying.
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-secondary">
            <li>`NEXT_PUBLIC_FIREBASE_API_KEY`</li>
            <li>`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`</li>
            <li>`NEXT_PUBLIC_FIREBASE_DATABASE_URL`</li>
            <li>`NEXT_PUBLIC_FIREBASE_PROJECT_ID`</li>
            <li>`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`</li>
            <li>`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`</li>
            <li>`NEXT_PUBLIC_FIREBASE_APP_ID`</li>
            <li>`NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS`</li>
            <li>`NEXT_PUBLIC_LEADS_COLLECTION`</li>
            <li>`NEXT_PUBLIC_RTDB_LEADS_PATH`</li>
          </ul>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Firebase rule baseline
              </p>
              <p className="text-sm text-muted">
                Use admin-only rules for whichever Firebase datastore you are
                connecting to.
              </p>
            </div>
          </div>
          <pre className="mt-6 overflow-x-auto rounded-[28px] bg-slate-950 p-5 text-xs leading-7 text-slate-100">
            <code>{rulesPreview}</code>
          </pre>
        </article>
      </section>
    </div>
  );
}
