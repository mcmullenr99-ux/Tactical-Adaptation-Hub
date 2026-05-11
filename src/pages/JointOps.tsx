import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Swords, Trophy, Shield, Users, Send, ChevronDown, ChevronUp, MessageSquare,
  Clock, CheckCircle2, XCircle, AlertTriangle, Star, TrendingUp,
  Zap, Flag, ExternalLink, Info
} from "lucide-react";

const API = "https://agent-tag-lead-developer-cff87ae4.base44.app/functions";

/* ── CAPABILITY TIER CONFIG ── */
// Maps directly to the Operational Capability Tier system used in unit verification
export type CapTier = "SOF" | "SOC" | "STRATEGIC" | "OPERATIONAL" | "TACTICAL" | "LIMITED" | "POOR";

const CAP_TIERS: CapTier[] = ["SOF", "SOC", "STRATEGIC", "OPERATIONAL", "TACTICAL", "LIMITED", "POOR"];

const CAP_TIER_META: Record<CapTier, {
  label: string; shortLabel: string; numeric: number;
  color: string; bg: string; dotCls: string;
  threshold: number; thresholdLabel: string;
}> = {
  SOF:         { label: "Special Operations Forces",  shortLabel: "SOF",         numeric: 7, color: "text-purple-300",  bg: "bg-purple-900/20 border-purple-500/30",  dotCls: "bg-purple-400",  threshold: 1200, thresholdLabel: "1200+ pts" },
  SOC:         { label: "Special Operations Capable", shortLabel: "SOC",         numeric: 6, color: "text-blue-300",    bg: "bg-blue-900/20 border-blue-400/30",      dotCls: "bg-blue-400",    threshold: 900,  thresholdLabel: "900–1199 pts" },
  STRATEGIC:   { label: "Strategically Capable",      shortLabel: "STRATEGIC",   numeric: 5, color: "text-green-300",   bg: "bg-green-900/20 border-green-400/30",    dotCls: "bg-green-400",   threshold: 650,  thresholdLabel: "650–899 pts" },
  OPERATIONAL: { label: "Operationally Capable",      shortLabel: "OPERATIONAL", numeric: 4, color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-500/30",dotCls: "bg-emerald-400", threshold: 400,  thresholdLabel: "400–649 pts" },
  TACTICAL:    { label: "Tactically Capable",         shortLabel: "TACTICAL",    numeric: 3, color: "text-yellow-400",  bg: "bg-yellow-900/20 border-yellow-400/30",  dotCls: "bg-yellow-400",  threshold: 200,  thresholdLabel: "200–399 pts" },
  LIMITED:     { label: "Limited Capability",         shortLabel: "LIMITED",     numeric: 2, color: "text-amber-400",   bg: "bg-amber-900/20 border-amber-500/30",    dotCls: "bg-amber-400",   threshold: 75,   thresholdLabel: "75–199 pts" },
  POOR:        { label: "Poor Capability",            shortLabel: "POOR",        numeric: 1, color: "text-red-400",     bg: "bg-red-900/20 border-red-500/30",        dotCls: "bg-red-400",     threshold: 0,    thresholdLabel: "0–74 pts" },
};

function getTierFromPoints(pts: number): CapTier {
  if (pts >= 1200) return "SOF";
  if (pts >= 900)  return "SOC";
  if (pts >= 650)  return "STRATEGIC";
  if (pts >= 400)  return "OPERATIONAL";
  if (pts >= 200)  return "TACTICAL";
  if (pts >= 75)   return "LIMITED";
  return "POOR";
}

function getCapTierNumeric(tier: CapTier): number {
  return CAP_TIER_META[tier]?.numeric ?? 1;
}

function calcPoints(outcome: "win" | "draw" | "loss", myTier: CapTier, oppTier: CapTier) {
  const myN = getCapTierNumeric(myTier);
  const oppN = getCapTierNumeric(oppTier);
  if (outcome === "win") return Math.round(100 * (oppN / myN));
  if (outcome === "draw") return Math.round(100 * (oppN / myN) * 0.4);
  return -25;
}

const GAMES = ["Arma 3", "Arma Reforger", "Squad", "DayZ", "Hell Let Loose", "Escape from Tarkov", "Other"];
const OP_TYPES = ["competitive", "cooperative", "training_exercise"] as const;
const OP_TYPE_LABELS = { competitive: "Competitive", cooperative: "Cooperative", training_exercise: "Training Exercise" };

/* ── LEADERBOARD ── */
function Leaderboard({ records }: { records: any[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "wins" | "ops" | "winrate">("points");
  const [filterTier, setFilterTier] = useState<"all" | CapTier>("all");

  const allTiers = useMemo(() => Array.from(new Set(records.map(r => (CAP_TIER_META[r.tier as CapTier] ? r.tier : getTierFromPoints(r.total_points || 0)) as CapTier))), [records]);

  const filtered = useMemo(() => {
    return [...records]
      .filter(r => {
        if (search && !r.group_name?.toLowerCase().includes(search.toLowerCase()) && !r.group_tag?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterTier !== "all") {
          const tier: CapTier = (CAP_TIER_META[r.tier as CapTier] ? r.tier : null) || getTierFromPoints(r.total_points || 0);
          if (tier !== filterTier) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "points")  return (b.total_points || 0) - (a.total_points || 0);
        if (sortBy === "wins")    return (b.wins || 0) - (a.wins || 0);
        if (sortBy === "ops")     return (b.ops_played || 0) - (a.ops_played || 0);
        if (sortBy === "winrate") return (b.win_rate || 0) - (a.win_rate || 0);
        return 0;
      });
  }, [records, search, sortBy, filterTier]);

  // Top 3 by points for podium (always from full unfiltered, sorted by points)
  const podium = useMemo(() => [...records].sort((a,b) => (b.total_points||0)-(a.total_points||0)).slice(0,3), [records]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="font-display font-black uppercase tracking-widest text-sm">Leaderboard</span>
        <span className="ml-auto text-xs text-muted-foreground font-sans">{records.length} unit{records.length !== 1 ? "s" : ""} ranked</span>
      </div>

      {records.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground font-sans text-sm">No combat records yet. Issue a challenge to get on the board.</div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {podium.length >= 2 && (
            <div className="border-b border-border px-6 py-6 flex items-end justify-center gap-4">
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((r) => {
                const rank = r === podium[0] ? 1 : r === podium[1] ? 2 : 3;
                const tier: CapTier = (CAP_TIER_META[r.tier as CapTier] ? r.tier : null) || getTierFromPoints(r.total_points || 0);
                const tierMeta = CAP_TIER_META[tier];
                const barH = rank === 1 ? "h-20" : rank === 2 ? "h-14" : "h-10";
                const rankColor = rank === 1 ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/5" : rank === 2 ? "text-slate-300 border-slate-400/40 bg-slate-400/5" : "text-amber-600 border-amber-600/40 bg-amber-600/5";
                return (
                  <div key={r.id ?? r.group_id} className="flex flex-col items-center gap-1 w-32">
                    <div className={`text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${tierMeta.bg} ${tierMeta.color}`}>{tierMeta.shortLabel}</div>
                    <p className="font-display font-bold text-xs text-foreground text-center line-clamp-1">{r.group_tag ? `[${r.group_tag}]` : r.group_name}</p>
                    <div className={`w-full ${barH} rounded-t border-2 ${rankColor} flex flex-col items-center justify-center gap-0.5`}>
                      <Trophy className={`w-4 h-4 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : "text-amber-600"}`} />
                      <span className={`font-display font-black text-sm ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : "text-amber-600"}`}>#{rank}</span>
                    </div>
                    <p className="font-display font-black text-xs text-primary">{r.total_points || 0} pts</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controls */}
          <div className="border-b border-border px-4 py-3 flex flex-wrap gap-2 items-center">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search unit…"
              className="px-3 py-1.5 text-xs bg-background border border-border rounded font-sans text-foreground focus:outline-none focus:border-primary w-40"
            />
            <select
              value={filterTier} onChange={e => setFilterTier(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-background border border-border rounded font-sans text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">All Tiers</option>
              {CAP_TIERS.filter(t => allTiers.includes(t)).map(t => (
                <option key={t} value={t}>{CAP_TIER_META[t].shortLabel}</option>
              ))}
            </select>
            <div className="flex gap-1 ml-auto">
              {(["points","wins","ops","winrate"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider rounded border transition-all ${sortBy === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}>
                  {s === "points" ? "Pts" : s === "wins" ? "Wins" : s === "ops" ? "Ops" : "W%"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-sans text-sm">No units match your filters.</div>
            ) : (
              filtered.map((r, i) => {
                const tier: CapTier = (CAP_TIER_META[r.tier as CapTier] ? r.tier : null) || getTierFromPoints(r.total_points || 0);
                const tierMeta = CAP_TIER_META[tier];
                const globalRank = [...records].sort((a,b)=>(b.total_points||0)-(a.total_points||0)).findIndex(x => x === r) + 1;
                const streak = r.current_streak ?? 0;
                const wr = r.win_rate != null ? Math.round(r.win_rate) : (r.ops_played ? Math.round(((r.wins||0)/r.ops_played)*100) : 0);
                return (
                  <div key={r.id ?? r.group_id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors ${globalRank === 1 ? "bg-yellow-900/5" : ""}`}>
                    <span className={`font-display font-black text-base w-6 text-center shrink-0 ${globalRank === 1 ? "text-yellow-400" : globalRank === 2 ? "text-slate-300" : globalRank === 3 ? "text-amber-600" : "text-muted-foreground/50"}`}>
                      {globalRank}
                    </span>
                    <div className={`px-2 py-0.5 rounded border text-[10px] font-display font-bold uppercase tracking-wider shrink-0 ${tierMeta.bg} ${tierMeta.color}`}>
                      {tierMeta.shortLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-foreground text-sm truncate">
                        {r.group_tag ? <span className="text-muted-foreground mr-1">[{r.group_tag}]</span> : null}{r.group_name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-green-400 font-bold">{r.wins||0}W</span>
                        <span className="text-[10px] text-muted-foreground">{r.draws||0}D</span>
                        <span className="text-[10px] text-red-400">{r.losses||0}L</span>
                        <span className="text-[10px] text-muted-foreground font-sans">· {r.ops_played||0} ops · {wr}% WR</span>
                        {streak !== 0 && (
                          <span className={`text-[10px] font-display font-bold flex items-center gap-0.5 ${streak > 0 ? "text-green-400" : "text-red-400"}`}>
                            <TrendingUp className="w-2.5 h-2.5" />{streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-black text-primary text-lg leading-none">{r.total_points || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-sans">pts</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── CHALLENGE CARD ── */
function ChallengeCard({ challenge, myGroupIds, onAction }: { challenge: any; myGroupIds: string[]; onAction: () => void }) {
  const [responding, setResponding] = useState(false);
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const isDefender = myGroupIds.includes(challenge.defender_group_id);
  const isChallenger = myGroupIds.includes(challenge.challenger_group_id);
  const isPending = challenge.status === "pending";

  const respond = async (accept: boolean) => {
    setResponding(true);
    try {
      const d = await apiFetch<any>(`/jointOpsAction`, {
        method: "POST",
        body: JSON.stringify({ action: accept ? "accept" : "decline", challenge_id: challenge.id, note }),
      });
      if (d.error) throw new Error(d.error);
      toast({ title: accept ? "Challenge Accepted!" : "Challenge Declined", description: accept ? "Op scheduled. Coordinate with your opponent." : "Response sent." });
      onAction();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResponding(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    accepted: "text-green-400 border-green-400/30 bg-green-400/10",
    declined: "text-red-400 border-red-400/30 bg-red-400/10",
    expired: "text-muted-foreground border-border bg-secondary/50",
    cancelled: "text-muted-foreground border-border bg-secondary/50",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-black text-foreground">{challenge.challenger_group_name}</span>
            <Swords className="w-4 h-4 text-primary" />
            <span className="font-display font-black text-foreground">{challenge.defender_group_name}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-sans">
            <span>{challenge.game}</span>
            <span>·</span>
            <span>{OP_TYPE_LABELS[challenge.op_type as keyof typeof OP_TYPE_LABELS] || challenge.op_type}</span>
            {challenge.proposed_date && <><span>·</span><span>{new Date(challenge.proposed_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></>}
          </div>
        </div>
        <span className={`shrink-0 text-xs font-display font-bold uppercase tracking-wider px-3 py-1 rounded border ${statusColors[challenge.status] || statusColors.pending}`}>
          {challenge.status}
        </span>
      </div>
      {challenge.message && (
        <p className="text-sm text-muted-foreground font-sans italic border-l-2 border-primary/40 pl-3">&ldquo;{challenge.message}&rdquo;</p>
      )}
      {isDefender && isPending && (
        <div className="flex flex-col gap-2 mt-1">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional response note..."
            className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground resize-none h-16 focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => respond(true)}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-display font-bold uppercase tracking-wider text-xs py-2 rounded transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => respond(false)}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-800/60 border border-red-600/40 text-red-400 font-display font-bold uppercase tracking-wider text-xs py-2 rounded transition-all"
            >
              <XCircle className="w-4 h-4" /> Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── RESULT SUBMISSION MODAL ── */
function SubmitResultModal({ op, myGroupId, onClose, onDone }: { op: any; myGroupId: string; onClose: () => void; onDone: () => void }) {
  const [outcome, setOutcome] = useState<"" | "group_a_win" | "group_b_win" | "draw">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isGroupA = myGroupId === op.group_a_id;

  const submit = async () => {
    if (!outcome) return;
    setSubmitting(true);
    try {
      const d = await apiFetch<any>(`/jointOpsAction`, {
        method: "POST",
        body: JSON.stringify({ action: "submit_result", op_id: op.id, outcome, outcome_note: note, submitted_by_group: myGroupId }),
      });
      if (d.error) throw new Error(d.error);
      toast({ title: "Result Submitted", description: "Waiting for opponent confirmation." });
      onDone();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const outcomes = [
    { value: "group_a_win", label: `${op.group_a_name} Win` },
    { value: "group_b_win", label: `${op.group_b_name} Win` },
    { value: "draw", label: "Draw" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
        <h3 className="font-display font-black text-lg uppercase tracking-widest mb-4">Submit Result</h3>
        <p className="text-sm text-muted-foreground font-sans mb-4">{op.group_a_name} vs {op.group_b_name}</p>
        <div className="flex flex-col gap-2 mb-4">
          {outcomes.map(o => (
            <button
              key={o.value}
              onClick={() => setOutcome(o.value as any)}
              className={`px-4 py-3 rounded border font-display font-bold text-sm uppercase tracking-wider transition-all ${outcome === o.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="After action notes (optional)..."
          className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground resize-none h-20 focus:outline-none focus:border-primary/50 mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded font-display font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all">Cancel</button>
          <button
            onClick={submit}
            disabled={!outcome || submitting}
            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-display font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── ISSUE CHALLENGE MODAL ── */
function IssueChallengeModal({ myGroup, allGroups, onClose, onDone }: { myGroup: any; allGroups: any[]; onClose: () => void; onDone: () => void }) {
  const [targetId, setTargetId] = useState("");
  const [game, setGame] = useState(GAMES[0]);
  const [opType, setOpType] = useState<typeof OP_TYPES[number]>("competitive");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const eligible = allGroups.filter(g => g.id !== myGroup.id && g.status === "approved");

  const submit = async () => {
    if (!targetId) return;
    setSubmitting(true);
    try {
      const d = await apiFetch<any>(`/jointOpsAction`, {
        method: "POST",
        body: JSON.stringify({
          action: "issue_challenge",
          challenger_group_id: myGroup.id,
          challenger_group_name: myGroup.name,
          challenger_group_tag: myGroup.tag || "",
          defender_group_id: targetId,
          defender_group_name: eligible.find(g => g.id === targetId)?.name || "",
          defender_group_tag: eligible.find(g => g.id === targetId)?.tag || "",
          game,
          op_type: opType,
          proposed_date: date || null,
          message,
        }),
      });
      if (d.error) throw new Error(d.error);
      toast({ title: "Challenge Issued!", description: "Awaiting response from the defender." });
      onDone();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-black text-lg uppercase tracking-widest mb-1 flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" /> Issue Challenge
        </h3>
        <p className="text-xs text-muted-foreground font-sans mb-5">Challenging as <span className="text-foreground font-bold">{myGroup.name}</span></p>

        <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">Target Unit *</label>
        <select value={targetId} onChange={e => setTargetId(e.target.value)}
          className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50 mb-4">
          <option value="">Select a unit...</option>
          {eligible.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">Game *</label>
        <select value={game} onChange={e => setGame(e.target.value)}
          className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50 mb-4">
          {GAMES.map(g => <option key={g}>{g}</option>)}
        </select>

        <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">Op Type *</label>
        <div className="flex gap-2 mb-4">
          {OP_TYPES.map(t => (
            <button key={t} onClick={() => setOpType(t)}
              className={`flex-1 py-2 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${opType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {OP_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">Proposed Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary/50 mb-4" />

        <label className="block text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-1">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Optional message to the opposing commander..."
          className="w-full bg-background border border-border rounded p-2 text-sm font-sans text-foreground resize-none h-20 focus:outline-none focus:border-primary/50 mb-5" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded font-display font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all">Cancel</button>
          <button onClick={submit} disabled={!targetId || submitting}
            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-display font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
            {submitting ? "Sending..." : "Issue Challenge"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── ANTI-FRAUD INFO ── */
function AntiFraudBadge() {
  const [open, setOpen] = useState(false);
  const layers = [
    "Result requires confirmation from BOTH commanders",
    "Eyewitness validation from neutral roster members",
    "Auto-dispute flag if both claim victory",
    "Admin review panel for contested outcomes",
    "Rate limiting: max 3 ops per group per week",
    "Tier protection: >3 tier gap ops are flagged for review",
  ];
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-sans transition-all">
        <Shield className="w-3.5 h-3.5 text-green-400" /> 6-Layer Anti-Fraud <Info className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 bottom-full mb-2 z-[200] bg-card border border-border rounded-lg p-4 w-72 shadow-xl">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-foreground mb-3">Anti-Fraud Layers</p>
            {layers.map((l, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-green-400 font-display font-bold text-xs mt-0.5">{i + 1}.</span>
                <span className="text-xs text-muted-foreground font-sans">{l}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function JointOps({ standalone = true }: { standalone?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const [records, setRecords] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"leaderboard" | "challenges" | "ops">("leaderboard");
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<any | null>(null);
  const [selectedMyGroup, setSelectedMyGroup] = useState<any | null>(null);

  const myGroupIds = myGroups.map(g => g.id);

  const load = async () => {
    setLoading(true);
    try {
      const fetches: Promise<any>[] = [
        fetch(`${API}/jointOpsData?type=records`).then(r => r.json()),
        fetch(`${API}/jointOpsData?type=challenges`).then(r => r.json()),
        fetch(`${API}/jointOpsData?type=ops`).then(r => r.json()),
        fetch(`${API}/jointOpsData?type=groups`).then(r => r.json()),
      ];
      if (isAuthenticated) {
        fetches.push(apiFetch<any>(`/jointOpsData?type=my-groups`));
      }
      const [recData, chalData, opData, grpData, myGrpData] = await Promise.all(fetches);
      setRecords(recData.records || []);
      setChallenges(chalData.challenges || []);
      setOps(opData.ops || []);
      setAllGroups(grpData.groups || []);

      if (isAuthenticated && myGrpData) {
        const myG = myGrpData.groups || [];
        setMyGroups(myG);
        if (myG.length === 1) setSelectedMyGroup(myG[0]);
      }
    } catch (e: any) {
      toast({ title: "Load Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const myChallenges = challenges.filter(c => myGroupIds.includes(c.challenger_group_id) || myGroupIds.includes(c.defender_group_id));
  const myOps = ops.filter(o => myGroupIds.includes(o.group_a_id) || myGroupIds.includes(o.group_b_id));
  const pendingInbound = myChallenges.filter(c => c.status === "pending" && myGroupIds.includes(c.defender_group_id));

  const inner = (
    <>
      {/* Community Tab Navigation */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            <Link href="/milsim" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === '/milsim' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Shield className="w-3.5 h-3.5" /> Registry
            </Link>
            <Link href="/forum" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === '/forum' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <MessageSquare className="w-3.5 h-3.5" /> Forums
            </Link>
            <Link href="/joint-ops" className={`flex items-center gap-2 px-5 py-3.5 text-sm font-display font-bold uppercase tracking-widest border-b-2 transition-colors ${location === '/joint-ops' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Swords className="w-3.5 h-3.5" /> Joint Operations
            </Link>
          </div>
        </div>
      </div>
      {/* Hero — only shown on standalone /joint-ops page */}
      {standalone && <div className="relative bg-secondary/30 border-b border-border py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-3"
          style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 40px,hsl(var(--border)) 40px,hsl(var(--border)) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,hsl(var(--border)) 40px,hsl(var(--border)) 41px)` }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-4">
                <Swords className="w-3 h-3" /> Inter-Unit Operations
              </div>
              <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-2">
                Joint Ops <span className="text-primary">Arena</span>
              </h1>
              <p className="font-sans text-muted-foreground text-sm max-w-xl">
                Challenge other units to competitive or cooperative operations. Submit verified results to earn points and climb the leaderboard.
              </p>
              <div className="mt-4"><AntiFraudBadge /></div>
            </div>

            <div className="flex flex-col gap-3">
              {/* My record card */}
              {myGroups.length > 0 && (() => {
                const rec = records.find(r => myGroupIds.includes(r.group_id));
                const tier: CapTier = rec ? getTierFromPoints(rec.total_points || 0) : "POOR";
                const tierMeta = CAP_TIER_META[tier];
                return (
                  <div className={`rounded-xl border px-5 py-4 ${tierMeta.bg}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-display font-black text-xs uppercase tracking-wider ${tierMeta.color}`}>{tierMeta.label}</span>
                      {rec?.current_streak > 0 && <span className="text-xs text-orange-400 font-sans flex items-center gap-1"><Zap className="w-3 h-3" />{rec.current_streak} streak</span>}
                    </div>
                    <div className="font-display font-black text-2xl text-foreground">{rec?.total_points || 0} <span className="text-sm text-muted-foreground font-sans">pts</span></div>
                    <div className="text-xs text-muted-foreground font-sans mt-1">{rec?.wins || 0}W · {rec?.draws || 0}D · {rec?.losses || 0}L</div>
                  </div>
                );
              })()}

              {isAuthenticated && myGroups.length > 0 && (
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black uppercase tracking-widest text-sm px-6 py-3 rounded clip-angled transition-all shadow-[0_0_20px_hsla(var(--primary),0.3)]"
                >
                  <Swords className="w-4 h-4" /> Issue Challenge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* Tab nav */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            {([
              { id: "leaderboard", label: "Leaderboard", icon: Trophy },
              { id: "challenges", label: `Challenges${pendingInbound.length > 0 ? ` (${pendingInbound.length})` : ""}`, icon: Swords },
              { id: "ops", label: "Op History", icon: Flag },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveView(id as any)}
                className={`flex items-center gap-2 font-display font-bold uppercase tracking-widest text-xs px-6 py-4 border-b-2 transition-all ${activeView === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground font-sans">Loading operations data...</div>
        ) : (
          <>
            {activeView === "leaderboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2"><Leaderboard records={records} /></div>
                <div className="flex flex-col gap-4">
                  {/* Points formula */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-display font-black text-xs uppercase tracking-widest">Points Formula</span>
                    </div>
                    <div className="flex flex-col gap-2 text-sm font-sans">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-green-400 font-bold">Win</span>
                        <span className="text-muted-foreground text-xs">100 × (Opp Tier ÷ Your Tier)</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-yellow-400 font-bold">Draw</span>
                        <span className="text-muted-foreground text-xs">40% of win value</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-red-400 font-bold">Loss</span>
                        <span className="text-muted-foreground text-xs">−25 pts (fixed)</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans mt-3">Beating a higher-tier unit earns more points. Upsets are rewarded.</p>
                  </div>
                  {/* Tier thresholds */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-display font-black text-xs uppercase tracking-widest">Tier Thresholds</span>
                    </div>
                    {CAP_TIERS.map(t => {
                      const m = CAP_TIER_META[t];
                      return (
                        <div key={t} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${m.dotCls}`} />
                            <span className={`font-display font-bold text-xs uppercase ${m.color}`}>{m.shortLabel}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-sans">{m.thresholdLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeView === "challenges" && (
              <div className="max-w-3xl mx-auto">
                {!isAuthenticated ? (
                  <div className="py-16 text-center text-muted-foreground font-sans">Log in to view and manage challenges.</div>
                ) : (
                  <>
                    {pendingInbound.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="font-display font-bold text-sm uppercase tracking-wider text-yellow-400">Incoming Challenges</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {pendingInbound.map(c => <ChallengeCard key={c.id} challenge={c} myGroupIds={myGroupIds} onAction={load} />)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">All My Challenges</span>
                      </div>
                      {myChallenges.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground font-sans text-sm">No challenges yet. Issue one to get started.</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {myChallenges.map(c => <ChallengeCard key={c.id} challenge={c} myGroupIds={myGroupIds} onAction={load} />)}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeView === "ops" && (
              <div className="max-w-3xl mx-auto">
                {ops.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground font-sans">No completed ops yet.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {ops.map(op => {
                      const canSubmit = myGroupIds.includes(op.group_a_id) || myGroupIds.includes(op.group_b_id);
                      const outcomeColor: Record<string, string> = {
                        group_a_win: "text-green-400",
                        group_b_win: "text-green-400",
                        draw: "text-yellow-400",
                      };
                      return (
                        <div key={op.id} className="bg-card border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-sm">{op.group_a_name}</span>
                              <span className="text-muted-foreground text-xs">vs</span>
                              <span className="font-display font-bold text-sm">{op.group_b_name}</span>
                            </div>
                            <span className={`text-xs font-display font-bold uppercase tracking-wider ${op.outcome ? outcomeColor[op.outcome] || "text-muted-foreground" : "text-yellow-400"}`}>
                              {op.outcome ? op.outcome.replace(/_/g, " ") : op.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-sans mb-3">{op.game} · {OP_TYPE_LABELS[op.op_type as keyof typeof OP_TYPE_LABELS] || op.op_type} · {op.scheduled_at ? new Date(op.scheduled_at).toLocaleDateString("en-GB") : "TBC"}</div>
                          {op.status === "scheduled" && canSubmit && (
                            <button onClick={() => setShowResultModal(op)}
                              className="text-xs bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-display font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all">
                              Submit Result
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showChallengeModal && selectedMyGroup && (
          <IssueChallengeModal
            myGroup={selectedMyGroup}
            allGroups={allGroups}
            onClose={() => setShowChallengeModal(false)}
            onDone={() => { setShowChallengeModal(false); load(); }}
          />
        )}
        {showResultModal && (
          <SubmitResultModal
            op={showResultModal}
            myGroupId={myGroupIds[0]}
            onClose={() => setShowResultModal(null)}
            onDone={() => { setShowResultModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );

  return standalone ? <MainLayout>{inner}</MainLayout> : inner;
}
