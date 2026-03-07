"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type GalleryFile,
} from "@/lib/api";
import { canWrite, canDelete } from "@/lib/roles";
import type { UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import {
  UploadCloudIcon,
  SearchIcon,
  Loader2Icon,
  TrashIcon,
  CopyIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  FileAudioIcon,
  ImageIcon,
  XIcon,
  PencilIcon,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fileIcon(contentType: string) {
  if (contentType?.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (contentType?.startsWith("video/")) return <FileVideoIcon className="size-5" />;
  if (contentType?.startsWith("audio/")) return <FileAudioIcon className="size-5" />;
  if (contentType?.includes("pdf") || contentType?.includes("text")) return <FileTextIcon className="size-5" />;
  return <FileIcon className="size-5" />;
}

function isImage(contentType: string) {
  return contentType?.startsWith("image/");
}

export default function GalleryPage() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const hasWrite = canWrite("gallery", role);
  const hasDeletePerm = canDelete("gallery", role);

  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; total_pages: number }>({ total: 0, total_pages: 1 });
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GalleryFile | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editingAlt, setEditingAlt] = useState(false);
  const [editAlt, setEditAlt] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const loadFiles = useCallback(async (p = 1, q = search) => {
    try {
      const result = await apiClient.getGalleryFiles({
        page: p,
        per_page: 48,
        search: q || undefined,
      });
      setFiles(result.files);
      setMeta(result.meta);
      setPage(p);
    } catch (err) {
      setError("Failed to load gallery files");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadFiles();
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setIsLoading(true);
      loadFiles(1, value);
    }, 300);
  }

  async function handleUpload(fileList: FileList | File[]) {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    setUploading(true);
    try {
      await apiClient.uploadGalleryFiles(filesToUpload);
      toast.success(`${filesToUpload.length} file${filesToUpload.length > 1 ? "s" : ""} uploaded`);
      loadFiles(1);
    } catch (err) {
      showError("upload files", err);
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    if (!hasWrite) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleUpload(droppedFiles);
    }
  }

  async function handleDelete(file: GalleryFile) {
    try {
      await apiClient.deleteGalleryFile(file.id);
      toast.success("File deleted");
      setSelectedFile(null);
      loadFiles(page);
    } catch (err) {
      showError("delete file", err);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }

  async function saveTitle() {
    if (!selectedFile) return;
    try {
      const updated = await apiClient.updateGalleryFile(selectedFile.id, { title: editTitle });
      setSelectedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingTitle(false);
      toast.success("Title updated");
    } catch (err) {
      showError("update title", err);
    }
  }

  async function saveAlt() {
    if (!selectedFile) return;
    try {
      const updated = await apiClient.updateGalleryFile(selectedFile.id, { alt_text: editAlt });
      setSelectedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingAlt(false);
      toast.success("Alt text updated");
    } catch (err) {
      showError("update alt text", err);
    }
  }

  return (
    <div
      className="px-10 py-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && hasWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-4 border-dashed border-primary rounded-xl">
          <div className="flex flex-col items-center gap-3 text-primary">
            <UploadCloudIcon className="size-16" />
            <p className="text-xl font-semibold">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} file{meta.total !== 1 ? "s" : ""}
          </p>
        </div>
        {hasWrite && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloudIcon className="mr-2 size-4" />
                  Upload Files
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {error && <ErrorAlert message={error} className="mb-4" />}

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* File grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ImageIcon className="size-12 mb-4" />
          <p className="text-lg font-medium">No files yet</p>
          {hasWrite && (
            <p className="text-sm mt-1">
              Drag & drop files here or click Upload Files
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  setSelectedFile(file);
                  setEditingTitle(false);
                  setEditingAlt(false);
                }}
                className={cn(
                  "group relative aspect-square rounded-lg border overflow-hidden bg-muted/30 hover:ring-2 hover:ring-primary/50 transition-all text-left",
                  selectedFile?.id === file.id && "ring-2 ring-primary"
                )}
              >
                {isImage(file.content_type) ? (
                  <img
                    src={file.url}
                    alt={file.alt_text || file.filename}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center gap-2 p-3">
                    {fileIcon(file.content_type)}
                    <span className="text-xs text-muted-foreground text-center truncate w-full">
                      {file.filename}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">
                    {file.title || file.filename}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadFiles(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => loadFiles(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* File detail dialog */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => { if (!open) setSelectedFile(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {selectedFile?.title || selectedFile?.filename}
            </DialogTitle>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-lg overflow-hidden bg-muted/30 border flex items-center justify-center">
                {isImage(selectedFile.content_type) ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.alt_text || selectedFile.filename}
                    className="max-h-80 object-contain"
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                    {fileIcon(selectedFile.content_type)}
                    <span className="text-sm">{selectedFile.filename}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid gap-3 text-sm">
                {/* Title */}
                <div className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-muted-foreground">Title</Label>
                  {editingTitle ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                      />
                      <Button variant="ghost" size="icon" className="size-7" onClick={saveTitle}>
                        <CheckIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditingTitle(false)}>
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="truncate">{selectedFile.title || "—"}</span>
                      {hasWrite && (
                        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => { setEditTitle(selectedFile.title || ""); setEditingTitle(true); }}>
                          <PencilIcon className="size-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Alt text */}
                {isImage(selectedFile.content_type) && (
                  <div className="flex items-center gap-2">
                    <Label className="w-20 shrink-0 text-muted-foreground">Alt text</Label>
                    {editingAlt ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editAlt}
                          onChange={(e) => setEditAlt(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") saveAlt(); if (e.key === "Escape") setEditingAlt(false); }}
                        />
                        <Button variant="ghost" size="icon" className="size-7" onClick={saveAlt}>
                          <CheckIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditingAlt(false)}>
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="truncate">{selectedFile.alt_text || "—"}</span>
                        {hasWrite && (
                          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => { setEditAlt(selectedFile.alt_text || ""); setEditingAlt(true); }}>
                            <PencilIcon className="size-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-muted-foreground">File</Label>
                  <span className="truncate">{selectedFile.filename}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-muted-foreground">Type</Label>
                  <span>{selectedFile.content_type}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-muted-foreground">Size</Label>
                  <span>{formatBytes(selectedFile.byte_size)}</span>
                </div>

                {selectedFile.uploaded_by_name && (
                  <div className="flex items-center gap-2">
                    <Label className="w-20 shrink-0 text-muted-foreground">Uploaded</Label>
                    <span>{selectedFile.uploaded_by_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-muted-foreground">Date</Label>
                  <span>{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyUrl(selectedFile.url)}
                >
                  <CopyIcon className="mr-1.5 size-3.5" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                    Open Original
                  </a>
                </Button>
                {hasDeletePerm && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleDelete(selectedFile)}
                  >
                    <TrashIcon className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
