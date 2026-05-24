import type { PublicScore, ScoreDocument } from "./score.types";

export function toPublicScore(score: ScoreDocument): PublicScore {
  if (!score._id) {
    throw new Error("Cannot map score without _id.");
  }

  return {
    id: score._id.toString(),
    user_id: score.user_id,
    score: score.score,
    scoreUpdatedAt: score.scoreUpdatedAt.toISOString(),
    createdAt: score.createdAt.toISOString(),
    updatedAt: score.updatedAt.toISOString(),
  };
}
