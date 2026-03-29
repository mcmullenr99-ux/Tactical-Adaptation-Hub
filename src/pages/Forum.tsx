import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { Link } from "wouter";
import {
  MessageSquare, ThumbsUp, Pin, Plus, X, ChevronDown, ChevronUp,
  Loader2, Trash2, Shield, Pencil, Send, Filter, StickyNote,
  Megaphone, Gamepad2, Users, ImagePlus, FileVideo
} from "lucide-react";
import { countryFlag } from "@/lib/countries";
import { UavHudScene } from "./UavHudScene";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/stubs/object-storage-web";
import { useCoCTitles } from "@/hooks/useCoCTitles";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  user_id: number;
  username: string;
  user_nationality: string | null;
  milsim_group_id: number | null;
  milsim_group_name: string | null;
  category: string;
  title: string;
  content: string;
  image_url: string | null;
  pinned: boolean;
  reaction_count: number;
  comment_count: number;
  viewer_reacted: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  user_nationality: string | null;
  content: string;
  created_at: string;
}

interface MilsimGroup {
  id: number;
  name: string;
  slug: string;
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "all",         label: "All Posts",    icon: StickyNote,  color: "text-muted-foreground" },
  { key: "gaming",      label: "Gaming",       icon: Gamepad2,    color: "text-blue-400"  },
  { key: "unit",        label: "Unit News",    icon: Shield,      color: "text-primary"   },
  { key: "recruitment", label: "Recruitment",  icon: Megaphone,   color: "text-amber-400" },
  { key: "general",     label: "General",      icon: Users,       color: "text-purple-400" },
];

const CATEGORY_BADGE: Record<string, string> = {
  gaming:      "text-blue-400 border-blue-400/30 bg-blue-400/10",
  unit:        "text-primary border-primary/30 bg-primary/10",
  recruitment: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  general:     "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

// ── Create Post Modal ─────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

function CreatePostModal({
  onClose,
  onCreated,
  userGroups,
}: {
  onClose: () => void;
  onCreated: (post: Post) => void;
  userGroups: MilsimGroup[];
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [milsimGroupId, setMilsimGroupId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onError: (err) => setError(`Upload failed: ${err.message}`),
  });

  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setError("Unsupported file type. Please upload an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM, MOV).");
      return;
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 8 MB.");
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setError("Video must be under 100 MB.");
      return;
    }

    setError(null);
    setMediaFile(file);
    setMediaPath(null);

    // Generate local preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    // Upload immediately so we have the path ready when the form is submitted
    const result = await uploadFile(file);
    if (result) {
      // stub returns the URL string directly
      setMediaPath(typeof result === "string" ? result : (result as any).objectPath ?? null);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPath(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    if (mediaFile && !mediaPath) { setError("Please wait for the media to finish uploading."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const post = await apiFetch<Post>("/posts", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          milsim_group_id: milsimGroupId || undefined,
          mediaPath: mediaPath ?? undefined,
        }),
      });
      toast({ title: "Post published!" });
      onCreated(post);
      onClose();
    } catch (e: any) {
      const msg: string = e.message ?? "Failed to post.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isVideo = mediaFile ? ALLOWED_VIDEO_TYPES.includes(mediaFile.type) : false;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="font-display font-black text-xl uppercase tracking-wider">New Post</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded p-3">{error}</div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c.key !== "all").map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded border font-display font-bold uppercase tracking-wider text-xs transition-all ${
                    category === c.key ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}>
                  <c.icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* MilSim group */}
          {userGroups.length > 0 && (
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Post on behalf of (optional)</label>
              <select value={milsimGroupId} onChange={e => setMilsimGroupId(e.target.value ? parseInt(e.target.value, 10) : "")}
                className="mf-input w-full">
                <option value="">Just me</option>
                {userGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
              className="mf-input w-full" placeholder="What's happening?" />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} maxLength={5000}
              className="mf-input w-full resize-none"
              placeholder="Share your update, news, recruitment post, or whatever's on your mind..." />
            <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/5000</p>
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Attach Media (optional)
            </label>

            {!mediaFile ? (
              <label className="flex items-center justify-center gap-3 border border-dashed border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <input ref={fileInputRef} type="file" accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")}
                  className="hidden" onChange={handleFileSelect} />
                <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-display font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  Add Image or Video
                </span>
                <span className="text-xs text-muted-foreground/60">JPEG, PNG, WebP, GIF · MP4, WebM, MOV</span>
              </label>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/20">
                {isVideo ? (
                  <video src={mediaPreview ?? undefined} controls className="w-full max-h-64 object-contain" />
                ) : (
                  <img src={mediaPreview ?? undefined} alt="Preview" className="w-full max-h-64 object-contain" />
                )}

                {/* Upload progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-display font-bold uppercase tracking-widest text-white">
                      Uploading {progress}%
                    </span>
                  </div>
                )}

                {/* Ready badge */}
                {!isUploading && mediaPath && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-600/80 text-white text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                    {isVideo ? <FileVideo className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                    Ready
                  </div>
                )}

                {/* Remove button */}
                <button onClick={removeMedia} disabled={isUploading}
                  className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full disabled:opacity-50 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* File name */}
                <div className="px-3 py-2 text-xs text-muted-foreground font-display truncate border-t border-border">
                  {mediaFile.name} · {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/60 mt-1.5">
              All media is scanned by AI moderation. Inappropriate content will be automatically rejected.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 pb-5 pt-3 border-t border-border shrink-0">
          <button onClick={onClose} className="px-5 py-2 font-display font-bold uppercase tracking-wider text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || isUploading || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded clip-angled-sm transition-all disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post: initialPost,
  currentUserId,
  currentUserRole,
  onDelete,
}: {
  post: Post;
  currentUserId: number | null;
  currentUserRole: string | null;
  onDelete: (id: number) => void;
}) {
  const [post, setPost] = useState(initialPost);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const { getCoCTitle } = useCoCTitles();
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [reacting, setReacting] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === post.user_id;
  const canModerate = currentUserRole === "moderator" || currentUserRole === "admin";
  const canDelete = isOwner || canModerate;

  const loadComments = async () => {
    if (comments.length > 0) return;
    setCommentsLoading(true);
    try {
      const data = await apiFetch<{ post: any; comments: any[] }>(`/posts?path=${post.id}`);
      const normalized = (data.comments ?? []).map((c: any) => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        username: c.username ?? "Unknown",
        user_nationality: c.user_nationality ?? null,
        content: c.body ?? c.content ?? "",
        created_at: c.created_date ?? c.created_at ?? new Date().toISOString(),
      }));
      setComments(normalized);
    } catch (err) {
      console.error("[Forum] loadComments error:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && comments.length === 0) loadComments();
  };

  const toggleReact = async () => {
    if (!currentUserId) return;
    if (reacting) return;
    setReacting(true);
    try {
      const data = await apiFetch<{ reacted: boolean }>(`/posts?path=${post.id}/react`, { method: "POST" });
      setPost(p => ({
        ...p,
        viewer_reacted: data.reacted,
        reaction_count: data.reacted ? p.reaction_count + 1 : Math.max(0, p.reaction_count - 1),
      }));
    } finally {
      setReacting(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const comment = await apiFetch<Comment>(`/posts?path=${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setComments(c => [...c, comment]);
      setPost(p => ({ ...p, comment_count: p.comment_count + 1 }));
      setNewComment("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (cid: number) => {
    try {
      await apiFetch(`/posts?path=${post.id}/comments/${cid}`, { method: "DELETE" });
      setComments(c => c.filter(x => x.id !== cid));
      setPost(p => ({ ...p, comment_count: Math.max(0, p.comment_count - 1) }));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await apiFetch(`/posts?path=${post.id}`, { method: "DELETE" });
      onDelete(post.id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const catConfig = CATEGORIES.find(c => c.key === post.category);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-lg overflow-hidden transition-colors ${
        post.pinned ? "border-primary/40 shadow-[0_0_20px_hsla(var(--primary),0.08)]" : "border-border"
      }`}>

      {/* Pin strip */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border-b border-primary/20">
          <Pin className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-primary">Pinned</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {catConfig && (
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-display font-bold uppercase tracking-widest ${CATEGORY_BADGE[post.category] ?? ""}`}>
                  <catConfig.icon className="w-3 h-3" />
                  {catConfig.label}
                </span>
              )}
              {post.milsim_group_name && (
                <Link href={`/milsim/${post.milsim_group_id}`}>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary font-display font-bold uppercase tracking-widest cursor-pointer hover:bg-primary/10 transition-colors">
                    <Shield className="w-3 h-3" />
                    {post.milsim_group_name}
                  </span>
                </Link>
              )}
            </div>
            <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-wide text-foreground leading-tight">
              {post.title}
            </h3>
          </div>
          {canDelete && (
            <button onClick={deletePost} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-display font-bold text-primary">{post.username[0].toUpperCase()}</span>
          </div>
          <Link href={`/u/${post.username}`}>
            <span className="text-sm font-display font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              {post.username}
            </span>
          </Link>
          {(() => { const coc = getCoCTitle(post.username); return coc ? (
            <span className="text-[10px] font-display font-bold text-primary/80 uppercase tracking-wider px-1.5 py-0.5 border border-primary/25 rounded bg-primary/8">{coc.displayTag}</span>
          ) : null; })()}
          {post.user_nationality && (
            <span className="text-sm leading-none" title={post.user_nationality}>{countryFlag(post.user_nationality)}</span>
          )}
          <span className="text-muted-foreground/50 text-xs">·</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Content */}
        <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>

        {/* Attached media */}
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden border border-border bg-secondary/20">
            {post.image_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.image_url} controls className="w-full max-h-96 object-contain" />
            ) : (
              <img src={post.image_url} alt="Post attachment" className="w-full max-h-96 object-contain" />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <button onClick={toggleReact}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 text-sm font-display font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
              post.viewer_reacted ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}>
            <ThumbsUp className={`w-4 h-4 ${post.viewer_reacted ? "fill-primary" : ""}`} />
            <span>{post.reaction_count}</span>
          </button>

          <button onClick={toggleComments}
            className="flex items-center gap-1.5 text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>{post.comment_count}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-border/60 bg-secondary/20">

            {commentsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="p-4 space-y-3">
                {comments.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-3 font-display uppercase tracking-widest">No comments yet</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5 group">
                    <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-display font-bold text-muted-foreground">{c.username[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0 bg-secondary/40 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/u/${c.username}`}>
                            <span className="text-xs font-display font-bold text-foreground hover:text-primary transition-colors cursor-pointer">{c.username}</span>
                          </Link>
                          {(() => { const coc = getCoCTitle(c.username); return coc ? (
                            <span className="text-[9px] font-display font-bold text-primary/80 uppercase tracking-wider px-1 py-0.5 border border-primary/20 rounded bg-primary/8">{coc.displayTag}</span>
                          ) : null; })()}
                          {c.user_nationality && (
                            <span className="text-xs leading-none" title={c.user_nationality}>{countryFlag(c.user_nationality)}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                        </div>
                        {(currentUserId === c.user_id || canModerate) && (
                          <button onClick={() => deleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}

                {currentUserId && (
                  <div className="flex items-center gap-2 pt-1">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                      className="mf-input flex-1 text-sm py-2" placeholder="Add a comment..." maxLength={2000} />
                    <button onClick={submitComment} disabled={!newComment.trim() || posting}
                      className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded disabled:opacity-40 transition-all">
                      {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Forum() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [userGroups, setUserGroups] = useState<MilsimGroup[]>([]);
  const PAGE_SIZE = 15;
  const { toast } = useToast();

  // Normalize raw backend post → frontend Post shape
  const normalizePost = (raw: any): Post => ({
    id: raw.id,
    user_id: raw.user_id,
    username: raw.username ?? "Unknown",
    user_nationality: raw.user_nationality ?? null,
    milsim_group_id: raw.milsim_group_id ?? null,
    milsim_group_name: raw.milsim_group_name ?? null,
    category: raw.category ?? "general",
    title: raw.title ?? "",
    content: raw.body ?? raw.content ?? "",
    image_url: raw.image_url ?? null,
    pinned: raw.pinned ?? false,
    reaction_count: raw.reactions ?? raw.reaction_count ?? 0,
    comment_count: raw.comment_count ?? 0,
    viewer_reacted: raw.viewer_reacted ?? false,
    created_at: raw.created_date ?? raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_date ?? raw.updated_at ?? new Date().toISOString(),
  });

  const fetchPosts = async (category: string, offset: number, append: boolean) => {
    if (offset === 0) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (category !== "all") params.set("category", category);
      const data = await apiFetch<{ posts: any[]; total: number }>(`/posts?${params}`);
      const normalized = (data.posts ?? []).map(normalizePost);
      setPosts(p => append ? [...p, ...normalized] : normalized);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("[Forum] fetchPosts error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeCategory, 0, false);
  }, [activeCategory]);

  useEffect(() => {
    if (isAuthenticated) {
      apiFetch<MilsimGroup[]>("/milsimGroups?path=mine/memberships")
        .then(setUserGroups)
        .catch(() => setUserGroups([]));
    }
  }, [isAuthenticated]);

  const handleCreated = (raw: any) => {
    const post = normalizePost(raw);
    setPosts(p => [post, ...p]);
    setTotal(t => t + 1);
  };

  const handleDelete = (id: number) => {
    setPosts(p => p.filter(x => x.id !== id));
    setTotal(t => Math.max(0, t - 1));
  };

  const now = new Date();
  const militaryDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "").toUpperCase();
  const militaryTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", "") + "Z";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Page Header — UAV Overwatch HUD // WHITE-HOT THERMAL */}
        <div className="relative rounded-lg overflow-hidden border border-white/15 bg-[#000000] mb-8 min-h-[260px] select-none">

          {/* AC-130 aerial scene — orbiting compound with infantry */}
          <UavHudScene />

          {/* Thermal scanlines texture */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)" }} />

          {/* Noise grain */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />

          {/* Moving scan beam — white */}
          <div className="uav-scan-beam absolute left-0 right-0 h-[3px] pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.25), transparent)" }} />

          {/* Corner brackets — white */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/60" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/60" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/60" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/60" />

          {/* Crosshair center overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48 opacity-[0.07]">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white rounded-full" />
            </div>
          </div>

          {/* ── Top bar: feed ID / timestamp / rec ── */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-5 pb-0">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-white uppercase tracking-[0.3em]">UAV-7 // OVERWATCH</span>
              <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider">AREA: SECTOR-7</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-white/45 uppercase tracking-wider">{militaryDate} // {militaryTime}</span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-white uppercase tracking-widest">
                <span className="uav-blink w-1.5 h-1.5 rounded-full bg-white" />
                REC
              </span>
            </div>
          </div>

          {/* ── Centre: target designation + telemetry ── */}
          <div className="relative z-10 flex items-center justify-between px-8 py-5 gap-4">
            <div>
              <p className="text-[9px] font-mono text-white/45 uppercase tracking-[0.3em] mb-1.5">
                TGT DESIGNATION: UNIT.COMMS.PRI
              </p>
              <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wider leading-none">
                <span className="text-white/80">COMMUNITY</span>
                {" "}
                <span className="text-white" style={{ textShadow: "0 0 18px rgba(255,255,255,0.7), 0 0 40px rgba(255,255,255,0.25)" }}>BOARD</span>
              </h1>
              <p className="text-[9px] font-mono text-white/30 mt-2 uppercase tracking-[0.25em]">
                SIGNAL OPEN &nbsp;·&nbsp; GAMING &nbsp;·&nbsp; UNIT NEWS &nbsp;·&nbsp; RECRUITMENT &nbsp;·&nbsp; GENERAL
              </p>
            </div>

            {/* Right side telemetry block */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              {[
                ["ALT",  "2,400 M"],
                ["HDG",  "187° S"],
                ["ZOOM", "4.0×"],
                ["SPD",  "143 KTS"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{label}</span>
                  <span className="text-[10px] font-mono text-white/65 uppercase tracking-wider">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom bar: GPS + broadcast btn ── */}
          <div className="relative z-10 flex items-center justify-between px-8 pb-5 pt-0">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.25em]">
              GPS: 54.2341° N &nbsp; 003.8821° W
            </span>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 border border-white/40 text-white/80 font-mono font-bold uppercase tracking-[0.2em] px-4 py-2 text-[10px] hover:bg-white hover:text-black transition-all shrink-0 group">
                <span className="uav-blink w-1.5 h-1.5 rounded-full bg-white/80 group-hover:bg-black" />
                BROADCAST
              </button>
            )}
          </div>

          {/* Subtle white centre bloom — hottest signature */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 80% at 35% 55%, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-secondary/30 border border-border rounded-lg">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded font-display font-bold uppercase tracking-wider text-xs transition-all ${
                  activeCategory === cat.key
                    ? "bg-card border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className={`w-3.5 h-3.5 ${activeCategory === cat.key ? cat.color : ""}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Post count */}
        {!loading && (
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-4">
            {total} {total === 1 ? "post" : "posts"}
            {activeCategory !== "all" && ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}`}
          </p>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-lg">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">No posts yet</p>
            {isAuthenticated ? (
              <button onClick={() => setShowCreate(true)} className="text-sm text-primary hover:text-primary/80 font-display uppercase tracking-wider transition-colors">
                Be the first to post →
              </button>
            ) : (
              <Link href="/portal/login">
                <span className="text-sm text-primary hover:text-primary/80 font-display uppercase tracking-wider transition-colors cursor-pointer">
                  Log in to post →
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post}
                currentUserId={user?.id ?? null}
                currentUserRole={user?.role ?? null}
                onDelete={handleDelete} />
            ))}

            {posts.length < total && (
              <div className="flex justify-center pt-4">
                <button onClick={() => fetchPosts(activeCategory, posts.length, true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display font-bold uppercase tracking-wider text-sm rounded transition-all disabled:opacity-50">
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Not logged in CTA */}
        {!isAuthenticated && (
          <div className="mt-10 p-6 bg-card border border-border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display font-bold uppercase tracking-wider text-foreground">Want to post or react?</p>
              <p className="text-sm text-muted-foreground mt-0.5">Join TAG to contribute to the community board.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/portal/login">
                <span className="px-5 py-2 border border-primary text-primary font-display font-bold uppercase tracking-wider text-sm rounded clip-angled-sm hover:bg-primary/10 transition-all cursor-pointer">
                  Log In
                </span>
              </Link>
              <Link href="/join">
                <span className="px-5 py-2 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider text-sm rounded clip-angled-sm hover:bg-primary/90 transition-all cursor-pointer">
                  Enlist
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Create post modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} userGroups={userGroups} />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
