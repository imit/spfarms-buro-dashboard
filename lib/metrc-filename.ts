// Parses METRC PDF filenames produced by Metrc's tag-export tool.
// Example: "bbf54f9de2f7de8a-1A41203000015F1000000411-0.pdf"
//          └─ random hash ─┘ └────── METRC tag ─────┘ └ page suffix
//
// We strip the trailing `-N.pdf` page suffix and treat the remainder's last
// hyphen-separated segment as the METRC tag. Falls back to the trailing slug
// for non-METRC filenames (still useful as a fingerprint).

function stripPageSuffix(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/-\d+$/, "");
}

export function extractMetrcTag(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const base = stripPageSuffix(filename);
  if (!base) return null;
  const segments = base.split("-").filter(Boolean);
  return segments[segments.length - 1] || null;
}

export function metrcTagSuffix(filename: string | null | undefined, n = 4): string | null {
  if (!filename) return null;
  const base = stripPageSuffix(filename);
  return base ? base.slice(-n) : null;
}
