import {
  SMART_TEMPLATE_ID,
  TEMPLATES,
  type TemplateConstraint,
  type TemplateDefinition,
} from "./templates";
import type { WorkspaceImage } from "@/types/workspace";

export type TemplateCompatibility = {
  isCompatible: boolean;
  messages: string[];
};

export type ResolvedTemplate = {
  effectiveTemplate: TemplateDefinition;
  isSmart: boolean;
  matchedTemplate: TemplateDefinition | null;
  requestedTemplate?: TemplateDefinition;
  requestedCompatibility?: TemplateCompatibility;
  forcedSmart?: boolean;
};

export type SlotPlacement = {
  slot: TemplateDefinition["slots"][number];
  image?: WorkspaceImage;
};

export type PlacementResult = {
  placements: SlotPlacement[];
  unusedImages: WorkspaceImage[];
};

const STATIC_TEMPLATES = TEMPLATES.filter((template) => !template.dynamic);
const FALLBACK_TEMPLATE = STATIC_TEMPLATES.find((template) => template.layout !== "horizontal-strip" && template.layout !== "vertical-strip") ?? STATIC_TEMPLATES[0];

export function resolveEffectiveTemplate(
  selectedTemplateId: string,
  images: WorkspaceImage[],
): ResolvedTemplate {
  if (selectedTemplateId !== SMART_TEMPLATE_ID) {
    const template = STATIC_TEMPLATES.find((item) => item.id === selectedTemplateId) ?? FALLBACK_TEMPLATE;
    const compatibility = getTemplateCompatibility(template, images);

    if (compatibility.isCompatible || images.length === 0) {
      return {
        effectiveTemplate: template,
        isSmart: false,
        matchedTemplate: null,
        requestedTemplate: template,
        requestedCompatibility: compatibility,
      };
    }

    const fallback = chooseBestTemplate(images) ?? FALLBACK_TEMPLATE;
    return {
      effectiveTemplate: fallback,
      isSmart: true,
      matchedTemplate: fallback,
      requestedTemplate: template,
      requestedCompatibility: compatibility,
      forcedSmart: true,
    };
  }

  const bestTemplate = chooseBestTemplate(images) ?? FALLBACK_TEMPLATE;
  return {
    effectiveTemplate: bestTemplate,
    isSmart: true,
    matchedTemplate: bestTemplate,
    requestedTemplate: TEMPLATES.find((item) => item.id === SMART_TEMPLATE_ID),
    requestedCompatibility: getTemplateCompatibility(bestTemplate, images),
  };
}

export function mapImagesToTemplateSlots(
  template: TemplateDefinition,
  images: WorkspaceImage[],
): PlacementResult {
  if (images.length === 0) {
    return {
      placements: [],
      unusedImages: [],
    };
  }

  if (template.layout === "horizontal-strip" || template.layout === "vertical-strip") {
    const placements: SlotPlacement[] = images.map((image, index) => ({
      slot: {
        id: `${template.id}-${index}`,
        aspectRatio: getImageAspectRatio(image),
      },
      image,
    }));

    return {
      placements,
      unusedImages: [],
    };
  }

  if (template.slots.length === 0) {
    return {
      placements: [],
      unusedImages: images,
    };
  }

  const slotsWithIndex = template.slots.map((slot, index) => ({ slot, index }));
  const sortedSlots = [...slotsWithIndex].sort(
    (a, b) => a.slot.aspectRatio - b.slot.aspectRatio,
  );
  const sortedImages = [...images].sort(
    (a, b) => getImageAspectRatio(a) - getImageAspectRatio(b),
  );

  const placements: SlotPlacement[] = template.slots.map((slot) => ({ slot }));
  sortedSlots.forEach((entry, idx) => {
    const candidate = sortedImages[idx];
    if (candidate) {
      placements[entry.index] = { slot: entry.slot, image: candidate };
    }
  });

  const unusedImages = sortedImages.slice(template.slots.length);

  return { placements, unusedImages };
}

export function chooseBestTemplate(images: WorkspaceImage[]): TemplateDefinition | undefined {
  if (STATIC_TEMPLATES.length === 0) {
    return undefined;
  }
  if (images.length === 0) {
    return STATIC_TEMPLATES[0];
  }

  let bestTemplate = FALLBACK_TEMPLATE;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const template of STATIC_TEMPLATES) {
    const compatibility = getTemplateCompatibility(template, images);
    if (!compatibility.isCompatible) {
      continue;
    }
    const score = scoreTemplate(template, images);
    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

export function getTemplateCompatibility(
  template: TemplateDefinition,
  images: WorkspaceImage[],
): TemplateCompatibility {
  if (!template.constraints || template.constraints.length === 0) {
    return { isCompatible: true, messages: [] };
  }
  if (images.length === 0) {
    return { isCompatible: true, messages: [] };
  }

  const failedMessages: string[] = [];

  for (const constraint of template.constraints) {
    if (!checkConstraint(constraint, images)) {
      failedMessages.push(constraint.message);
    }
  }

  return {
    isCompatible: failedMessages.length === 0,
    messages: failedMessages,
  };
}

function scoreTemplate(template: TemplateDefinition, images: WorkspaceImage[]): number {
  if (template.slots.length === 0) {
    if (template.layout === "horizontal-strip" || template.layout === "vertical-strip") {
      return scoreStripTemplate(template, images);
    }
    return Number.NEGATIVE_INFINITY;
  }

  const slotRatios = template.slots.map((slot) => slot.aspectRatio).sort((a, b) => a - b);
  const imageRatios = images.map(getImageAspectRatio).sort((a, b) => a - b);
  const pairCount = Math.min(slotRatios.length, imageRatios.length);

  let ratioScore = 0;
  for (let i = 0; i < pairCount; i += 1) {
    const slotRatio = slotRatios[i];
    const imageRatio = imageRatios[i];
    const diff = Math.abs(Math.log(slotRatio / imageRatio));
    const normalized = clamp(1 - Math.min(diff, 1), 0, 1);
    ratioScore += normalized;
  }
  ratioScore = pairCount > 0 ? ratioScore / pairCount : 0;

  const fillScore = pairCount / template.slots.length;
  const overflowPenalty = Math.max(0, imageRatios.length - template.slots.length) * 0.2;
  const underfillPenalty = Math.max(0, template.slots.length - imageRatios.length) * 0.1;

  let stageScore = 0;
  if (imageRatios.length > 0) {
    const avgImageRatio = imageRatios.reduce((acc, value) => acc + value, 0) / imageRatios.length;
    const stageDiff = Math.abs(Math.log(template.stageAspectRatio / avgImageRatio));
    stageScore = clamp(1 - Math.min(stageDiff, 1), 0, 1);
  }

  return ratioScore * 5 + fillScore * 3 + stageScore * 2 - overflowPenalty - underfillPenalty;
}

function getImageAspectRatio(image: WorkspaceImage) {
  if (!image.height) {
    return 1;
  }
  return image.width / image.height;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function checkConstraint(constraint: TemplateConstraint, images: WorkspaceImage[]): boolean {
  switch (constraint.type) {
    case "uniform-dimensions": {
      if (images.length <= 1) {
        return true;
      }
      const tolerance = constraint.tolerance ?? 0.01;
      const base = images[0];
      return images.every((image) => {
        const widthDiff = Math.abs(image.width - base.width) / Math.max(base.width, 1);
        const heightDiff = Math.abs(image.height - base.height) / Math.max(base.height, 1);
        return widthDiff <= tolerance && heightDiff <= tolerance;
      });
    }
    case "orientation": {
      if (images.length === 0) {
        return false;
      }
      if (constraint.orientation === "landscape") {
        return images.every((image) => image.width >= image.height);
      }
      return images.every((image) => image.height >= image.width);
    }
    case "min-count": {
      return images.length >= constraint.value;
    }
    default:
      return true;
  }
}

function scoreStripTemplate(template: TemplateDefinition, images: WorkspaceImage[]): number {
  if (images.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const totalLength = images.reduce((acc, image) => {
    const ratio = getImageAspectRatio(image);
    return acc + (template.layout === "horizontal-strip" ? ratio : 1 / ratio);
  }, 0);

  const diversityPenalty = images.length > 1 ? 0 : 0.5;

  return totalLength - diversityPenalty;
}
