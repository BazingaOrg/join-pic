"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { WorkspaceImage } from "@/types/workspace";

type UploadDropzoneProps = {
  children: ReactNode;
  isEmpty: boolean;
};

export type UploadDropzoneHandle = {
  open: () => void;
};

export const UploadDropzone = forwardRef<UploadDropzoneHandle, UploadDropzoneProps>(
  ({ children, isEmpty }, ref) => {
  const addImages = useWorkspaceStore((state) => state.addImages);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        inputRef.current?.click();
      },
    }),
    [],
  );

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    setIsProcessing(true);

    const processed: WorkspaceImage[] = [];
    for (const file of files) {
      try {
        const src = await readFileAsDataUrl(file);
        const { width, height } = await readImageSize(src);
        processed.push({
          id: crypto.randomUUID(),
          name: file.name,
          src,
          width,
          height,
        });
      } catch (error) {
        console.error("读取图片失败", error);
      }
    }

    if (processed.length) {
      addImages(processed);
    }
    setIsProcessing(false);
  };

    const baseClass = "relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl transition backdrop-blur";
    const appearance = isDragging
      ? "border border-app-strong bg-white/10"
      : isEmpty
        ? "border border-transparent bg-transparent cursor-pointer hover:border-app hover:bg-white/5"
        : "border border-app bg-app-surface";

    return (
      <div
        className={`${baseClass} ${appearance}`}
        onClick={() => {
          if (!isEmpty) {
            return;
          }
          if (isProcessing) {
            return;
          }
          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragging(false);
          await handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={async (event) => {
            if (event.target.files) {
              await handleFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs text-white">
          {isProcessing && <span>正在导入图片...</span>}
        </div>
        <div className="relative h-full w-full">{children}</div>
      </div>
    );
  },
);

UploadDropzone.displayName = "UploadDropzone";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (event) => reject(event);
    reader.readAsDataURL(file);
  });
}

function readImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = (event) => reject(event);
    image.src = src;
  });
}
