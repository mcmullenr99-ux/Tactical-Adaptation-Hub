import { PortalLayout } from "@/components/layout/PortalLayout";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import { Settings, Shield } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const { data: users, refetch } = useListUsers();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const handleRoleChange = (id: number, newRole: string) => {
    updateRole.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => {
        toast({ title: "Role Updated", description: `User role has been changed to ${newRole}.` });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.data?.error || "Error updating role.", variant: "destructive" });
      }
    });
  };

  return (
    <PortalLayout requireRole={['admin']}>
      <div className="space-y-8">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-destructive/20 text-destructive rounded flex items-center justify-center clip-angled-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Command Console</h1>
            <p className="text-muted-foreground font-sans">Full administrative override privileges.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded overflow-hidden shadow-lg">
          <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
            <Shield className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-bold uppercase tracking-wider text-lg">Global Personnel Registry</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-secondary/50 font-display font-bold uppercase tracking-wider text-muted-foreground text-xs">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Clearance Level (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users?.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">#{u.id}</td>
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                      {u.status === 'suspended' && <span className="w-2 h-2 rounded-full bg-destructive" title="Suspended"></span>}
                      {u.username}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(u.createdAt), "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updateRole.isPending}
                        className={`bg-background border rounded px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${
                          u.role === 'admin' ? 'border-destructive text-destructive' : 
                          u.role === 'moderator' ? 'border-accent text-accent' : 
                          u.role === 'staff' ? 'border-blue-400 text-blue-400' : 
                          'border-border text-muted-foreground'
                        }`}
                      >
                        <option value="member">Member</option>
                        <option value="staff">Staff</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
