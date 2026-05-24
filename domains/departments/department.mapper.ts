import type {
  DepartmentDocument,
  PublicDepartment,
} from "./department.types";

export function toPublicDepartment(
  department: DepartmentDocument,
): PublicDepartment {
  if (!department._id) {
    throw new Error("Cannot map department without _id.");
  }

  return {
    id: department._id.toString(),
    name: department.name,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}
