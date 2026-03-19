import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useListStaffApplications, useReviewStaffApplication, useListUsers, useUpdateUserStatus } from "@workspace/api-client-react";
import { ShieldCheck, Check, X, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ModPanel() {
  const [tab, setTab] = useState<'apps' | 'members'>('apps');
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  
  const { data: apps, refetch: refetchApps } = useListStaffApplications();
  const { data: users, refetch: refetchUsers } = useListUsers();
  
  const reviewApp = useReviewStaffApplication();
  const updateStatus = useUpdateUserStatus();
  const { toast } = useToast();

  const pendingApps = apps?.filter(a => a.status === 'pending') || [];

  const handleReview = (id: number, status: string) => {
    reviewApp.mutate({ id, data: { status, reviewNote } }, {
      onSuccess: () => {
        toast({ title: "Application Updated", description: `Application has been ${status}.` });
        setReviewingId(null);
        setReviewNote("");
        refetchApps();
      },
      onError: (err: any) => {
        toast({ title: "Action Failed", description: err.data?.error || "Error occurred.", variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Member Updated", description: `Status changed to ${newStatus}.` });
        refetchUsers();
      }
    });
  };

  return (
    <PortalLayout requireRole={['moderator', 'admin']}>
      <div className="space-y-8">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-accent/20 text-accent rounded flex items-center justify-center clip-angled-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-foreground">Moderator Terminal</h1>
            <p className="text-muted-foreground font-sans">Review applications and manage personnel status.</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setTab('apps')}
            className={`px-6 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
              tab === 'apps' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Applications {pendingApps.length > 0 && `(${pendingApps.length})`}
          </button>
          <button
            onClick={() => setTab('members')}
            className={`px-6 py-3 font-display font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${
              tab === 'members' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Personnel Roster
          </button>
        </div>

        {/* Tab: Applications */}
        {tab === 'apps' && (
          <div className="space-y-4">
            {pendingApps.length === 0 ? (
              <div className="bg-card border border-border border-dashed p-12 rounded flex flex-col items-center justify-center text-muted-foreground text-center">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-display uppercase tracking-widest text-lg">No Pending Applications</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="bg-card border border-border rounded clip-angled-sm p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <h3 className="font-display font-bold uppercase tracking-wider text-xl text-primary">{app.gamertag}</h3>
                      <p className="text-sm font-sans text-muted-foreground">User: {app.username} | Submitted: {format(new Date(app.createdAt), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-2">Supported Sectors</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.games.map(g => (
                        <span key={g} className="bg-secondary px-2 py-1 rounded text-xs font-sans text-foreground border border-border">{g}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-2">Experience</h4>
                      <p className="font-sans text-sm bg-background p-3 rounded border border-border whitespace-pre-wrap">{app.experience}</p>
                    </div>
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-muted-foreground mb-2">Motivation</h4>
                      <p className="font-sans text-sm bg-background p-3 rounded border border-border whitespace-pre-wrap">{app.motivation}</p>
                    </div>
                  </div>

                  {reviewingId === app.id ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-border mt-4">
                      <textarea 
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add review notes (optional)..."
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-sans mb-4 focus:outline-none focus:border-primary"
                        rows={2}
                      />
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setReviewingId(null)} className="px-4 py-2 font-display font-bold uppercase tracking-wider text-xs border border-border rounded hover:bg-secondary">
                          Cancel
                        </button>
                        <button onClick={() => handleReview(app.id, 'rejected')} className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2 font-display font-bold uppercase tracking-wider text-xs rounded transition-colors">
                          <X className="w-4 h-4" /> Reject
                        </button>
                        <button onClick={() => handleReview(app.id, 'approved')} className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 font-display font-bold uppercase tracking-wider text-xs rounded transition-colors">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="pt-4 border-t border-border mt-4 flex justify-end">
                      <button onClick={() => setReviewingId(app.id)} className="bg-accent text-accent-foreground px-6 py-2 rounded clip-angled-sm font-display font-bold uppercase tracking-wider text-sm hover:bg-accent/90 transition-colors">
                        Review Application
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Members */}
        {tab === 'members' && (
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-secondary/50 font-display font-bold uppercase tracking-wider text-muted-foreground text-xs">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-display font-bold uppercase tracking-widest border ${
                          u.role === 'admin' ? 'border-destructive text-destructive' : 
                          u.role === 'moderator' ? 'border-accent text-accent' : 
                          u.role === 'staff' ? 'border-blue-400 text-blue-400' : 
                          'border-border text-muted-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${u.status === 'active' ? 'text-primary' : 'text-destructive'}`}>
                          <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-primary' : 'bg-destructive'}`}></span>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(u.createdAt), "MMM dd, yyyy")}</td>
                      <td className="px-6 py-4 text-right">
                        <select 
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value)}
                          disabled={updateStatus.isPending || u.role === 'admin'}
                          className="bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
