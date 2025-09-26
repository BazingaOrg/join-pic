"use client";

import { useState } from "react";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import { TemplatePanel } from "@/components/layout/TemplatePanel";
import { TopBar } from "@/components/layout/TopBar";
import { CanvasStage } from "@/components/workspace/CanvasStage";
import { ImageRail } from "@/components/workspace/ImageRail";

export default function Home() {
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [propertiesSheetOpen, setPropertiesSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <TopBar
        onOpenTemplates={() => setTemplateSheetOpen(true)}
        onOpenProperties={() => setPropertiesSheetOpen(true)}
      />
      <div className="mx-auto flex max-w-7xl flex-1 flex-col gap-0 px-4 pb-8 pt-4 lg:px-6">
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="hidden lg:col-span-3 lg:block">
            <TemplatePanel className="h-full rounded-3xl" />
          </div>
          <main className="flex flex-col gap-4 lg:col-span-6">
            <CanvasStage />
            <ImageRail />
          </main>
          <div className="hidden lg:col-span-3 lg:block">
            <PropertiesPanel className="h-full rounded-3xl" />
          </div>
        </div>
      </div>

      {templateSheetOpen ? (
        <div className="lg:hidden">
          <Sheet onClose={() => setTemplateSheetOpen(false)}>
            <TemplatePanel variant="sheet" onClose={() => setTemplateSheetOpen(false)} />
          </Sheet>
        </div>
      ) : null}

      {propertiesSheetOpen ? (
        <div className="lg:hidden">
          <Sheet onClose={() => setPropertiesSheetOpen(false)}>
            <PropertiesPanel variant="sheet" onClose={() => setPropertiesSheetOpen(false)} />
          </Sheet>
        </div>
      ) : null}
    </div>
  );
}

type SheetProps = {
  children: React.ReactNode;
  onClose: () => void;
};

function Sheet({ children, onClose }: SheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative flex-1">
        <button
          type="button"
          className="absolute inset-0 h-full w-full"
          onClick={onClose}
          aria-label="关闭抽屉"
        />
      </div>
      <div className="relative max-h-[85vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
