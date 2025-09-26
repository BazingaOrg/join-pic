"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  resolveEffectiveTemplate,
  mapImagesToTemplateSlots,
  type SlotPlacement,
} from "@/lib/smart-layout";
import { computeMasonryLayout } from "@/lib/layout-utils";
import { useWorkspaceStore } from "@/store/workspace-store";
import { UploadDropzone, type UploadDropzoneHandle } from "./UploadDropzone";

const EMPTY_STAGE_RATIO = 4 / 3;
const MIN_STAGE_HEIGHT = 420;

export function CanvasStage() {
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const zoom = useWorkspaceStore((state) => state.zoom);
  const setZoom = useWorkspaceStore((state) => state.setZoom);
  const images = useWorkspaceStore((state) => state.images);
  const masonryColumns = useWorkspaceStore((state) => state.masonryColumns);
  const spacing = useWorkspaceStore((state) => state.spacing);
  const padding = useWorkspaceStore((state) => state.padding);
  const backgroundColor = useWorkspaceStore((state) => state.backgroundColor);
  const borderRadius = useWorkspaceStore((state) => state.borderRadius);
  const borderWidth = useWorkspaceStore((state) => state.borderWidth);
  const borderColor = useWorkspaceStore((state) => state.borderColor);

  const dropzoneRef = useRef<UploadDropzoneHandle>(null);
  const resolved = useMemo(
    () => resolveEffectiveTemplate(selectedTemplateId, images),
    [selectedTemplateId, images],
  );
  const { effectiveTemplate } = resolved;
  const { placements, unusedImages } = useMemo(
    () => mapImagesToTemplateSlots(effectiveTemplate, images),
    [effectiveTemplate, images],
  );
  const masonryReferenceWidth = useMemo(
    () => getMasonryReferenceWidth(placements),
    [placements],
  );

  const masonryLayout = useMemo(() => {
    if (effectiveTemplate.layout !== "masonry") {
      return null;
    }
    return computeMasonryLayout(placements, {
      columns: masonryColumns,
      columnWidth: masonryReferenceWidth,
      gap: spacing,
    });
  }, [effectiveTemplate.layout, masonryColumns, masonryReferenceWidth, placements, spacing]);

  const stageAspectRatio = useMemo(
    () => {
      if (
        effectiveTemplate.layout === "masonry" &&
        masonryLayout &&
        masonryLayout.height > 0
      ) {
        return masonryLayout.width / masonryLayout.height;
      }
      return computeStageAspectRatio(
        effectiveTemplate.stageAspectRatio,
        effectiveTemplate.layout,
        placements,
      );
    },
    [
      effectiveTemplate.layout,
      effectiveTemplate.stageAspectRatio,
      masonryLayout,
      placements,
    ],
  );
  const layoutClass = useMemo(
    () => getLayoutContainerClass(effectiveTemplate.layout, placements.length),
    [effectiveTemplate.layout, placements.length],
  );
  const layoutStyle = useMemo(
    () => getLayoutStyle(effectiveTemplate.layout, spacing),
    [effectiveTemplate.layout, spacing],
  );

  const isEmpty = images.length === 0;

  const collageStyle = useMemo<CSSProperties>(
    () => {
      const safePadding = Math.max(0, padding);
      const safeRadius = Math.max(0, borderRadius);
      const safeBorder = Math.max(0, borderWidth);
      return {
        backgroundColor: isEmpty ? "transparent" : backgroundColor,
        padding: `${safePadding}px`,
        borderRadius: `${safeRadius}px`,
        border: safeBorder > 0 ? `${safeBorder}px solid ${borderColor}` : "none",
        boxSizing: "border-box",
        overflow: "hidden",
      };
    },
    [backgroundColor, borderColor, borderRadius, borderWidth, isEmpty, padding],
  );
  const displayAspectRatio = isEmpty ? EMPTY_STAGE_RATIO : stageAspectRatio;

  useEffect(() => {
    if (images.length === 0) {
      return;
    }

    const filledPlacements = placements.filter((placement) => placement.image);
    if (filledPlacements.length === 0) {
      return;
    }

    const formattedStage = Number.isFinite(stageAspectRatio)
      ? stageAspectRatio.toFixed(3)
      : String(stageAspectRatio);

    console.groupCollapsed(
      `[Layout Debug] ${effectiveTemplate.name} · ${effectiveTemplate.layout} | 图片 ${filledPlacements.length} 张，未分配 ${unusedImages.length} 张`,
    );
    console.info("舞台宽高比", formattedStage);
    console.table(
      filledPlacements.map((placement, index) => {
        const image = placement.image!;
        const ratio = image.height ? image.width / image.height : 1;
        return {
          index,
          name: image.name,
          slotRatio: placement.slot.aspectRatio.toFixed(3),
          imageRatio: ratio.toFixed(3),
          width: image.width,
          height: image.height,
        };
      }),
    );
    console.groupEnd();
  }, [
    effectiveTemplate.id,
    effectiveTemplate.layout,
    effectiveTemplate.name,
    images.length,
    placements,
    stageAspectRatio,
    unusedImages.length,
  ]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-5">
      <div className="absolute right-1/2 translate-x-1/2 translate-y-1/2 -top-5 z-10 hidden gap-3 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-xs text-white shadow-lg md:flex">
        <button
          type="button"
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white transition hover:border-white/30"
          onClick={() => dropzoneRef.current?.open()}
        >
          上传图片
        </button>
        <div className="flex items-center gap-2 text-white/70">
          <span>缩放</span>
          <input
            className="h-1 w-28 appearance-none rounded-full bg-white/10 accent-white"
            type="range"
            min={0.5}
            max={1.4}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <span className="font-semibold text-white">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="relative flex h-full w-full flex-1 items-center justify-center">
        <div
          className="relative origin-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              aspectRatio: displayAspectRatio,
              width: "min(880px, 80vw)",
              minHeight: `${MIN_STAGE_HEIGHT}px`,
            }}
          >
            <UploadDropzone ref={dropzoneRef} isEmpty={images.length === 0}>
              <div className="absolute inset-0 flex flex-col">
                <div className="relative flex-1 p-5">
                  <div className="flex h-full w-full items-stretch justify-stretch">
                    <div className="relative flex h-full w-full items-stretch justify-stretch" style={collageStyle}>
                      {isEmpty ? (
                        <EmptyStage onUpload={() => dropzoneRef.current?.open()} />
                      ) : effectiveTemplate.layout === "masonry" && masonryLayout ? (
                        <div className="relative h-full w-full">
                          {masonryLayout.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="absolute overflow-hidden rounded-lg border border-white/10"
                              style={{
                                left: `${(item.left / masonryLayout.width) * 100}%`,
                                top: `${(item.top / Math.max(masonryLayout.height, 1e-6)) * 100}%`,
                                width: `${(item.width / masonryLayout.width) * 100}%`,
                                height: `${(item.height / Math.max(masonryLayout.height, 1e-6)) * 100}%`,
                              }}
                            >
                              <Image
                                src={item.image.src}
                                alt={item.image.name}
                                fill
                                className="h-full w-full object-cover"
                                sizes="(max-width: 768px) 80vw, 640px"
                                priority={index < 3}
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      ) : placements.length > 0 ? (
                        <div className={`${layoutClass} h-full w-full`} style={layoutStyle}>
                          {placements.map(({ slot, image }, index) => {
                            if (!image) {
                              return null;
                            }
                            return (
                              <div
                                key={slot.id}
                                className={`${getSlotContainerClass()} ${getSlotSpanClass(effectiveTemplate.layout, index)} rounded-lg border border-white/15`}
                                style={{ aspectRatio: slot.aspectRatio }}
                              >
                                <Image
                                  src={image.src}
                                  alt={image.name}
                                  fill
                                  className={`h-full w-full ${getImageObjectFitClass(effectiveTemplate.layout)}`}
                                  sizes="(max-width: 768px) 80vw, 640px"
                                  priority={index < 3}
                                  unoptimized
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {unusedImages.length > 0 && !isEmpty && (
                  <div className="border-t border-dashed border-white/15 px-6 py-3 text-xs text-white/60">
                    <span className="font-medium">待分配：</span>
                    {unusedImages.length} 张图片暂未进入模版，试试调整顺序或换模版。
                  </div>
                )}
              </div>
            </UploadDropzone>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 z-30 flex w-[calc(100vw-2rem)] max-w-xs -translate-x-1/2 flex-col items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => dropzoneRef.current?.open()}
          className="rounded-full border border-white/20 bg-black/80 px-5 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:border-white/35"
        >
          上传图片
        </button>
        <div className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-xs text-white shadow-lg">
          <span className="text-white/70">缩放</span>
          <input
            className="h-1 w-full max-w-[160px] appearance-none rounded-full bg-white/10 accent-white"
            type="range"
            min={0.5}
            max={1.4}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <span className="font-semibold text-white">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

function EmptyStage({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-white/70">拖拽图片到这里，或点击上传。</p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onUpload();
        }}
        className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/35 hover:text-white"
      >
        选择图片
      </button>
    </div>
  );
}

function getLayoutContainerClass(layout: string, slotCount: number) {
  switch (layout) {
    case "horizontal-strip":
      return "flex flex-row items-stretch";
    case "vertical-strip":
      return "flex flex-col items-stretch";
    case "masonry":
      return "grid grid-cols-3";
    default:
      return slotCount > 3 ? "grid grid-cols-3" : "grid grid-cols-2";
  }
}

function getLayoutStyle(layout: string, spacing: number): CSSProperties | undefined {
  const gap = `${Math.max(0, spacing)}px`;
  if (layout === "horizontal-strip") {
    return { alignItems: "stretch", gap };
  }
  if (layout === "vertical-strip") {
    return { gap };
  }
  if (layout === "masonry") {
    return { gridAutoRows: "minmax(60px, 1fr)", gap };
  }
  return { gap };
}

function getSlotSpanClass(layout: string, index: number) {
  if (layout === "horizontal-strip") {
    return "flex-none h-full";
  }
  if (layout === "vertical-strip") {
    return "flex-none w-full";
  }
  if (layout !== "masonry") {
    return "";
  }

  const spans = ["row-span-2", "row-span-1", "row-span-1", "row-span-2", "row-span-1", "row-span-2"];
  return spans[index] ?? "";
}

function getImageObjectFitClass(layout: string) {
  if (layout === "horizontal-strip" || layout === "vertical-strip") {
    return "object-contain";
  }
  return "object-cover";
}

function getSlotContainerClass() {
  return "relative overflow-hidden bg-black/40";
}

function getMasonryReferenceWidth(placements: SlotPlacement[]): number {
  const widths = placements
    .map((placement) => placement.image?.width)
    .filter((value): value is number => typeof value === "number" && value > 0);
  if (widths.length === 0) {
    return 1;
  }
  return Math.max(1, Math.min(...widths));
}

function computeStageAspectRatio(
  fallback: number,
  layout: string,
  placements: SlotPlacement[],
): number {
  if (placements.length === 0) {
    return fallback;
  }

  if (layout === "horizontal-strip") {
    const dimensions = placements
      .map((placement) => placement.image)
      .filter((image): image is NonNullable<typeof image> => Boolean(image));
    if (dimensions.length === 0) {
      return fallback;
    }
    const totalWidth = dimensions.reduce((acc, image) => acc + image.width, 0);
    const height = dimensions[0]?.height ?? 1;
    return Math.max(totalWidth / Math.max(height, 1), 0.5);
  }

  if (layout === "vertical-strip") {
    const dimensions = placements
      .map((placement) => placement.image)
      .filter((image): image is NonNullable<typeof image> => Boolean(image));
    if (dimensions.length === 0) {
      return fallback;
    }
    const totalHeight = dimensions.reduce((acc, image) => acc + image.height, 0);
    const width = dimensions[0]?.width ?? 1;
    return Math.max(width / Math.max(totalHeight, 1), 0.5);
  }

  return fallback;
}
