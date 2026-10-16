import type { TaskType } from "@/types";
import type { PromptStrategy } from "./types";
import { codingStrategy } from "./coding";
import { writingStrategy } from "./writing";
import { analysisStrategy } from "./analysis";
import { learningStrategy } from "./learning";
import { automationStrategy } from "./automation";
import { imageStrategy } from "./image";
import { businessStrategy } from "./business";
import { genericStrategy } from "./generic";

const strategyRegistry: Record<TaskType, PromptStrategy> = {
  auto: genericStrategy,
  coding: codingStrategy,
  writing: writingStrategy,
  analysis: analysisStrategy,
  learning: learningStrategy,
  automation: automationStrategy,
  image: imageStrategy,
  business: businessStrategy,
  other: genericStrategy,
};

export function getStrategy(taskType: TaskType): PromptStrategy {
  return strategyRegistry[taskType] || genericStrategy;
}

export {
  codingStrategy,
  writingStrategy,
  analysisStrategy,
  learningStrategy,
  automationStrategy,
  imageStrategy,
  businessStrategy,
  genericStrategy,
};
