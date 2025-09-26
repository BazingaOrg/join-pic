import type { SlotPlacement } from "./smart-layout";
import type { WorkspaceImage } from "@/types/workspace";

export type MasonryLayoutItem = {
  id: string;
  image: WorkspaceImage;
  left: number;
  top: number;
  width: number;
  height: number;
  column: number;
};

export type MasonryLayoutResult = {
  items: MasonryLayoutItem[];
  width: number;
  height: number;
  columnWidth: number;
  gap: number;
  columns: number;
};

type MasonryOptions = {
  columns?: number;
  columnWidth?: number;
  gap?: number;
};

export function computeMasonryLayout(
  placements: SlotPlacement[],
  options: MasonryOptions = {},
): MasonryLayoutResult | null {
  const { columns = 3, columnWidth = 1, gap = 0 } = options;
  const filled = placements.filter((placement): placement is Required<SlotPlacement> => Boolean(placement.image));

  if (filled.length === 0 || columns <= 0 || columnWidth <= 0) {
    return null;
  }

  const columnHeights = Array.from({ length: columns }, () => 0);
  const items: MasonryLayoutItem[] = [];
  const effectiveGap = Math.max(0, gap);

  const normalizedColumnWidth = columnWidth;

  for (const placement of filled) {
    const image = placement.image;
    const ratio = image.height ? image.width / image.height : 1;
    const height = ratio > 0 ? normalizedColumnWidth / ratio : normalizedColumnWidth;

    let targetColumn = 0;
    let minHeight = columnHeights[0];
    for (let index = 1; index < columns; index += 1) {
      if (columnHeights[index] < minHeight) {
        targetColumn = index;
        minHeight = columnHeights[index];
      }
    }

    const left = targetColumn * (normalizedColumnWidth + effectiveGap);
    const top = columnHeights[targetColumn];

    columnHeights[targetColumn] += height + effectiveGap;

    items.push({
      id: placement.slot.id,
      image,
      left,
      top,
      width: normalizedColumnWidth,
      height,
      column: targetColumn,
    });
  }

  const totalWidth = columns * normalizedColumnWidth + effectiveGap * Math.max(columns - 1, 0);
  const rawHeight = Math.max(...columnHeights);
  const totalHeight = rawHeight > 0 ? rawHeight - effectiveGap : rawHeight;

  return {
    items,
    width: totalWidth,
    height: Math.max(totalHeight, 0),
    columnWidth: normalizedColumnWidth,
    gap: effectiveGap,
    columns,
  };
}
