"use client";

import { useState } from "react";
import Image from "next/image";
import { useWorkspaceStore } from "@/store/workspace-store";

export function ImageRail() {
  const images = useWorkspaceStore((state) => state.images);
  const removeImage = useWorkspaceStore((state) => state.removeImage);
  const reorderImages = useWorkspaceStore((state) => state.reorderImages);
  const clearImages = useWorkspaceStore((state) => state.clearImages);
  const [mobileOpen, setMobileOpen] = useState(false);

  const thumbnails = images.map((image, index) => (
    <figure
      key={image.id}
      className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-md"
    >
      <Image
        src={image.src}
        alt={image.name}
        fill
        className="h-full w-full object-cover"
        sizes="96px"
        unoptimized
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
        {index + 1}. {image.name}
      </figcaption>
      <div className="absolute inset-x-0 top-1 flex items-center justify-around text-[10px] opacity-0 transition group-hover:opacity-100">
        <button
          className="rounded-full bg-black/50 px-2 py-0.5 text-white transition hover:bg-black/70 disabled:opacity-40"
          type="button"
          onClick={() => reorderImages(index, index - 1)}
          disabled={index === 0}
        >
          ↑
        </button>
        <button
          className="rounded-full bg-black/50 px-2 py-0.5 text-white transition hover:bg-black/70 disabled:opacity-40"
          type="button"
          onClick={() => reorderImages(index, index + 1)}
          disabled={index === images.length - 1}
        >
          ↓
        </button>
      </div>
      <button
        type="button"
        className="absolute right-1 top-1 rounded-full bg-black/60 px-1 text-[10px] text-white transition hover:bg-black/80"
        onClick={() => removeImage(image.id)}
      >
        ✕
      </button>
    </figure>
  ));

  return (
    <section className="w-full rounded-3xl border border-app bg-app-surface-soft">
      <div className="hidden gap-4 px-6 py-4 text-white/70 md:flex md:flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">图片列表</h2>
          <div className="flex items-center gap-3 text-xs">
            <span>{images.length} 张</span>
            {images.length > 0 && (
              <button
                type="button"
                className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/70 transition hover:border-white/35 hover:text-white"
                onClick={clearImages}
              >
                清空
              </button>
            )}
          </div>
        </div>
        {images.length === 0 ? (
          <p className="text-xs text-white/60">暂无图片，上传后会显示在这里。</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">{thumbnails}</div>
        )}
      </div>

      <div className="md:hidden border-t border-white/10 px-4 py-3 text-white/70">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-black/60 px-4 py-2 text-sm text-white"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span>图片（{images.length}）</span>
          <span className="text-xs text-white/60">{mobileOpen ? "收起" : "展开"}</span>
        </button>
        {mobileOpen && (
          <div className="mt-3 space-y-2">
            {images.length === 0 ? (
              <p className="text-xs text-white/60">暂无图片，点击画布或上传按钮添加。</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">{thumbnails}</div>
            )}
            {images.length > 0 && (
              <button
                type="button"
                className="w-full rounded-xl border border-white/20 px-3 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
                onClick={clearImages}
              >
                清空全部
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
