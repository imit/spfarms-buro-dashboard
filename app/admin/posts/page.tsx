"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Channel,
  type Post,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PostComments } from "@/components/post-comments";
import {
  PlusIcon,
  HashIcon,
  LockIcon,
  PinIcon,
  MessageSquareIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  TagIcon,
  FlagIcon,
  XIcon,
  PenIcon,
  Trash2Icon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  BellIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  ExternalLinkIcon,
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

export default function PostsPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedChannel, setSelectedChannel] = useState<string | null>(
    searchParams.get("channel") || null
  );
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [assignedToMe, setAssignedToMe] = useState(false);

  // New task
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [newPostType, setNewPostType] = useState<PostType>("task");
  const [newPostPriority, setNewPostPriority] = useState<PostPriority>("normal");
  const [newPostChannel, setNewPostChannel] = useState<number | null>(null);
  const [newPostDueDate, setNewPostDueDate] = useState("");
  const [newPostAssignees, setNewPostAssignees] = useState<number[]>([]);
  const [newPostCompanies, setNewPostCompanies] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  // New channel dialog
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelTitle, setNewChannelTitle] = useState("");
  const [newChannelColor, setNewChannelColor] = useState("#6366f1");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Drawer detail
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPost, setDrawerPost] = useState<Post | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Drawer edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editType, setEditType] = useState<PostType>("task");
  const [editStatus, setEditStatus] = useState<PostStatus>("open");
  const [editPriority, setEditPriority] = useState<PostPriority>("normal");
  const [editChannel, setEditChannel] = useState<number | null>(null);
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [editAssignees, setEditAssignees] = useState<number[]>([]);
  const [editCompanies, setEditCompanies] = useState<number[]>([]);
  const [editNotify, setEditNotify] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const role = currentUser?.role as UserRole | undefined;
  const writable = canWrite("posts", role);
  const deletable = canDeleteResource("posts", role);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await apiClient.getPosts({
        channel_slug: selectedChannel || undefined,
        post_type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        assigned_to_me: assignedToMe || undefined,
      });
      setPosts(data);
    } catch {
      toast.error("Failed to load tasks");
    }
  }, [selectedChannel, typeFilter, statusFilter, assignedToMe]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    Promise.all([
      apiClient.getChannels(),
      apiClient.getPosts({ channel_slug: selectedChannel || undefined }),
      writable ? apiClient.getUsers().catch(() => []) : Promise.resolve([]),
      writable ? apiClient.getCompanies().catch(() => []) : Promise.resolve([]),
    ])
      .then(([channelsData, postsData, usersData, companiesData]) => {
        setChannels(channelsData);
        setPosts(postsData);
        setUsers(usersData as User[]);
        setCompanies(companiesData as Company[]);
        if (channelsData.length > 0 && !newPostChannel) {
          setNewPostChannel(channelsData[0].id);
        }
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    fetchPosts();
  }, [isAuthenticated, isLoading, fetchPosts]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostChannel) return;

    setIsSubmitting(true);
    try {
      await apiClient.createPost({
        post: {
          title: newPostTitle.trim(),
          body: newPostBody.trim() || undefined,
          post_type: newPostType,
          priority: newPostPriority,
          channel_id: newPostChannel,
          due_date: newPostDueDate || undefined,
        },
        assignee_ids: newPostAssignees.length > 0 ? newPostAssignees : undefined,
        company_ids: newPostCompanies.length > 0 ? newPostCompanies : undefined,
      });

      toast.success("Task created");
      setNewPostOpen(false);
      resetNewPostForm();
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetNewPostForm() {
    setNewPostTitle("");
    setNewPostBody("");
    setNewPostType("task");
    setNewPostPriority("normal");
    setNewPostDueDate("");
    setNewPostAssignees([]);
    setNewPostCompanies([]);
    setPeopleSearch("");
    setCompanySearch("");
  }

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannelTitle.trim()) return;

    setIsCreatingChannel(true);
    try {
      const channel = await apiClient.createChannel({
        title: newChannelTitle.trim(),
        color: newChannelColor,
        description: newChannelDescription.trim() || undefined,
        private: newChannelPrivate,
      });
      setChannels((prev) => [...prev, channel]);
      setNewChannelOpen(false);
      setNewChannelTitle("");
      setNewChannelColor("#6366f1");
      setNewChannelDescription("");
      setNewChannelPrivate(false);
      toast.success("Channel created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  }

  function handleChannelSelect(slug: string | null) {
    setSelectedChannel(slug);
    const url = slug ? `/admin/posts?channel=${slug}` : "/admin/posts";
    router.replace(url, { scroll: false });
  }

  // Drawer handlers
  async function openDrawer(postId: number) {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const data = await apiClient.getPost(postId);
      setDrawerPost(data);
    } catch {
      toast.error("Failed to load task");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function handleDrawerStatusChange(status: PostStatus) {
    if (!drawerPost) return;
    try {
      const updated = await apiClient.updatePost(drawerPost.id, { post: { status } });
      setDrawerPost(updated);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, status: updated.status } : p)));
      toast.success(`Status changed to ${POST_STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  function openDrawerEdit() {
    if (!drawerPost) return;
    setEditTitle(drawerPost.title);
    setEditBody(drawerPost.body || "");
    setEditType(drawerPost.post_type);
    setEditStatus(drawerPost.status);
    setEditPriority(drawerPost.priority);
    setEditChannel(drawerPost.channel.id);
    setEditScheduledDate(drawerPost.scheduled_date || "");
    setEditDueDate(drawerPost.due_date || "");
    setEditPinned(drawerPost.pinned);
    setEditAssignees(drawerPost.assignees.map((a) => a.id));
    setEditCompanies(drawerPost.companies.map((c) => c.id));
    setEditNotify(false);
    setEditOpen(true);
  }

  async function handleDrawerUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!drawerPost || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      const updated = await apiClient.updatePost(drawerPost.id, {
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
      setDrawerPost(updated);
      setEditOpen(false);
      fetchPosts();
      toast.success("Task updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDrawerDelete() {
    if (!drawerPost) return;
    try {
      await apiClient.deletePost(drawerPost.id);
      setDrawerOpen(false);
      setDrawerPost(null);
      fetchPosts();
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  if (authLoading) return null;

  const currentChannel = channels.find((c) => c.slug === selectedChannel);
  const internalUsers = users.filter(
    (u) => u.role !== "account" && u.role !== "user" && !u.deleted_at
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Channel sidebar */}
      <div className="w-56 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Channels</h2>
          {writable && (
            <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <PlusIcon className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChannel} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newChannelTitle}
                      onChange={(e) => setNewChannelTitle(e.target.value)}
                      placeholder="e.g. Sales"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newChannelColor}
                        onChange={(e) => setNewChannelColor(e.target.value)}
                        className="size-8 rounded cursor-pointer"
                      />
                      <Input
                        value={newChannelColor}
                        onChange={(e) => setNewChannelColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel-private"
                      checked={newChannelPrivate}
                      onCheckedChange={(v) => setNewChannelPrivate(v === true)}
                    />
                    <Label htmlFor="channel-private" className="text-sm font-normal">
                      Private channel
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isCreatingChannel}>
                    {isCreatingChannel ? "Creating..." : "Create Channel"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <button
            type="button"
            onClick={() => handleChannelSelect(null)}
            className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${
              selectedChannel === null
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <HashIcon className="size-3.5 shrink-0" />
            All Channels
          </button>

          {channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => handleChannelSelect(channel.slug)}
              className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${
                selectedChannel === channel.slug
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {channel.private ? (
                <LockIcon className="size-3.5 shrink-0" />
              ) : (
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: channel.color }}
                />
              )}
              <span className="truncate">{channel.title}</span>
              {channel.posts_count > 0 && (
                <span className="ml-auto text-xs text-muted-foreground/70">
                  {channel.posts_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {currentChannel
                ? `# ${currentChannel.title}`
                : "All Tasks"}
            </h1>
            {currentChannel?.description && (
              <p className="text-sm text-muted-foreground">
                {currentChannel.description}
              </p>
            )}
          </div>

          {writable && (
            <Dialog
              open={newPostOpen}
              onOpenChange={(open) => {
                setNewPostOpen(open);
                if (!open) resetNewPostForm();
                if (open && currentChannel) {
                  setNewPostChannel(currentChannel.id);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="size-4 mr-1.5" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 gap-0 max-w-xl" showCloseButton={false}>
                <form onSubmit={handleCreatePost}>
                  <div className="p-5 pb-3">
                    <input
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="New Task"
                      className="w-full text-xl font-semibold bg-transparent outline-none placeholder:text-muted-foreground/40"
                      autoFocus
                      required
                    />
                    <textarea
                      value={newPostBody}
                      onChange={(e) => setNewPostBody(e.target.value)}
                      placeholder="Notes"
                      className="w-full mt-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40 resize-none leading-relaxed"
                      rows={3}
                    />
                  </div>

                  {/* Tagged users */}
                  {newPostAssignees.length > 0 && (
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                      {newPostAssignees.map((uid) => {
                        const u = internalUsers.find((u) => u.id === uid);
                        if (!u) return null;
                        return (
                          <span
                            key={uid}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 pl-2 pr-1 py-0.5 text-xs font-medium"
                          >
                            <UserIcon className="size-3" />
                            {u.full_name?.split(" ")[0] || u.email.split("@")[0]}
                            <button
                              type="button"
                              onClick={() => setNewPostAssignees((prev) => prev.filter((id) => id !== uid))}
                              className="rounded-full p-0.5 hover:bg-blue-200/60 transition-colors"
                            >
                              <XIcon className="size-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Tagged companies */}
                  {newPostCompanies.length > 0 && (
                    <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                      {newPostCompanies.map((cid) => {
                        const c = companies.find((c) => c.id === cid);
                        if (!c) return null;
                        return (
                          <span
                            key={cid}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 pl-2 pr-1 py-0.5 text-xs font-medium"
                          >
                            <BuildingIcon className="size-3" />
                            {c.name}
                            <button
                              type="button"
                              onClick={() => setNewPostCompanies((prev) => prev.filter((id) => id !== cid))}
                              className="rounded-full p-0.5 hover:bg-emerald-200/60 transition-colors"
                            >
                              <XIcon className="size-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="px-5 pb-4 pt-1 flex items-center gap-1.5 flex-wrap">
                    {/* Channel */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: channels.find((c) => c.id === newPostChannel)?.color || "#6366f1" }}
                          />
                          {channels.find((c) => c.id === newPostChannel)?.title || "Channel"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1" align="start">
                        {channels.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setNewPostChannel(ch.id)}
                            className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                              newPostChannel === ch.id
                                ? "bg-accent font-medium"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <span className="size-2 rounded-full" style={{ backgroundColor: ch.color }} />
                            {ch.title}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    {/* Type */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          <TagIcon className="size-3" />
                          {POST_TYPE_LABELS[newPostType]}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-36 p-1" align="start">
                        {(Object.entries(POST_TYPE_LABELS) as [PostType, string][]).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewPostType(val)}
                            className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
                              newPostType === val ? "bg-accent font-medium" : "hover:bg-muted/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    {/* Priority */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                            newPostPriority !== "normal"
                              ? POST_PRIORITY_COLORS[newPostPriority]
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <FlagIcon className="size-3" />
                          {newPostPriority !== "normal" ? POST_PRIORITY_LABELS[newPostPriority] : "Priority"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="start">
                        {(Object.entries(POST_PRIORITY_LABELS) as [PostPriority, string][]).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewPostPriority(val)}
                            className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
                              newPostPriority === val ? "bg-accent font-medium" : "hover:bg-muted/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    {/* Due date */}
                    <div className="relative">
                      <input
                        type="date"
                        value={newPostDueDate}
                        onChange={(e) => setNewPostDueDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs pointer-events-none transition-colors ${
                          newPostDueDate ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="size-3" />
                        {newPostDueDate
                          ? new Date(newPostDueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "Due"}
                      </span>
                    </div>

                    {/* Assign people */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                            newPostAssignees.length > 0 ? "text-blue-700 border-blue-200 bg-blue-50" : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <UserIcon className="size-3" />
                          {newPostAssignees.length > 0 ? newPostAssignees.length : "People"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <input
                          value={peopleSearch}
                          onChange={(e) => setPeopleSearch(e.target.value)}
                          placeholder="Search people..."
                          className="w-full px-2 py-1.5 text-xs bg-transparent outline-none border-b mb-1 placeholder:text-muted-foreground/50"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {internalUsers
                            .filter((u) => {
                              if (!peopleSearch) return true;
                              const q = peopleSearch.toLowerCase();
                              return (u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
                            })
                            .map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setNewPostAssignees((prev) =>
                                  prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                                );
                              }}
                              className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                                newPostAssignees.includes(u.id) ? "bg-accent font-medium" : "hover:bg-muted/50"
                              }`}
                            >
                              <span className="truncate">{u.full_name || u.email}</span>
                              <span className="ml-auto text-muted-foreground">{u.role}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Tag companies */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                            newPostCompanies.length > 0 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <BuildingIcon className="size-3" />
                          {newPostCompanies.length > 0 ? newPostCompanies.length : "Companies"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <input
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          placeholder="Search companies..."
                          className="w-full px-2 py-1.5 text-xs bg-transparent outline-none border-b mb-1 placeholder:text-muted-foreground/50"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {companies
                            .filter((c) => {
                              if (!companySearch) return true;
                              return c.name.toLowerCase().includes(companySearch.toLowerCase());
                            })
                            .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setNewPostCompanies((prev) =>
                                  prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors text-left ${
                                newPostCompanies.includes(c.id) ? "bg-accent font-medium" : "hover:bg-muted/50"
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="ml-auto">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting || !newPostTitle.trim()}
                        className="rounded-full px-4"
                      >
                        {isSubmitting ? "..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 py-2.5 border-b flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            {(["all", ...Object.keys(POST_TYPE_LABELS)] as (PostType | "all")[]).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTypeFilter(val)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-all ${
                  typeFilter === val
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {val === "all" ? "All" : POST_TYPE_LABELS[val]}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            {(["all", ...Object.keys(POST_STATUS_LABELS)] as (PostStatus | "all")[]).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-all ${
                  statusFilter === val
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {val === "all" ? "All" : POST_STATUS_LABELS[val]}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => setAssignedToMe(!assignedToMe)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-all ${
              assignedToMe
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Mine
          </button>
        </div>

        {/* Tasks list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No tasks yet.</p>
              {writable && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setNewPostOpen(true)}
                >
                  <PlusIcon className="size-4 mr-1.5" />
                  Create first task
                </Button>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => openDrawer(post.id)}
                  className="group w-full text-left flex items-start gap-3 rounded-lg border border-transparent bg-card px-4 py-3 shadow-xs hover:shadow-md hover:border-border/60 hover:bg-accent/40 active:scale-[0.995] transition-all duration-150 cursor-pointer"
                >
                  {/* Channel color bar */}
                  <div
                    className="mt-1.5 w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: post.channel.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.pinned && (
                        <PinIcon className="size-3 text-amber-500 shrink-0" />
                      )}
                      <span className={`font-medium text-sm truncate ${post.status === "done" || post.status === "closed" ? "line-through text-muted-foreground" : ""}`}>
                        {post.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${POST_TYPE_COLORS[post.post_type]}`}
                      >
                        {POST_TYPE_LABELS[post.post_type]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${POST_STATUS_COLORS[post.status]}`}
                      >
                        {POST_STATUS_LABELS[post.status]}
                      </span>
                      {post.priority !== "normal" && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${POST_PRIORITY_COLORS[post.priority]}`}
                        >
                          {POST_PRIORITY_LABELS[post.priority]}
                        </span>
                      )}
                      {!selectedChannel && (
                        <span className="text-[11px] text-muted-foreground">
                          {post.channel.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                    {post.assignees.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="size-3" />
                        {post.assignees.map((a) => a.full_name?.split(" ")[0] || a.email.split("@")[0]).join(", ")}
                      </span>
                    )}
                    {post.companies.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BuildingIcon className="size-3" />
                        {post.companies.length}
                      </span>
                    )}
                    {post.comments_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquareIcon className="size-3" />
                        {post.comments_count}
                      </span>
                    )}
                    {post.due_date && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3" />
                        {new Date(post.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <span className="text-[11px]">
                      {post.author.full_name?.split(" ")[0] || post.author.email.split("@")[0]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-0" showCloseButton={false}>
          {drawerLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : drawerPost ? (
            <>
              <SheetHeader className="p-5 pb-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: drawerPost.channel.color }}
                  />
                  <span>{drawerPost.channel.title}</span>
                  <span className="ml-auto">
                    <Link
                      href={`/admin/posts/${drawerPost.id}`}
                      className="hover:text-foreground transition-colors"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </Link>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {drawerPost.pinned && <PinIcon className="size-4 text-amber-500" />}
                  <SheetTitle className="text-xl">{drawerPost.title}</SheetTitle>
                </div>
                <SheetDescription className="sr-only">Task detail</SheetDescription>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_TYPE_COLORS[drawerPost.post_type]}`}>
                    {POST_TYPE_LABELS[drawerPost.post_type]}
                  </span>

                  {writable ? (
                    <Select
                      value={drawerPost.status}
                      onValueChange={(v) => handleDrawerStatusChange(v as PostStatus)}
                    >
                      <SelectTrigger className="h-6 w-auto text-xs px-2.5 rounded-full border-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${POST_STATUS_COLORS[drawerPost.status]}`}>
                          {POST_STATUS_LABELS[drawerPost.status]}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(POST_STATUS_LABELS) as [PostStatus, string][]).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_STATUS_COLORS[drawerPost.status]}`}>
                      {POST_STATUS_LABELS[drawerPost.status]}
                    </span>
                  )}

                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${POST_PRIORITY_COLORS[drawerPost.priority]}`}>
                    {POST_PRIORITY_LABELS[drawerPost.priority]}
                  </span>
                </div>
              </SheetHeader>

              {/* Actions */}
              {writable && (
                <div className="px-5 pt-4 flex items-center gap-2">
                  {drawerPost.status === "done" ? (
                    <Button variant="outline" size="sm" onClick={() => handleDrawerStatusChange("open")}>
                      <CircleDashedIcon className="size-3.5 mr-1.5" />
                      Reopen
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleDrawerStatusChange("done")}>
                      <CircleCheckIcon className="size-3.5 mr-1.5" />
                      Mark Done
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={openDrawerEdit}>
                    <PenIcon className="size-3.5 mr-1.5" />
                    Edit
                  </Button>
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
                          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the task and all its comments.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDrawerDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}

              <div className="p-5 space-y-5">
                {/* Body */}
                {drawerPost.body && (
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm whitespace-pre-wrap">{drawerPost.body}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Author</span>
                      <p className="font-medium mt-0.5">
                        {drawerPost.author.full_name || drawerPost.author.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="font-medium mt-0.5">
                        {new Date(drawerPost.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {drawerPost.scheduled_date && (
                      <div>
                        <span className="text-muted-foreground">Scheduled</span>
                        <p className="font-medium mt-0.5">
                          {new Date(drawerPost.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                    {drawerPost.due_date && (
                      <div>
                        <span className="text-muted-foreground">Due Date</span>
                        <p className="font-medium mt-0.5">
                          {new Date(drawerPost.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignees */}
                {drawerPost.assignees.length > 0 && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <UserIcon className="size-4 text-muted-foreground" />
                      Assignees
                    </h3>
                    <div className="space-y-2">
                      {drawerPost.assignees.map((assignee) => (
                        <div key={assignee.id} className="flex items-center gap-2 text-sm">
                          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {assignee.full_name?.[0]?.toUpperCase() || assignee.email[0].toUpperCase()}
                          </div>
                          <span>{assignee.full_name || assignee.email}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{assignee.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies */}
                {drawerPost.companies.length > 0 && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <BuildingIcon className="size-4 text-muted-foreground" />
                      Linked Companies
                    </h3>
                    <div className="space-y-4">
                      {drawerPost.companies.map((company) => (
                        <div key={company.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/admin/companies/${company.slug}`}
                              className="font-semibold text-lg hover:underline"
                            >
                              {company.name}
                            </Link>
                            <Badge variant="outline" className="text-xs">{company.company_type}</Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {company.phone_number && (
                              <a href={`tel:${company.phone_number}`} className="flex items-center gap-1.5 hover:text-foreground text-base font-medium">
                                <PhoneIcon className="size-4" />
                                {company.phone_number}
                              </a>
                            )}
                            {company.email && (
                              <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                                <MailIcon className="size-4" />
                                {company.email}
                              </a>
                            )}
                            {company.locations.length > 0 && company.locations[0].city && (
                              <span className="flex items-center gap-1.5">
                                <MapPinIcon className="size-4" />
                                {[company.locations[0].city, company.locations[0].state].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </div>

                          {company.members.length > 0 && (
                            <div className="pt-2 space-y-1.5">
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contacts</p>
                              {company.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between text-sm py-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{member.full_name || member.email}</span>
                                    {member.company_title && (
                                      <span className="text-muted-foreground">{member.company_title}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-muted-foreground">
                                    {member.phone_number && (
                                      <a href={`tel:${member.phone_number}`} className="hover:text-foreground font-medium">
                                        {member.phone_number}
                                      </a>
                                    )}
                                    <a href={`mailto:${member.email}`} className="hover:text-foreground">
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
                <PostComments postId={drawerPost.id} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog (for drawer) */}
      {writable && drawerPost && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDrawerUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={String(editChannel)} onValueChange={(v) => setEditChannel(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input type="date" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="edit-pinned" checked={editPinned} onCheckedChange={(v) => setEditPinned(v === true)} />
                <Label htmlFor="edit-pinned" className="text-sm font-normal">Pin this task</Label>
              </div>

              <div className="space-y-2">
                <Label>Assignees</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                  {internalUsers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={editAssignees.includes(u.id)}
                        onCheckedChange={(checked) => setEditAssignees((prev) => checked ? [...prev, u.id] : prev.filter((uid) => uid !== u.id))}
                      />
                      <span>{u.full_name || u.email}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Companies</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                  {companies.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={editCompanies.includes(c.id)}
                        onCheckedChange={(checked) => setEditCompanies((prev) => checked ? [...prev, c.id] : prev.filter((cid) => cid !== c.id))}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editAssignees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox id="edit-notify" checked={editNotify} onCheckedChange={(v) => setEditNotify(v === true)} />
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
