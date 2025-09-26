import { computeMasonryLayout } from "./layout-utils";
import type { SlotPlacement } from "@/lib/smart-layout";
import type { TemplateDefinition } from "@/lib/templates";

type PreparedImage = {
  element: HTMLImageElement;
  placement: SlotPlacement & { image: NonNullable<SlotPlacement["image"]> };
};

type ExportOptions = {
  masonryColumns?: number;
  spacing?: number;
  padding?: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
};

export async function exportCollage(
  template: TemplateDefinition,
  placements: SlotPlacement[],
  options: ExportOptions = {},
): Promise<Blob | null> {
  const filledPlacements = placements.filter(
    (placement): placement is SlotPlacement & { image: NonNullable<SlotPlacement["image"]> } =>
      Boolean(placement.image),
  );

  if (filledPlacements.length === 0) {
    return null;
  }

  const prepared = await loadImages(filledPlacements);
  const layout = buildLayout(template, prepared, options);
  if (!layout) {
    return null;
  }

  const safePadding = Math.max(0, options.padding ?? 0);
  const safeBorderWidth = Math.max(0, options.borderWidth ?? 0);
  const safeBorderRadius = Math.max(0, options.borderRadius ?? 0);
  const safeBackgroundColor = options.backgroundColor && options.backgroundColor.trim().length > 0
    ? options.backgroundColor
    : "#ffffff";
  const safeBorderColor = options.borderColor && options.borderColor.trim().length > 0
    ? options.borderColor
    : safeBackgroundColor;

  const offset = safePadding + safeBorderWidth;
  const totalWidth = layout.width + offset * 2;
  const totalHeight = layout.height + offset * 2;

  if (totalWidth <= 0 || totalHeight <= 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(totalWidth));
  canvas.height = Math.max(1, Math.round(totalHeight));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const outerRadius = Math.min(safeBorderRadius, Math.min(canvas.width, canvas.height) / 2);
  const innerRadius = Math.max(outerRadius - safeBorderWidth, 0);

  ctx.save();
  drawRoundedRectPath(
    ctx,
    safeBorderWidth / 2,
    safeBorderWidth / 2,
    canvas.width - safeBorderWidth,
    canvas.height - safeBorderWidth,
    outerRadius,
  );
  ctx.fillStyle = safeBackgroundColor;
  ctx.fill();
  if (safeBorderWidth > 0) {
    ctx.lineWidth = safeBorderWidth;
    ctx.strokeStyle = safeBorderColor;
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(
    ctx,
    safeBorderWidth,
    safeBorderWidth,
    canvas.width - safeBorderWidth * 2,
    canvas.height - safeBorderWidth * 2,
    innerRadius,
  );
  ctx.clip();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const op of layout.drawOperations) {
    ctx.drawImage(
      op.image.element,
      0,
      0,
      op.image.element.naturalWidth,
      op.image.element.naturalHeight,
      op.x + offset,
      op.y + offset,
      op.width,
      op.height,
    );
  }

  ctx.restore();

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

type DrawOperation = {
  image: PreparedImage;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutBuildResult = {
  width: number;
  height: number;
  drawOperations: DrawOperation[];
};

function buildLayout(
  template: TemplateDefinition,
  images: PreparedImage[],
  options: ExportOptions,
): LayoutBuildResult | null {
  const spacing = Math.max(0, options.spacing ?? 0);
  switch (template.layout) {
    case "horizontal-strip":
      return buildHorizontalStrip(images, spacing);
    case "vertical-strip":
      return buildVerticalStrip(images, spacing);
    case "masonry":
      return buildMasonry(images, {
        spacing,
        masonryColumns: options.masonryColumns,
      });
    default:
      return null;
  }
}

function buildHorizontalStrip(images: PreparedImage[], spacing: number): LayoutBuildResult | null {
  const heightCandidates = images
    .map((item) => item.element.naturalHeight || item.placement.image.height || 0)
    .filter((value) => value > 0);
  const height = heightCandidates.length > 0 ? Math.min(...heightCandidates) : 0;

  if (!height) {
    return null;
  }

  const gap = Math.max(0, spacing);
  let cursor = 0;
  const drawOperations: DrawOperation[] = images.map((item) => {
    const itemWidth = item.element.naturalWidth || item.placement.image.width;
    const itemHeight = item.element.naturalHeight || item.placement.image.height;
    const ratio = itemHeight ? itemWidth / itemHeight : 1;
    const targetHeight = height;
    const targetWidth = ratio > 0 ? targetHeight * ratio : itemWidth;
    const op: DrawOperation = {
      image: item,
      x: cursor,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    };
    cursor += targetWidth + gap;
    return op;
  });

  const width = cursor - (images.length > 0 ? gap : 0);

  if (!width) {
    return null;
  }

  return {
    width,
    height,
    drawOperations,
  };
}

function buildVerticalStrip(images: PreparedImage[], spacing: number): LayoutBuildResult | null {
  const widthCandidates = images
    .map((item) => item.element.naturalWidth || item.placement.image.width || 0)
    .filter((value) => value > 0);
  const width = widthCandidates.length > 0 ? Math.min(...widthCandidates) : 0;

  if (!width) {
    return null;
  }

  const gap = Math.max(0, spacing);
  let cursor = 0;
  const drawOperations: DrawOperation[] = images.map((item) => {
    const itemWidth = item.element.naturalWidth || item.placement.image.width;
    const itemHeight = item.element.naturalHeight || item.placement.image.height;
    const ratio = itemWidth ? itemHeight / itemWidth : 1;
    const targetWidth = width;
    const targetHeight = ratio > 0 ? targetWidth * ratio : itemHeight;
    const op: DrawOperation = {
      image: item,
      x: 0,
      y: cursor,
      width: targetWidth,
      height: targetHeight,
    };
    cursor += targetHeight + gap;
    return op;
  });

  const height = cursor - (images.length > 0 ? gap : 0);

  if (!height) {
    return null;
  }

  return {
    width,
    height,
    drawOperations,
  };
}

function buildMasonry(
  images: PreparedImage[],
  options: { masonryColumns?: number; spacing: number },
): LayoutBuildResult | null {
  const placements = images.map((item) => item.placement);
  if (placements.length === 0) {
    return null;
  }

  const columnWidth = Math.max(
    1,
    Math.min(...placements.map((placement) => placement.image.width || 1)),
  );
  const requestedColumns = options.masonryColumns ?? 3;
  const columns = Math.max(1, Math.min(requestedColumns, placements.length));
  const layout = computeMasonryLayout(placements, {
    columns,
    columnWidth,
    gap: options.spacing,
  });

  if (!layout || layout.height <= 0 || layout.width <= 0) {
    return null;
  }

  const imageMap = new Map(images.map((item) => [item.placement.image.id, item]));
  const drawOperations: DrawOperation[] = [];

  for (const item of layout.items) {
    const prepared = imageMap.get(item.image.id);
    if (!prepared) {
      continue;
    }
    drawOperations.push({
      image: prepared,
      x: item.left,
      y: item.top,
      width: item.width,
      height: item.height,
    });
  }

  return {
    width: layout.width,
    height: layout.height,
    drawOperations,
  };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const clampedRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + clampedRadius, y);
  ctx.lineTo(x + width - clampedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  ctx.lineTo(x + width, y + height - clampedRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  ctx.lineTo(x + clampedRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  ctx.lineTo(x, y + clampedRadius);
  ctx.quadraticCurveTo(x, y, x + clampedRadius, y);
  ctx.closePath();
}

async function loadImages(
  placements: (SlotPlacement & { image: NonNullable<SlotPlacement["image"]> })[],
) {
  const elements = await Promise.all(
    placements.map((placement) => loadImageElement(placement.image.src).then((element) => ({ placement, element }))),
  );
  return elements;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
