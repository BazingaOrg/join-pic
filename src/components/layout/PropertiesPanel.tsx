"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { mapImagesToTemplateSlots, resolveEffectiveTemplate } from "@/lib/smart-layout";
import { SMART_TEMPLATE_ID, type TemplateDefinition } from "@/lib/templates";
import { useWorkspaceStore } from "@/store/workspace-store";
import { showNotification } from "@/store/notification-store";

type PropertiesPanelProps = {
  className?: string;
  variant?: "sidebar" | "sheet";
  onClose?: () => void;
};

export function PropertiesPanel({ className = "", variant = "sidebar", onClose }: PropertiesPanelProps) {
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const images = useWorkspaceStore((state) => state.images);
  const masonryColumns = useWorkspaceStore((state) => state.masonryColumns);
  const setMasonryColumns = useWorkspaceStore((state) => state.setMasonryColumns);
  const setTemplate = useWorkspaceStore((state) => state.setTemplate);
  const spacing = useWorkspaceStore((state) => state.spacing);
  const padding = useWorkspaceStore((state) => state.padding);
  const backgroundColor = useWorkspaceStore((state) => state.backgroundColor);
  const borderRadius = useWorkspaceStore((state) => state.borderRadius);
  const borderWidth = useWorkspaceStore((state) => state.borderWidth);
  const borderColor = useWorkspaceStore((state) => state.borderColor);
  const setSpacing = useWorkspaceStore((state) => state.setSpacing);
  const setPadding = useWorkspaceStore((state) => state.setPadding);
  const setBackgroundColor = useWorkspaceStore((state) => state.setBackgroundColor);
  const setBorderRadius = useWorkspaceStore((state) => state.setBorderRadius);
  const setBorderWidth = useWorkspaceStore((state) => state.setBorderWidth);
  const setBorderColor = useWorkspaceStore((state) => state.setBorderColor);
  const resetExportStyles = useWorkspaceStore((state) => state.resetExportStyles);

  const resolved = useMemo(
    () => resolveEffectiveTemplate(selectedTemplateId, images),
    [selectedTemplateId, images],
  );
  const { effectiveTemplate, isSmart, forcedSmart, requestedTemplate, requestedCompatibility } = resolved;
  const { placements } = useMemo(
    () => mapImagesToTemplateSlots(effectiveTemplate, images),
    [effectiveTemplate, images],
  );

  const template = effectiveTemplate;
  const slotCount = getSlotCount(template?.layout, template?.slots.length ?? 0, placements.length);
  const overflow = images.length - slotCount;
  const showCompatibilityWarning = Boolean(
    forcedSmart && requestedCompatibility && !requestedCompatibility.isCompatible,
  );
  const conditionSource =
    requestedTemplate && requestedTemplate.id !== SMART_TEMPLATE_ID
      ? requestedTemplate
      : template;
  const conditions = conditionSource?.constraints ?? [];
  const alertSignatureRef = useRef<string | null>(null);
  const [showConditions, setShowConditions] = useState(false);

  useEffect(() => {
    if (!showCompatibilityWarning) {
      alertSignatureRef.current = null;
      return;
    }

    const messages = requestedCompatibility?.messages ?? [];
    if (messages.length === 0) {
      alertSignatureRef.current = null;
      return;
    }

    const signature = `${template?.id ?? "unknown"}|${messages.join("|")}`;
    if (alertSignatureRef.current === signature) {
      return;
    }
    alertSignatureRef.current = signature;

    const templateName = template?.name ?? "-";
    const messageBody = [`已自动匹配「${templateName}」模板。`, `原因：${messages.join("；")}`]
      .filter(Boolean)
      .join("\n\n");

    showNotification({
      title: "已启用智能拼接",
      message: messageBody,
      variant: "info",
    });
  }, [requestedCompatibility, showCompatibilityWarning, template?.id, template?.name]);

  useEffect(() => {
    if (!forcedSmart) {
      return;
    }
    if (selectedTemplateId === SMART_TEMPLATE_ID) {
      return;
    }
    setTemplate(SMART_TEMPLATE_ID);
  }, [forcedSmart, selectedTemplateId, setTemplate]);

  const baseClass =
    variant === "sheet"
      ? "rounded-t-3xl border border-white/20 bg-app-panel px-4 pb-6 pt-4 shadow-2xl"
      : "h-full w-full rounded-3xl border border-app bg-app-surface px-4 py-5";

  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-white">属性</h2>
          <span className="text-[11px] text-app-muted">布局信息与状态</span>
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

      {template && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 p-3 text-white">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-black/40">
              <Image src={template.icon} alt={template.name} width={48} height={48} className="h-9 w-auto opacity-80" />
            </div>
            <div className="flex flex-col w-xs">
              <p className="text-sm font-semibold text-white">{template.name}</p>
              <p className="text-xs text-white/60">{template.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-white">
            <StatTile label="已上传" value={`${images.length} 张`} />
            <StatTile label="槽位" value={slotCount} />
            <StatTile label="推荐" value={formatRecommendation(template)} />
            {template.layout === "masonry" ? (
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                <p className="text-[11px] text-white/60">列数</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {[2, 3].map((columns) => (
                    <button
                      key={columns}
                      type="button"
                      onClick={() => setMasonryColumns(columns as 2 | 3)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition whitespace-nowrap text-center leading-tight min-w-[88px] ${
                        masonryColumns === columns
                          ? "bg-white text-black"
                          : "border border-white/20 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {columns} 列
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <StatTile label="布局" value={getLayoutLabel(template)} />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isSmart ? (
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">智能匹配</span>
            ) : null}
            {overflow > 0 ? (
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
                超出 {overflow} 张
              </span>
            ) : null}
            {showCompatibilityWarning ? (
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">需调整图片</span>
            ) : null}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-white/20 bg-white/10 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">导出设置</span>
          <button
            type="button"
            onClick={resetExportStyles}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
          >
            恢复默认
          </button>
        </div>
        <div className="mt-4 space-y-4 text-white">
          <SliderControl
            label="间距"
            value={spacing}
            min={0}
            max={80}
            onChange={setSpacing}
            suffix="px"
          />
          <SliderControl
            label="内边距"
            value={padding}
            min={0}
            max={160}
            onChange={setPadding}
            suffix="px"
          />
          <SliderControl
            label="圆角"
            value={borderRadius}
            min={0}
            max={200}
            onChange={setBorderRadius}
            suffix="px"
          />
          <SliderControl
            label="边框宽度"
            value={borderWidth}
            min={0}
            max={40}
            onChange={setBorderWidth}
            suffix="px"
          />
          <ColorControl
            label="背景色"
            value={backgroundColor}
            onChange={setBackgroundColor}
          />
          <ColorControl
            label="边框颜色"
            value={borderColor}
            onChange={setBorderColor}
            disabled={borderWidth === 0}
          />
        </div>
      </div>

      {conditions.length > 0 ? (
        <div className="mt-5 rounded-xl border border-white/20 bg-white/10">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-sm text-white"
            onClick={() => setShowConditions((value) => !value)}
          >
            <span>适用条件</span>
            <span className="text-xs text-white/60">{showConditions ? "收起" : "展开"}</span>
          </button>
          {showConditions ? (
            <ul className="space-y-1 px-3 pb-3 text-[12px] text-white/70">
              {conditions.map((constraint) => (
                <li key={constraint.message}>• {constraint.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getSlotCount(layout: TemplateDefinition["layout"] | undefined, slotCount: number, dynamicCount: number) {
  if (!layout) {
    return slotCount;
  }
  if (layout === "horizontal-strip" || layout === "vertical-strip") {
    return dynamicCount;
  }
  return slotCount;
}

function formatRecommendation(template: TemplateDefinition) {
  if (template.recommendedImages <= 0) {
    if (template.layout === "horizontal-strip") {
      return "尺寸一致";
    }
    if (template.layout === "vertical-strip") {
      return "尺寸一致";
    }
    return "自由";
  }
  return `${template.recommendedImages} 张`;
}

function getLayoutLabel(template: TemplateDefinition) {
  switch (template.layout) {
    case "horizontal-strip":
      return "横向";
    case "vertical-strip":
      return "纵向";
    case "masonry":
      return "瀑布流";
    default:
      return "固定";
  }
}

type StatTileProps = {
  label: string;
  value: string | number;
};

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
      <p className="text-[11px] text-white/60">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

function SliderControl({ label, value, min, max, step = 1, suffix = "", onChange }: SliderControlProps) {
  const handleRangeChange = (next: number) => {
    if (!Number.isFinite(next)) {
      return;
    }
    const clamped = Math.min(max, Math.max(min, next));
    onChange(clamped);
  };

  return (
    <div className="flex flex-col gap-2 text-white">
      <div className="flex items-center justify-between text-[12px] text-white/70">
        <span>{label}</span>
        <span className="font-medium text-white/90">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleRangeChange(Number(event.target.value))}
          className="h-1 flex-1 appearance-none rounded-full bg-white/10 accent-white"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => handleRangeChange(Number(event.target.value))}
          className="w-16 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white focus:border-white/35 focus:outline-none"
        />
      </div>
    </div>
  );
}

type ColorControlProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function ColorControl({ label, value, onChange, disabled = false }: ColorControlProps) {
  const handleChange = (next: string) => {
    if (!next) {
      return;
    }
    onChange(next);
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex flex-col text-[12px] text-white/70">
        <span>{label}</span>
        <span className="font-mono text-xs text-white/80">{(value || "").toUpperCase()}</span>
      </div>
      <input
        type="color"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        className="h-9 w-12 cursor-pointer rounded-md border border-white/20 bg-transparent p-0"
      />
    </div>
  );
}
