// Auto-pack order items into shipping boxes.
//
// Rules (per-order `unitsPerBox`, default 32):
// 1. Each item with qty >= unitsPerBox is split into floor(qty / unitsPerBox)
//    solo boxes of that strain. Remainder joins the mixed pool.
// 2. Items with qty < unitsPerBox go into the mixed pool.
// 3. The mixed pool is greedily packed into boxes <= unitsPerBox each.
//
// Tag suffixes per box are derived from `item.metrc_tag` (the start tag of
// the item's range). METRC tags are sequential, so the box's tag range is
// startTag + tagStartIndex .. startTag + tagStartIndex + quantity - 1.

export interface BoxItem {
  orderItemId: number;
  productName: string;
  strainId: number | null;
  strainName: string | null;
  strainSlug: string | null;
  strainImageUrl: string | null;
  quantity: number;
  /** Position within the item's tag range where this box's units start. */
  tagStartIndex: number;
  /** Item-level METRC start tag (full string from order_item.metrc_tag). */
  startTag: string | null;
  /** Total tags imported for this order item. */
  totalTagsForItem: number;
}

export interface BoxPlan {
  boxNumber: number;
  totalBoxes: number;
  /** True if every BoxItem in this box belongs to the same strain. */
  singleStrain: boolean;
  items: BoxItem[];
  totalUnits: number;
}

interface InputItem {
  id: number;
  product_name: string;
  quantity: number;
  metrc_tag?: string | null;
  strain_id?: number | null;
  strain_name?: string | null;
  strain_slug?: string | null;
  strain_image_url?: string | null;
  metrc_label_sets?: { item_count: number; processing_status?: string }[];
}

function buildItem(input: InputItem, qty: number, tagStartIndex: number): BoxItem {
  return {
    orderItemId: input.id,
    productName: input.product_name,
    strainId: input.strain_id ?? null,
    strainName: input.strain_name ?? null,
    strainSlug: input.strain_slug ?? null,
    strainImageUrl: input.strain_image_url ?? null,
    quantity: qty,
    tagStartIndex,
    startTag: input.metrc_tag ?? null,
    totalTagsForItem: (input.metrc_label_sets ?? []).reduce((s, ms) => s + (ms.item_count || 0), 0),
  };
}

export function packBoxes(items: InputItem[], unitsPerBox: number): BoxPlan[] {
  if (unitsPerBox <= 0) return [];
  const boxes: BoxPlan[] = [];

  // Track how many units of each item have been placed so we can compute
  // sequential tagStartIndex per chunk.
  const consumed = new Map<number, number>();
  const consume = (id: number, n: number): number => {
    const start = consumed.get(id) ?? 0;
    consumed.set(id, start + n);
    return start;
  };

  // Pass 1: solo boxes per item with qty >= unitsPerBox.
  const remainders: InputItem[] = [];
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const fullBoxes = Math.floor(item.quantity / unitsPerBox);
    const remainder = item.quantity - fullBoxes * unitsPerBox;
    for (let i = 0; i < fullBoxes; i++) {
      const tagStart = consume(item.id, unitsPerBox);
      boxes.push({
        boxNumber: 0,
        totalBoxes: 0,
        singleStrain: true,
        items: [buildItem(item, unitsPerBox, tagStart)],
        totalUnits: unitsPerBox,
      });
    }
    if (remainder > 0) remainders.push({ ...item, quantity: remainder });
  }

  // Pass 2: greedy bin-pack remainders. Largest first to minimize box count.
  remainders.sort((a, b) => b.quantity - a.quantity);
  const open: BoxPlan[] = [];
  for (const rem of remainders) {
    let placed = false;
    let qty = rem.quantity;
    while (qty > 0) {
      const box = open.find((b) => b.totalUnits + qty <= unitsPerBox)
        ?? open.find((b) => b.totalUnits < unitsPerBox);
      if (box) {
        const space = unitsPerBox - box.totalUnits;
        const take = Math.min(qty, space);
        const tagStart = consume(rem.id, take);
        box.items.push(buildItem(rem, take, tagStart));
        box.totalUnits += take;
        box.singleStrain = box.singleStrain && box.items.every((i) => i.strainId === box.items[0].strainId);
        qty -= take;
        placed = true;
        if (box.totalUnits >= unitsPerBox) {
          // Box is full — move it from open to closed.
          open.splice(open.indexOf(box), 1);
          boxes.push(box);
        }
      } else {
        const take = Math.min(qty, unitsPerBox);
        const tagStart = consume(rem.id, take);
        open.push({
          boxNumber: 0,
          totalBoxes: 0,
          singleStrain: true,
          items: [buildItem(rem, take, tagStart)],
          totalUnits: take,
        });
        qty -= take;
        placed = true;
      }
    }
    if (!placed) throw new Error("Failed to pack box for " + rem.product_name);
  }
  // Push remaining open boxes.
  boxes.push(...open);

  // Number boxes.
  boxes.forEach((b, i) => {
    b.boxNumber = i + 1;
    b.totalBoxes = boxes.length;
  });

  return boxes;
}

/**
 * Compute the actual full METRC tags for the units in this box.
 * METRC tags are sequential numeric — increment the start tag by index.
 */
export function tagsForBoxItem(item: BoxItem): string[] {
  if (!item.startTag) return [];
  const match = item.startTag.match(/^(.*?)(\d+)$/);
  if (!match) return Array(item.quantity).fill(item.startTag);
  const [, prefix, numStr] = match;
  const startNum = parseInt(numStr, 10);
  const width = numStr.length;
  const out: string[] = [];
  for (let i = 0; i < item.quantity; i++) {
    const next = String(startNum + item.tagStartIndex + i).padStart(width, "0");
    out.push(prefix + next);
  }
  return out;
}

/**
 * Format full tags for display: range when ≥ 4 consecutive, comma list
 * for 3 or fewer. Tags are shown in full unless `suffixLen` truncates.
 */
export function formatTagDisplay(tags: string[], suffixLen?: number): string {
  if (tags.length === 0) return "";
  const fmt = (t: string) => suffixLen ? `…${t.slice(-suffixLen)}` : t;
  if (tags.length <= 3) return tags.map(fmt).join(", ");
  return `${fmt(tags[0])} → ${fmt(tags[tags.length - 1])}`;
}
