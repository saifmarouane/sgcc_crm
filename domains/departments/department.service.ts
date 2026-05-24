import { AppError } from "@/domains/shared/app-error";
import { toPublicDepartment } from "./department.mapper";
import { DepartmentRepository } from "./department.repository";
import type {
  CreateDepartmentInput,
  PublicDepartment,
  UpdateDepartmentInput,
} from "./department.types";

export class DepartmentService {
  constructor(private readonly repository = new DepartmentRepository()) {}

  async create(input: CreateDepartmentInput): Promise<PublicDepartment> {
    const name = validateDepartmentName(input.name);
    const existingDepartment = await this.repository.findByName(name);

    if (existingDepartment) {
      throw new AppError("Department already exists.", 409);
    }

    const now = new Date();
    const department = await this.repository.create({
      name,
      createdAt: now,
      updatedAt: now,
    });

    return toPublicDepartment(department);
  }

  async list(): Promise<PublicDepartment[]> {
    const departments = await this.repository.findAll();
    return departments.map(toPublicDepartment);
  }

  async getById(id: string): Promise<PublicDepartment> {
    const department = await this.repository.findById(id);

    if (!department) {
      throw new AppError("Department not found.", 404);
    }

    return toPublicDepartment(department);
  }

  async update(
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<PublicDepartment> {
    const name = validateDepartmentName(input.name);
    const existingDepartment = await this.repository.findByName(name);

    if (existingDepartment && existingDepartment._id?.toString() !== id) {
      throw new AppError("Department already exists.", 409);
    }

    const department = await this.repository.updateById(id, { name });

    if (!department) {
      throw new AppError("Department not found.", 404);
    }

    return toPublicDepartment(department);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);

    if (!deleted) {
      throw new AppError("Department not found.", 404);
    }
  }
}

function validateDepartmentName(name: string): string {
  const value = name?.trim();

  if (!value) {
    throw new AppError("name is required.", 400);
  }

  return value;
}
