import type { ObjectId } from "mongodb";

export type ScoreDocument = {
  _id?: ObjectId;
  user_id: string;
  score: number;
  scoreUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicScore = {
  id: string;
  user_id: string;
  score: number;
  scoreUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateScoreInput = {
  user_id: string;
  score: number;
};

export type UpdateScoreInput = {
  score: number;
};
