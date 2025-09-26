export type TemplateSlot = {
  id: string;
  /** Aspect ratio expressed as width / height */
  aspectRatio: number;
  colSpan?: number;
  rowSpan?: number;
};

export type TemplateLayout =
  | "smart"
  | "horizontal-strip"
  | "vertical-strip"
  | "masonry";

export type TemplateConstraint =
  | {
      type: "uniform-dimensions";
      /** Acceptable relative difference between width/height (default 1%) */
      tolerance?: number;
      message: string;
    }
  | {
      type: "orientation";
      orientation: "landscape" | "portrait";
      message: string;
    }
  | {
      type: "min-count";
      value: number;
      message: string;
    };

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  recommendedImages: number;
  stageAspectRatio: number;
  slots: TemplateSlot[];
  layout: TemplateLayout;
  constraints?: TemplateConstraint[];
  icon: string;
  dynamic?: boolean;
};

export const SMART_TEMPLATE_ID = "smart-auto";

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: SMART_TEMPLATE_ID,
    name: "智能拼接",
    description: "自动匹配最合适的布局",
    recommendedImages: 0,
    stageAspectRatio: 1,
    slots: [],
    layout: "smart",
    icon: "/icons/templates/smart.svg",
    dynamic: true,
  },
  {
    id: "masonry-wide",
    name: "瀑布流",
    description: "三列自适应高度",
    recommendedImages: 6,
    stageAspectRatio: 4 / 5,
    slots: [
      { id: "a", aspectRatio: 4 / 5, rowSpan: 2 },
      { id: "b", aspectRatio: 3 / 4 },
      { id: "c", aspectRatio: 1 },
      { id: "d", aspectRatio: 3 / 2, rowSpan: 2 },
      { id: "e", aspectRatio: 4 / 3 },
      { id: "f", aspectRatio: 9 / 16, rowSpan: 2 },
    ],
    layout: "masonry",
    icon: "/icons/templates/masonry.svg",
  },
  {
    id: "horizontal-strip",
    name: "横向拼接",
    description: "全宽横向拼接",
    recommendedImages: 0,
    stageAspectRatio: 16 / 9,
    slots: [],
    layout: "horizontal-strip",
    constraints: [
      {
        type: "min-count",
        value: 2,
        message: "横向拼接至少需要 2 张图片。",
      },
      {
        type: "orientation",
        orientation: "landscape",
        message: "横向拼接仅适用于长边在水平方向的图片。",
      },
      {
        type: "uniform-dimensions",
        tolerance: 0.01,
        message: "所有图片的尺寸必须完全一致才能使用横向拼接。",
      },
    ],
    icon: "/icons/templates/horizontal-strip.svg",
  },
  {
    id: "vertical-strip",
    name: "纵向拼接",
    description: "全高竖向拼接",
    recommendedImages: 0,
    stageAspectRatio: 9 / 16,
    slots: [],
    layout: "vertical-strip",
    constraints: [
      {
        type: "min-count",
        value: 2,
        message: "纵向拼接至少需要 2 张图片。",
      },
      {
        type: "orientation",
        orientation: "portrait",
        message: "纵向拼接仅适用于长边在竖直方向的图片。",
      },
      {
        type: "uniform-dimensions",
        tolerance: 0.01,
        message: "所有图片的尺寸必须完全一致才能使用纵向拼接。",
      },
    ],
    icon: "/icons/templates/vertical-strip.svg",
  },
];
