import type {
  NotificationDocument,
  PublicNotification,
} from "./notification.types";

export function toPublicNotification(
  notification: NotificationDocument,
): PublicNotification {
  if (!notification._id) {
    throw new Error("Cannot map notification without _id.");
  }

  return {
    id: notification._id.toString(),
    user_id: notification.user_id,
    notification: notification.notification,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
}
