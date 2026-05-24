import type { ObjectId } from "mongodb";

export type UserRole = "admin" | "manager" | "agent";

export type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: UserRole;
  department_id: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: UserRole;
  department_id: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterUserInput = {
  name: string;
  email: string;
  phone: string;
  image?: string;
  role: UserRole;
  department_id: string;
  password: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: UserRole;
  department_id?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type JwtUserPayload = {
  sub: string;
  email: string;
  role: UserRole;
  department_id: string;
};
