"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, SendIcon, SparklesIcon } from "lucide-react";
import { apiClient, BROADCAST_SHORTCODES } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

export default function NewBroadcastPage() {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const ctaUrlRef = useRef<HTMLInputElement | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("Shop now");
  const [ctaUrl, setCtaUrl] = useState("{{magic_link}}");
  const [saving, setSaving] = useState(false);

  function insertShortcode(code: string, target: "body" | "cta_url") {
    if (target === "body") {
      const el = bodyRef.current;
      if (!el) {
        setBody((prev) => prev + code);
        return;
      }
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const next = body.slice(0, start) + code + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + code.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      const el = ctaUrlRef.current;
      if (!el) {
        setCtaUrl((prev) => prev + code);
        return;
      }
      const start = el.selectionStart ?? ctaUrl.length;
      const end = el.selectionEnd ?? ctaUrl.length;
      const next = ctaUrl.slice(0, start) + code + ctaUrl.slice(end);
      setCtaUrl(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + code.length;
        el.setSelectionRange(pos, pos);
      });
    }
  }

  async function handleSaveDraft() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setSaving(true);
    try {
      const created = await apiClient.createBroadcast({
        subject: subject.trim(),
        body: body.trim(),
        cta_text: ctaText.trim() || null,
        cta_url: ctaUrl.trim() || null,
      });
      toast.success("Draft saved");
      router.push(`/admin/broadcasts/${created.id}`);
    } catch {
      showError("save the broadcast");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 px-10 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/admin/broadcasts">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <h2 className="text-2xl font-semibold">New broadcast</h2>
        <p className="text-sm text-muted-foreground">
          Save a draft, then preview and send from the broadcast detail page.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="New strains just dropped 🌿"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Body</Label>
            <ShortcodeMenu onInsert={(c) => insertShortcode(c, "body")} />
          </div>
          <Textarea
            id="body"
            ref={bodyRef}
            placeholder={"Hey {{first_name}},\n\nWe just released three new strains. Tap below to take a look — you'll be logged in automatically."}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="mt-1 font-mono text-sm"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Plain text. Line breaks are preserved. Use shortcodes for per-recipient values.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cta_text">Button label</Label>
            <Input
              id="cta_text"
              placeholder="Shop now"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cta_url">Button URL</Label>
              <ShortcodeMenu onInsert={(c) => insertShortcode(c, "cta_url")} compact />
            </div>
            <Input
              id="cta_url"
              ref={ctaUrlRef}
              placeholder="{{magic_link}}"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="size-4 text-amber-500" />
            <span className="text-sm font-medium">Available shortcodes</span>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {BROADCAST_SHORTCODES.map((s) => (
              <li key={s.code}>
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                  {s.code}
                </code>{" "}
                — {s.description}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSaveDraft} disabled={saving}>
            <SendIcon className="mr-2 size-4" />
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/broadcasts">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShortcodeMenu({
  onInsert,
  compact = false,
}: {
  onInsert: (code: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
      >
        + insert shortcode
      </button>
      {open && (
        <div className={`absolute right-0 top-6 z-10 w-72 rounded-md border bg-popover shadow-md ${compact ? "" : ""}`}>
          <ul className="divide-y">
            {BROADCAST_SHORTCODES.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(s.code);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted text-xs"
                >
                  <code className="font-mono text-foreground">{s.code}</code>
                  <p className="text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
