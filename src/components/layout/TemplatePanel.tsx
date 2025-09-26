"use client";

import Image from "next/image";
import { useMemo } from "react";
import { TEMPLATES, type TemplateDefinition } from "@/lib/templates";
import { useWorkspaceStore } from "@/store/workspace-store";

type TemplatePanelProps = {
  className?: string;
  variant?: "sidebar" | "sheet";
  onClose?: () => void;
};

export function TemplatePanel({ className = "", variant = "sidebar", onClose }: TemplatePanelProps) {
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const setTemplate = useWorkspaceStore((state) => state.setTemplate);

  const items = useMemo(() => {
    return TEMPLATES.map((template) => ({
      ...template,
      isActive: template.id === selectedTemplateId,
      badge: template.dynamic ? "自动匹配" : getTemplateBadge(template),
    }));
  }, [selectedTemplateId]);

  const baseClass =
    variant === "sheet"
      ? "rounded-t-3xl border border-white/20 bg-app-panel px-4 pb-6 pt-4 shadow-2xl"
      : "h-full w-full rounded-3xl border border-app bg-app-surface px-4 py-5 xl:px-5";

  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-white">模版</h2>
          <span className="text-[11px] text-app-muted">{TEMPLATES.length} 个预设</span>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:text-white"
            onClick={onClose}
          >
            收起
          </button>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setTemplate(item.id)}
              className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                item.isActive
                  ? "border-white/60 bg-white/10 text-white"
                  : "border-transparent bg-white/5 text-app-muted hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                <Image src={item.icon} alt={item.name} width={48} height={48} className="h-8 w-auto opacity-90" />
              </div>
              <div className="flex flex-col w-xs">
                <span
                  className={`text-sm font-medium leading-tight ${
                    item.isActive ? "text-white" : "text-white/80"
                  }`}
                >
                  {item.name}
                </span>
                <span className="mt-0.5 text-[11px] text-white/60">
                  {item.badge}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getTemplateBadge(template: TemplateDefinition) {
  if (template.recommendedImages <= 0) {
    if (template.layout === "horizontal-strip") {
      return "多张横图";
    }
    if (template.layout === "vertical-strip") {
      return "多张竖图";
    }
    return "自由张数";
  }
  return `推荐 ${template.recommendedImages} 张`;
}
