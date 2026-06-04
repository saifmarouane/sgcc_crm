import type { ObjectId } from "mongodb";

export type NotificationDocument = {
  _id?: ObjectId;
  user_id: string;
  notification: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicNotification = {
  id: string;
  user_id: string;
  notification: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationInput = {
  user_id: string;
  notification: string;
};

export type UpdateNotificationInput = {
  notification?: string;
  read?: boolean;
};
