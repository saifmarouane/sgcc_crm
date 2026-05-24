import type { ObjectId } from "mongodb";

export type NotificationDocument = {
  _id?: ObjectId;
  user_id: string;
  notification: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicNotification = {
  id: string;
  user_id: string;
  notification: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationInput = {
  user_id: string;
  notification: string;
};

export type UpdateNotificationInput = {
  notification: string;
};
