import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { TENANT_CONFIGS } from "@/lib/tenants";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantPage({ params }: PageProps) {
  const { tenantId } = await params;
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const { data: access, error } = await supabase
    .from("tenant_user_access")
    .select("tenant_id, role")
    .eq("user_id", user?.id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !access) {
    redirect("/dashboard");
  }

  const config = TENANT_CONFIGS[tenantId];
  if (!config) {
    notFound();
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
        <p className="mt-2 text-gray-600">{config.persona}</p>

        <div className="mt-4 flex items-center space-x-2">
          <span className="text-sm text-gray-500">Your role:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
            {access.role}
          </span>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Language</h3>
              <p className="text-sm text-gray-600 mt-1">
                {config.language === "no"
                  ? "Norwegian"
                  : config.language === "en"
                    ? "English"
                    : "Norwegian/English"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Features</h3>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-gray-600">
                  Synonym Mapping:{" "}
                  {config.features.synonymMapping ? "Enabled" : "Disabled"}
                </li>
                <li className="text-sm text-gray-600">
                  Code Block Formatting:{" "}
                  {config.features.codeBlockFormatting ? "Enabled" : "Disabled"}
                </li>
                <li className="text-sm text-gray-600">
                  Boat Expertise:{" "}
                  {config.features.boatExpertise ? "Enabled" : "Disabled"}
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Allowed Domains</h3>
              <p className="text-sm text-gray-600 mt-1">
                {config.allowedDomains
                  .filter((d) => !d.includes("localhost") && !d.includes("127.0.0.1"))
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href={`/dashboard/${tenantId}/analytics`}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <span className="font-medium text-blue-900">Analytics</span>
              <span className="text-sm text-blue-700">View chat statistics</span>
            </Link>

            <Link
              href={`/dashboard/${tenantId}/prompt`}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mb-2">✏️</div>
              <span className="font-medium text-green-900">System Prompt</span>
              <span className="text-sm text-green-700">Edit AI behavior</span>
            </Link>

            <Link
              href={`/dashboard/${tenantId}/content`}
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <span className="font-medium text-purple-900">Content</span>
              <span className="text-sm text-purple-700">Manage knowledge base</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
