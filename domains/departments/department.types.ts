import type { ObjectId } from "mongodb";

export type DepartmentDocument = {
  _id?: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicDepartment = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDepartmentInput = {
  name: string;
};

export type UpdateDepartmentInput = {
  name: string;
};
