"use client";

import Image from "next/image";
import { useState } from "react";
import { exportCollage } from "@/lib/exporter";
import { resolveEffectiveTemplate, mapImagesToTemplateSlots } from "@/lib/smart-layout";
import { showNotification } from "@/store/notification-store";
import { useWorkspaceStore } from "@/store/workspace-store";

type TopBarProps = {
  onOpenTemplates?: () => void;
  onOpenProperties?: () => void;
};

export function TopBar({ onOpenProperties, onOpenTemplates }: TopBarProps) {
  const images = useWorkspaceStore((state) => state.images);
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);
  const masonryColumns = useWorkspaceStore((state) => state.masonryColumns);
  const spacing = useWorkspaceStore((state) => state.spacing);
  const padding = useWorkspaceStore((state) => state.padding);
  const backgroundColor = useWorkspaceStore((state) => state.backgroundColor);
  const borderRadius = useWorkspaceStore((state) => state.borderRadius);
  const borderWidth = useWorkspaceStore((state) => state.borderWidth);
  const borderColor = useWorkspaceStore((state) => state.borderColor);
  const [isExporting, setIsExporting] = useState(false);

  const handleReset = () => {
    resetWorkspace();
  };

  const handleExport = async () => {
    if (isExporting) {
      return;
    }
    if (images.length === 0) {
      showNotification({
        title: "暂无图片",
        message: "先上传至少一张图片再导出。",
        variant: "warning",
      });
      return;
    }

    setIsExporting(true);
    try {
      const { effectiveTemplate } = resolveEffectiveTemplate(selectedTemplateId, images);
      const { placements } = mapImagesToTemplateSlots(effectiveTemplate, images);

      const blob = await exportCollage(effectiveTemplate, placements, {
        masonryColumns,
        spacing,
        padding,
        backgroundColor,
        borderRadius,
        borderWidth,
        borderColor,
      });
      if (!blob) {
        throw new Error("empty-blob");
      }

      const filename = `joinpic_${formatTimestamp(new Date())}.png`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      showNotification({
        title: "导出成功",
        message: `${filename} 已保存。`,
        variant: "success",
      });
    } catch (error) {
      console.error("导出失败", error);
      showNotification({
        title: "导出失败",
        message: "保存拼图时出现问题，请稍后再试。",
        variant: "danger",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 border-b border-app bg-app-panel/95 px-4">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icons/logo.svg" alt="JoinPic" width={32} height={32} className="h-10 w-10 flex-shrink-0" />
          <div className="leading-tight">
            <span className="text-sm font-semibold text-white">JoinPic</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white"
          >
            模版
          </button>
          <button
            type="button"
            onClick={onOpenProperties}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white"
          >
            属性
          </button>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
            {images.length} 张图片
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
            >
              清空
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={images.length === 0 || isExporting}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                images.length === 0 || isExporting
                  ? "border border-white/10 text-white/40"
                  : "bg-white text-black shadow-lg hover:bg-white/90"
              }`}
            >
              {isExporting ? "导出中" : "导出"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
