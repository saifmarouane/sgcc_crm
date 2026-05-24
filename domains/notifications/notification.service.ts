import { AppError } from "@/domains/shared/app-error";
import { toPublicNotification } from "./notification.mapper";
import { NotificationRepository } from "./notification.repository";
import type {
  CreateNotificationInput,
  PublicNotification,
  UpdateNotificationInput,
} from "./notification.types";

export class NotificationService {
  constructor(private readonly repository = new NotificationRepository()) {}

  async create(input: CreateNotificationInput): Promise<PublicNotification> {
    const data = validateCreateNotification(input);
    const now = new Date();

    const notification = await this.repository.create({
      user_id: data.user_id,
      notification: data.notification,
      createdAt: now,
      updatedAt: now,
    });

    return toPublicNotification(notification);
  }

  async list(): Promise<PublicNotification[]> {
    const notifications = await this.repository.findAll();
    return notifications.map(toPublicNotification);
  }

  async getById(id: string): Promise<PublicNotification> {
    const notification = await this.repository.findById(id);

    if (!notification) {
      throw new AppError("Notification not found.", 404);
    }

    return toPublicNotification(notification);
  }

  async update(
    id: string,
    input: UpdateNotificationInput,
  ): Promise<PublicNotification> {
    const message = validateNotificationMessage(input.notification);
    const notification = await this.repository.updateMessage(id, message);

    if (!notification) {
      throw new AppError("Notification not found.", 404);
    }

    return toPublicNotification(notification);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Notification not found.", 404);
    }
  }
}

function validateCreateNotification(
  input: CreateNotificationInput,
): CreateNotificationInput {
  const userId = input.user_id?.trim();
  const notification = validateNotificationMessage(input.notification);

  if (!userId) {
    throw new AppError("user_id is required.", 400);
  }

  return { user_id: userId, notification };
}

function validateNotificationMessage(notification: string): string {
  const value = notification?.trim();

  if (!value) {
    throw new AppError("notification is required.", 400);
  }

  return value;
}
