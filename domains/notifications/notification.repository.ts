import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { NotificationDocument } from "./notification.types";

const NOTIFICATIONS_COLLECTION = "notifications";

async function notificationsCollection(): Promise<Collection<NotificationDocument>> {
  const db = await getDb();
  const collection = db.collection<NotificationDocument>(NOTIFICATIONS_COLLECTION);
  await collection.createIndex({ user_id: 1 });
  return collection;
}

export class NotificationRepository {
  async create(notification: NotificationDocument): Promise<NotificationDocument> {
    const collection = await notificationsCollection();
    const result = await collection.insertOne(notification);
    return { ...notification, _id: result.insertedId };
  }

  async findAll(): Promise<NotificationDocument[]> {
    const collection = await notificationsCollection();
    return collection.find().sort({ createdAt: -1 }).toArray();
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await notificationsCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async updateMessage(
    id: string,
    notification: string,
  ): Promise<NotificationDocument | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await notificationsCollection();
    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          notification,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await notificationsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
