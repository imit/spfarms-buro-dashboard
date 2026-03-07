"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, type GalleryFile } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  Loader2Icon,
  ImageIcon,
  UploadCloudIcon,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

interface GalleryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: GalleryFile) => void;
  accept?: string;
}

export function GalleryPicker({
  open,
  onOpenChange,
  onSelect,
  accept,
}: GalleryPickerProps) {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; total_pages: number }>({
    total: 0,
    total_pages: 1,
  });
  const [selected, setSelected] = useState<GalleryFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const loadFiles = useCallback(
    async (p = 1, q = search) => {
      setIsLoading(true);
      try {
        const result = await apiClient.getGalleryFiles({
          page: p,
          per_page: 36,
          search: q || undefined,
          content_type: accept === "image/*" ? "image/" : undefined,
        });
        setFiles(result.files);
        setMeta(result.meta);
        setPage(p);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    },
    [search, accept]
  );

  useEffect(() => {
    if (open) {
      setSelected(null);
      loadFiles(1, "");
      setSearch("");
    }
  }, [open]);

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadFiles(1, value), 300);
  }

  async function handleUpload(fileList: FileList) {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await apiClient.uploadGalleryFiles(filesToUpload);
      toast.success(
        `${filesToUpload.length} file${filesToUpload.length > 1 ? "s" : ""} uploaded`
      );
      loadFiles(1, search);
      if (uploaded.length === 1) {
        setSelected(uploaded[0]);
      }
    } catch (err) {
      showError("upload files", err);
    } finally {
      setUploading(false);
    }
  }

  function handleConfirm() {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Gallery</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <UploadCloudIcon className="mr-1.5 size-3.5" />
            )}
            Upload
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="size-10 mb-3" />
              <p className="text-sm">No files found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 py-2">
              {files.map((file) => {
                const isImg = file.content_type?.startsWith("image/");
                const isActive = selected?.id === file.id;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelected(isActive ? null : file)}
                    className={cn(
                      "relative aspect-square rounded-md border overflow-hidden bg-muted/30 transition-all",
                      isActive
                        ? "ring-2 ring-primary border-primary"
                        : "hover:ring-1 hover:ring-primary/40"
                    )}
                  >
                    {isImg ? (
                      <img
                        src={file.url}
                        alt={file.alt_text || file.filename}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground truncate px-1">
                          {file.filename}
                        </span>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="rounded-full bg-primary p-1">
                          <CheckIcon className="size-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadFiles(page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {page}/{meta.total_pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => loadFiles(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {selected
              ? `Selected: ${selected.title || selected.filename}`
              : "Click an image to select it"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={!selected} onClick={handleConfirm}>
              Use Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
