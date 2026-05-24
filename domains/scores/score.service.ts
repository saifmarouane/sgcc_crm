import { AppError } from "@/domains/shared/app-error";
import { toPublicScore } from "./score.mapper";
import { ScoreRepository } from "./score.repository";
import type {
  CreateScoreInput,
  PublicScore,
  UpdateScoreInput,
} from "./score.types";

export class ScoreService {
  constructor(private readonly repository = new ScoreRepository()) {}

  async create(input: CreateScoreInput): Promise<PublicScore> {
    const data = validateCreateScore(input);
    const now = new Date();

    const score = await this.repository.create({
      user_id: data.user_id,
      score: data.score,
      scoreUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return toPublicScore(score);
  }

  async list(): Promise<PublicScore[]> {
    const scores = await this.repository.findAll();
    return scores.map(toPublicScore);
  }

  async getById(id: string): Promise<PublicScore> {
    const score = await this.repository.findById(id);

    if (!score) {
      throw new AppError("Score not found.", 404);
    }

    return toPublicScore(score);
  }

  async update(id: string, input: UpdateScoreInput): Promise<PublicScore> {
    const scoreValue = validateScoreValue(input.score);
    const score = await this.repository.updateScore(id, scoreValue);

    if (!score) {
      throw new AppError("Score not found.", 404);
    }

    return toPublicScore(score);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Score not found.", 404);
    }
  }
}

function validateCreateScore(input: CreateScoreInput): CreateScoreInput {
  const userId = input.user_id?.trim();
  const score = validateScoreValue(input.score);

  if (!userId) {
    throw new AppError("user_id is required.", 400);
  }

  return { user_id: userId, score };
}

function validateScoreValue(score: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new AppError("score must be a number.", 400);
  }

  return score;
}
