import type { PublicUser, UserDocument } from "./auth.types";

export function toPublicUser(user: UserDocument): PublicUser {
  if (!user._id) {
    throw new Error("Cannot map user without _id.");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: user.image ?? "",
    role: user.role,
    department_id: user.department_id,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
