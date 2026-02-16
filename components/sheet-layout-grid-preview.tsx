"use client";

interface SheetLayoutGridPreviewProps {
  sheetWidth: number;
  sheetHeight: number;
  labelWidth: number;
  labelHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  gapX: number;
  gapY: number;
  cornerRadius: number;
}

export function SheetLayoutGridPreview({
  sheetWidth,
  sheetHeight,
  labelWidth,
  labelHeight,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  gapX,
  gapY,
  cornerRadius,
}: SheetLayoutGridPreviewProps) {
  // Guard against invalid values
  if (
    sheetWidth <= 0 ||
    sheetHeight <= 0 ||
    labelWidth <= 0 ||
    labelHeight <= 0
  ) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-8">
        <p className="text-sm text-muted-foreground">
          Enter valid dimensions to see preview
        </p>
      </div>
    );
  }

  const availableWidth = sheetWidth - marginLeft - marginRight;
  const availableHeight = sheetHeight - marginTop - marginBottom;

  const columns = Math.max(
    1,
    Math.floor((availableWidth + gapX) / (labelWidth + gapX))
  );
  const rows = Math.max(
    1,
    Math.floor((availableHeight + gapY) / (labelHeight + gapY))
  );

  // Scale to fit container
  const maxContainerWidth = 400;
  const scale = maxContainerWidth / sheetWidth;
  const svgWidth = sheetWidth * scale;
  const svgHeight = sheetHeight * scale;

  // Convert corner radius from mm to cm for consistent units
  const radiusCm = cornerRadius / 10;

  const labels: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      labels.push({
        x: marginLeft + col * (labelWidth + gapX),
        y: marginTop + row * (labelHeight + gapY),
      });
    }
  }

  return (
    <div className="space-y-2">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
        className="mx-auto rounded border bg-white"
      >
        {/* Sheet outline */}
        <rect
          x={0}
          y={0}
          width={sheetWidth}
          height={sheetHeight}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={0.05}
        />

        {/* Margin area (dashed) */}
        <rect
          x={marginLeft}
          y={marginTop}
          width={sheetWidth - marginLeft - marginRight}
          height={sheetHeight - marginTop - marginBottom}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={0.02}
          strokeDasharray="0.1 0.05"
        />

        {/* Label rectangles */}
        {labels.map((label, i) => (
          <rect
            key={i}
            x={label.x}
            y={label.y}
            width={labelWidth}
            height={labelHeight}
            rx={radiusCm}
            ry={radiusCm}
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={0.02}
          />
        ))}
      </svg>
      <p className="text-center text-xs text-muted-foreground">
        {columns} x {rows} = {columns * rows} labels per sheet
      </p>
    </div>
  );
}
