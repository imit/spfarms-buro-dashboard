"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import type { Label } from "@/lib/api"

const CM_TO_PX = 37.7953

interface DragHandle {
  key: string
  label: string
  x: number
  y: number
  width: number
  height: number
  color: string
  zIndex?: number
}

interface LabelCanvasEditorProps {
  svgHtml: string
  label: Label
  onElementMoved: (element: string, x: number, y: number) => void
}

export function LabelCanvasEditor({
  svgHtml,
  label,
  onElementMoved,
}: LabelCanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState<{
    key: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 })

  const widthPx = parseFloat(label.width_cm) * CM_TO_PX
  const heightPx = parseFloat(label.height_cm) * CM_TO_PX

  // Track rendered size to compute scale
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const svg = el.querySelector("svg")
      if (svg) {
        setScale(svg.getBoundingClientRect().width / widthPx)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [svgHtml, widthPx])

  // Build drag handles from label design
  const handles: DragHandle[] = []
  const d = label.design

  if (d?.qr?.enabled) {
    const qr = d.qr
    const size = qr.size ?? 50
    handles.push({
      key: "qr",
      label: "QR",
      x: qr.x ?? 160,
      y: qr.y ?? 12,
      width: size,
      height: size,
      color: "#8b5cf6",
      zIndex: 14,
    })
  }

  if (d?.logo?.visible) {
    const logo = d.logo
    handles.push({
      key: "logo",
      label: "Logo",
      x: logo.x ?? 8,
      y: logo.y ?? 8,
      width: logo.width ?? 36,
      height: logo.height ?? 36,
      color: "#f59e0b",
      zIndex: 15,
    })
  }

  if (d?.metrc_zone?.enabled) {
    const mz = d.metrc_zone
    handles.push({
      key: "metrc_zone",
      label: "METRC",
      x: mz.x ?? 10,
      y: mz.y ?? 150,
      width: mz.width ?? 80,
      height: mz.height ?? 30,
      color: "#10b981",
      zIndex: 13,
    })
  }

  if (d?.product_info?.enabled) {
    const pi = d.product_info
    handles.push({
      key: "product_info",
      label: "Product Info",
      x: pi.x ?? 0,
      y: pi.y ?? 160,
      width: pi.width ?? 200,
      height: pi.height ?? 30,
      color: "#f97316",
      zIndex: 11,
    })
  }

  if (d?.weight_info?.enabled) {
    const wi = d.weight_info
    handles.push({
      key: "weight_info",
      label: "Weight",
      x: wi.x ?? 0,
      y: wi.y ?? 160,
      width: wi.width ?? 100,
      height: wi.height ?? 30,
      color: "#a855f7",
      zIndex: 10,
    })
  }

  if (d?.expiration_date?.enabled) {
    const ed = d.expiration_date
    handles.push({
      key: "expiration_date",
      label: "Exp. Date",
      x: ed.x ?? 0,
      y: ed.y ?? 170,
      width: ed.width ?? 100,
      height: ed.height ?? 20,
      color: "#ef4444",
      zIndex: 9,
    })
  }

  if (d?.cannabinoid_info?.enabled) {
    const ci = d.cannabinoid_info
    handles.push({
      key: "cannabinoid_info",
      label: "Cannabinoids",
      x: ci.x ?? 0,
      y: ci.y ?? 140,
      width: ci.width ?? 160,
      height: ci.height ?? 40,
      color: "#06b6d4",
      zIndex: 12,
    })
  }

  const textLayers: Array<{ key: string; label: string; color: string; zIndex: number }> = [
    { key: "batch_id", label: "Batch ID", color: "#0ea5e9", zIndex: 7 },
    { key: "product_id_text", label: "Product ID", color: "#14b8a6", zIndex: 6 },
    { key: "lot_number", label: "Lot #", color: "#d946ef", zIndex: 5 },
    { key: "harvest_date", label: "Harvest Date", color: "#f43f5e", zIndex: 4 },
  ]
  for (const tl of textLayers) {
    const cfg = d?.[tl.key as keyof typeof d] as
      | { enabled?: boolean; x?: number; y?: number; width?: number; height?: number }
      | undefined
    if (cfg?.enabled) {
      handles.push({
        key: tl.key,
        label: tl.label,
        x: cfg.x ?? 0,
        y: cfg.y ?? 0,
        width: cfg.width ?? 100,
        height: cfg.height ?? 20,
        color: tl.color,
        zIndex: tl.zIndex,
      })
    }
  }

  for (const ov of label.overlays || []) {
    handles.push({
      key: `overlay:${ov.id}`,
      label: ov.name || "Overlay",
      x: parseFloat(ov.position_x) || 0,
      y: parseFloat(ov.position_y) || 0,
      width: parseFloat(ov.width) || 40,
      height: parseFloat(ov.height) || 40,
      color: "#ec4899",
      zIndex: 20 + (ov.z_index ?? 0),
    })
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent, handle: DragHandle) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setDragging({
        key: handle.key,
        startX: e.clientX,
        startY: e.clientY,
        origX: handle.x,
        origY: handle.y,
      })
      setDragOffset({ dx: 0, dy: 0 })
    },
    []
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      e.preventDefault()
      setDragOffset({
        dx: e.clientX - dragging.startX,
        dy: e.clientY - dragging.startY,
      })
    },
    [dragging]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      e.preventDefault()
      const dx = (e.clientX - dragging.startX) / scale
      const dy = (e.clientY - dragging.startY) / scale
      const newX = Math.round((dragging.origX + dx) * 10) / 10
      const newY = Math.round((dragging.origY + dy) * 10) / 10
      setDragging(null)
      setDragOffset({ dx: 0, dy: 0 })
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        onElementMoved(dragging.key, newX, newY)
      }
    },
    [dragging, scale, onElementMoved]
  )

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="max-w-full [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />

      {/* Drag handles */}
      {handles.map((h) => {
        const isDragging = dragging?.key === h.key
        const left = h.x * scale + (isDragging ? dragOffset.dx : 0)
        const top = h.y * scale + (isDragging ? dragOffset.dy : 0)

        return (
          <div
            key={h.key}
            className="absolute group"
            style={{
              left,
              top,
              width: h.width * scale,
              height: h.height * scale,
              cursor: isDragging ? "grabbing" : "grab",
              zIndex: isDragging ? 50 : (h.zIndex ?? 10),
            }}
            onPointerDown={(e) => onPointerDown(e, h)}
          >
            <div
              className={`absolute inset-0 rounded-sm transition-opacity ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              style={{
                border: `1.5px dashed ${h.color}`,
                backgroundColor: `${h.color}10`,
              }}
            />
            <span
              className={`absolute -top-5 left-0 text-[10px] font-semibold px-1 rounded-sm text-white whitespace-nowrap transition-opacity ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              style={{ backgroundColor: h.color }}
            >
              {h.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
