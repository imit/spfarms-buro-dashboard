"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Post,
  type Channel,
  type PostType,
  type PostStatus,
  type PostPriority,
  type User,
  type Company,
  POST_TYPE_LABELS,
  POST_STATUS_LABELS,
  POST_PRIORITY_LABELS,
} from "@/lib/api";
import { canWrite, canDelete as canDeleteResource } from "@/lib/roles";
import type { UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostComments } from "@/components/post-comments";
import {
  ArrowLeftIcon,
  PenIcon,
  Trash2Icon,
  UserIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  PinIcon,
  BellIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from "lucide-react";
import { toast } from "sonner";

const POST_TYPE_COLORS: Record<PostType, string> = {
  task: "bg-blue-100 text-blue-700",
  plan: "bg-purple-100 text-purple-700",
  announcement: "bg-amber-100 text-amber-700",
  discussion: "bg-green-100 text-green-700",
};

const POST_STATUS_COLORS: Record<PostStatus, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
};

const POST_PRIORITY_COLORS: Record<PostPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editType, setEditType] = useState<PostType>("task");
  const [editStatus, setEditStatus] = useState<PostStatus>("open");
  const [editPriority, setEditPriority] = useState<PostPriority>("normal");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [editAssignees, setEditAssignees] = useState<number[]>([]);
  const [editCompanies, setEditCompanies] = useState<number[]>([]);
  const [editChannel, setEditChannel] = useState<number | null>(null);
  const [editNotify, setEditNotify] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  const role = currentUser?.role as UserRole | undefined;
  const writable = canWrite("posts", role);
  const deletable = canDeleteResource("posts", role);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        const postData = await apiClient.getPost(Number(id));
        setPost(postData);

        if (writable) {
          const [channelsData, usersData, companiesData] = await Promise.all([
            apiClient.getChannels().catch(() => []),
            apiClient.getUsers().catch(() => []),
            apiClient.getCompanies().catch(() => []),
          ]);
          setChannels(channelsData);
          setUsers(usersData);
          setAllCompanies(companiesData);
        }
      } catch {
        setError("Post not found");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, id, writable]);

  function openEdit() {
    if (!post) return;
    setEditTitle(post.title);
    setEditBody(post.body || "");
    setEditType(post.post_type);
    setEditStatus(post.status);
    setEditPriority(post.priority);
    setEditScheduledDate(post.scheduled_date || "");
    setEditDueDate(post.due_date || "");
    setEditPinned(post.pinned);
    setEditChannel(post.channel.id);
    setEditAssignees(post.assignees.map((a) => a.id));
    setEditCompanies(post.companies.map((c) => c.id));
    setEditNotify(false);
    setEditOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsUpdating(true);
    try {
      const updated = await apiClient.updatePost(Number(id), {
        post: {
          title: editTitle.trim(),
          body: editBody.trim() || undefined,
          post_type: editType,
          status: editStatus,
          priority: editPriority,
          channel_id: editChannel || undefined,
          scheduled_date: editScheduledDate || null,
          due_date: editDueDate || null,
          pinned: editPinned,
        },
        assignee_ids: editAssignees,
        company_ids: editCompanies,
        notify: editNotify || undefined,
      });
      setPost(updated);
      setEditOpen(false);
      toast.success("Post updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleQuickStatusChange(status: PostStatus) {
    try {
      const updated = await apiClient.updatePost(Number(id), {
        post: { status },
      });
      setPost(updated);
      toast.success(`Status changed to ${POST_STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    try {
      await apiClient.deletePost(Number(id));
      toast.success("Post deleted");
      router.push("/admin/posts");
    } catch {
      toast.error("Failed to delete post");
    }
  }

  if (authLoading) return null;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive">{error || "Post not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/posts">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Posts
          </Link>
        </Button>
      </div>
    );
  }

  const internalUsers = users.filter(
    (u) => u.role !== "account" && u.role !== "user" && !u.deleted_at
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/posts"
              className="hover:text-foreground transition-colors"
            >
              Tasks
            </Link>
            <span>/</span>
            <Link
              href={`/admin/posts?channel=${post.channel.slug}`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: post.channel.color }}
              />
              {post.channel.title}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {post.pinned && <PinIcon className="size-4 text-amber-500" />}
            <h1 className="text-2xl font-semibold">{post.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_TYPE_COLORS[post.post_type]}`}
            >
              {POST_TYPE_LABELS[post.post_type]}
            </span>

            {/* Quick status change */}
            {writable ? (
              <Select
                value={post.status}
                onValueChange={(v) => handleQuickStatusChange(v as PostStatus)}
              >
                <SelectTrigger className="h-6 w-auto text-xs px-2.5 rounded-full border-0" style={{
                  backgroundColor: POST_STATUS_COLORS[post.status].includes("slate") ? undefined : undefined,
                }}>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${POST_STATUS_COLORS[post.status]}`}>
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_STATUS_LABELS) as [PostStatus, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_STATUS_COLORS[post.status]}`}>
                {POST_STATUS_LABELS[post.status]}
              </span>
            )}

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_PRIORITY_COLORS[post.priority]}`}
            >
              {POST_PRIORITY_LABELS[post.priority]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {writable && (
            post.status === "done" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange("open")}
              >
                <CircleDashedIcon className="size-3.5 mr-1.5" />
                Reopen
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleQuickStatusChange("done")}
              >
                <CircleCheckIcon className="size-3.5 mr-1.5" />
                Mark Done
              </Button>
            )
          )}
          {writable && (
            <Button variant="outline" size="sm" onClick={openEdit}>
              <PenIcon className="size-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {deletable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2Icon className="size-3.5 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the post and all its comments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Body */}
          {post.body && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm whitespace-pre-wrap">{post.body}</p>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Author</span>
                <p className="font-medium mt-0.5">
                  {post.author.full_name || post.author.email}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium mt-0.5">
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {post.scheduled_date && (
                <div>
                  <span className="text-muted-foreground">Scheduled</span>
                  <p className="font-medium mt-0.5">
                    {new Date(post.scheduled_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {post.due_date && (
                <div>
                  <span className="text-muted-foreground">Due Date</span>
                  <p className="font-medium mt-0.5">
                    {new Date(post.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignees */}
          {post.assignees.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                <UserIcon className="size-4 text-muted-foreground" />
                Assignees
              </h3>
              <div className="space-y-2">
                {post.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {assignee.full_name?.[0]?.toUpperCase() || assignee.email[0].toUpperCase()}
                    </div>
                    <span>{assignee.full_name || assignee.email}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {assignee.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Companies (Call List) */}
          {post.companies.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                <BuildingIcon className="size-4 text-muted-foreground" />
                Linked Companies
              </h3>
              <div className="space-y-4">
                {post.companies.map((company) => (
                  <div key={company.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/companies/${company.slug}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {company.name}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        {company.company_type}
                      </Badge>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {company.phone_number && (
                        <a
                          href={`tel:${company.phone_number}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <PhoneIcon className="size-3" />
                          {company.phone_number}
                        </a>
                      )}
                      {company.email && (
                        <a
                          href={`mailto:${company.email}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <MailIcon className="size-3" />
                          {company.email}
                        </a>
                      )}
                      {company.locations.length > 0 && company.locations[0].city && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="size-3" />
                          {[company.locations[0].city, company.locations[0].state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Members */}
                    {company.members.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Contacts
                        </p>
                        {company.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.full_name || member.email}
                              </span>
                              {member.company_title && (
                                <span className="text-muted-foreground">
                                  {member.company_title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {member.phone_number && (
                                <a
                                  href={`tel:${member.phone_number}`}
                                  className="hover:text-foreground"
                                >
                                  {member.phone_number}
                                </a>
                              )}
                              <a
                                href={`mailto:${member.email}`}
                                className="hover:text-foreground"
                              >
                                {member.email}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <PostComments postId={Number(id)} />
        </div>
      </div>

      {/* Edit Dialog */}
      {writable && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={String(editChannel)} onValueChange={(v) => setEditChannel(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={String(ch.id)}>
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full inline-block" style={{ backgroundColor: ch.color }} />
                          {ch.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editType} onValueChange={(v) => setEditType(v as PostType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(POST_TYPE_LABELS) as [PostType, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as PostStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(POST_STATUS_LABELS) as [PostStatus, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editPriority} onValueChange={(v) => setEditPriority(v as PostPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(POST_PRIORITY_LABELS) as [PostPriority, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-pinned"
                  checked={editPinned}
                  onCheckedChange={(v) => setEditPinned(v === true)}
                />
                <Label htmlFor="edit-pinned" className="text-sm font-normal">
                  Pin this post
                </Label>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <Label>Assignees</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                  {internalUsers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={editAssignees.includes(u.id)}
                        onCheckedChange={(checked) => {
                          setEditAssignees((prev) =>
                            checked ? [...prev, u.id] : prev.filter((uid) => uid !== u.id)
                          );
                        }}
                      />
                      <span>{u.full_name || u.email}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Companies */}
              <div className="space-y-2">
                <Label>Companies</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                  {allCompanies.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={editCompanies.includes(c.id)}
                        onCheckedChange={(checked) => {
                          setEditCompanies((prev) =>
                            checked ? [...prev, c.id] : prev.filter((cid) => cid !== c.id)
                          );
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editAssignees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-notify"
                    checked={editNotify}
                    onCheckedChange={(v) => setEditNotify(v === true)}
                  />
                  <Label htmlFor="edit-notify" className="text-sm font-normal">
                    <BellIcon className="size-3.5 inline mr-1" />
                    Notify assignees
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
