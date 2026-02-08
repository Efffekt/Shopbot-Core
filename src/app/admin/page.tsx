import { getUser } from "@/lib/supabase-server";
import { SUPER_ADMIN_EMAILS } from "@/lib/admin-emails";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const user = await getUser();
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");

  return <AdminPanel isSuperAdmin={isSuperAdmin} />;
}
