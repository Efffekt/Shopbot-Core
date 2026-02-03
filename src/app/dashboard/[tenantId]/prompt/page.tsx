import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import PromptEditorWithTest from "@/components/PromptEditorWithTest";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function PromptEditorPage({ params }: PageProps) {
  const { tenantId } = await params;
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const { data: access, error: accessError } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id)
    .eq("tenant_id", tenantId)
    .single();

  if (accessError || !access) {
    redirect("/dashboard");
  }

  const config = TENANT_CONFIGS[tenantId];
  if (!config) {
    notFound();
  }

  const { data: promptData } = await supabase
    .from("tenant_prompts")
    .select("system_prompt, version, updated_at")
    .eq("tenant_id", tenantId)
    .single();

  const currentPrompt = promptData?.system_prompt || config.systemPrompt;
  const isAdmin = access.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/${tenantId}`}
          className="text-sm text-preik-text-muted hover:text-preik-text transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tilbake til {config.name}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-brand font-light text-preik-text">
          Systemprompt
        </h1>
        <p className="mt-1 text-preik-text-muted">{config.name}</p>

        {promptData && (
          <div className="mt-3 flex items-center gap-4 text-sm text-preik-text-muted">
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-preik-surface border border-preik-border">
              Versjon {promptData.version}
            </span>
            <span>
              Sist oppdatert: {new Date(promptData.updated_at).toLocaleDateString("no-NO")}
            </span>
          </div>
        )}

        {!promptData && (
          <p className="mt-3 text-sm text-preik-accent">
            Bruker standard prompt. Lagre for å lage en tilpasset versjon.
          </p>
        )}
      </div>

      <PromptEditorWithTest
        tenantId={tenantId}
        initialPrompt={currentPrompt}
        isAdmin={isAdmin}
        storeName={config.name}
      />
    </div>
  );
}
