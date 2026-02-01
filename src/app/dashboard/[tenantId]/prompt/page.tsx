import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import PromptEditor from "@/components/PromptEditor";
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
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Back to {config.name}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            System Prompt Editor
          </h1>
          <p className="mt-1 text-gray-600">{config.name}</p>

          {promptData && (
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Version: {promptData.version}</span>
              <span>
                Last updated:{" "}
                {new Date(promptData.updated_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {!promptData && (
            <p className="mt-2 text-sm text-yellow-600">
              Using default hardcoded prompt. Save to create a custom version.
            </p>
          )}
        </div>

        <PromptEditor
          tenantId={tenantId}
          initialPrompt={currentPrompt}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
