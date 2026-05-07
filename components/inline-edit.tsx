"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineTextProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => Promise<void> | void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  type?: "text" | "number";
  suffix?: string;
}

export function InlineText({
  value,
  placeholder = "—",
  onSave,
  multiline = false,
  rows = 3,
  className,
  displayClassName,
  inputClassName,
  type = "text",
  suffix,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const commit = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
          rows={rows}
          autoFocus
          disabled={saving}
          className={cn("text-sm", inputClassName)}
        />
      );
    }
    return (
      <Input
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        autoFocus
        disabled={saving}
        placeholder={placeholder}
        className={cn("h-8 text-sm", inputClassName)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true); }}
      className={cn(
        "text-left rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-muted/60 transition-colors w-full min-w-0",
        !value && "italic text-muted-foreground",
        className,
        displayClassName,
      )}
    >
      <span className="truncate block">{value || placeholder}{value && suffix ? suffix : ""}</span>
    </button>
  );
}

interface InlineTagsProps {
  tags: string[];
  placeholder?: string;
  onSave: (tags: string[]) => Promise<void> | void;
  className?: string;
}

export function InlineTags({ tags, placeholder = "Add tag…", onSave, className }: InlineTagsProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = async (next: string[]) => {
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    const t = draft.trim().toLowerCase();
    if (!t || tags.includes(t)) { setDraft(""); return; }
    const next = [...tags, t];
    setDraft("");
    commit(next);
  };

  const remove = (tag: string) => commit(tags.filter((t) => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="rounded-full hover:bg-muted-foreground/20 size-4 inline-flex items-center justify-center"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (draft.trim()) add(); }}
        disabled={saving}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="h-7 text-xs flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 px-1"
      />
    </div>
  );
}
