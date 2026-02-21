"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Comment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SendIcon, Trash2Icon, MessageSquareIcon } from "lucide-react";

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function CompanyNotes({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      try {
        const data = await apiClient.getCompanyComments(slug);
        setComments(data);
      } catch {
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    }

    fetchComments();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await apiClient.createCompanyComment(
        slug,
        newComment.trim()
      );
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    try {
      await apiClient.deleteCompanyComment(slug, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  }

  const canDelete = (comment: Comment) =>
    user?.role === "admin" || comment.author.id === user?.id;

  return (
    <div className="rounded-lg border bg-card flex flex-col">
      <div className="p-4 pb-3">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-muted-foreground" />
          Notes
        </h3>
      </div>

      <div className="px-4 pb-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newComment.trim()}
            >
              <SendIcon className="mr-1.5 size-3.5" />
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Loading...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No notes yet.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3">
              <Avatar size="sm">
                <AvatarFallback>
                  {getInitials(comment.author.full_name, comment.author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {comment.author.full_name || comment.author.email}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {comment.author.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>
              {canDelete(comment) && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1"
                  title="Delete note"
                >
                  <Trash2Icon className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
