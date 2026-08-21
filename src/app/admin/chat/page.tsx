import { requirePermission } from "@/lib/admin-guard";
import { ChatConsole } from "@/components/admin/chat-console";

export default async function AdminChatPage() {
  await requirePermission("chat.view");
  return <ChatConsole />;
}
