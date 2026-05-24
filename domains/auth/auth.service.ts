import bcrypt from "bcryptjs";
import { AuthRepository } from "./auth.repository";
import { AppError } from "./auth.errors";
import { toPublicUser } from "./auth.mapper";
import { signAuthToken } from "./jwt";
import type {
  LoginInput,
  PublicUser,
  RegisterUserInput,
  UpdateUserInput,
  UserDocument,
  UserRole,
} from "./auth.types";

const validRoles = new Set<UserRole>(["admin", "manager", "agent"]);

type AuthResult = {
  user: PublicUser;
  token: string;
};

export class AuthService {
  constructor(private readonly repository = new AuthRepository()) {}

  async register(input: RegisterUserInput): Promise<AuthResult> {
    const data = validateRegisterInput(input);
    const existingUser = await this.repository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError("Email is already registered.", 409);
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.repository.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      image: data.image ?? "",
      role: data.role,
      department_id: data.department_id,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return this.createAuthResult(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);

    if (!email || !input.password) {
      throw new AppError("Email and password are required.", 400);
    }

    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Invalid email or password.", 401);
    }

    return this.createAuthResult(user);
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return toPublicUser(user);
  }

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.repository.findAll();
    return users.map(toPublicUser);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const updates = validateUpdateUserInput(input);

    if (!Object.keys(updates).length) {
      throw new AppError("At least one field is required.", 400);
    }

    if (updates.email) {
      const existingUser = await this.repository.findByEmail(updates.email);

      if (existingUser && existingUser._id?.toString() !== id) {
        throw new AppError("Email is already registered.", 409);
      }
    }

    const user = await this.repository.updateById(id, updates);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return toPublicUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);

    if (!deleted) {
      throw new AppError("User not found.", 404);
    }
  }

  private createAuthResult(user: UserDocument): AuthResult {
    const publicUser = toPublicUser(user);
    const token = signAuthToken({
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
      department_id: publicUser.department_id,
    });

    return { user: publicUser, token };
  }
}

function validateRegisterInput(input: RegisterUserInput): RegisterUserInput {
  const name = input.name?.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim();
  const image = input.image?.trim() ?? "";
  const departmentId = input.department_id?.trim();
  const password = input.password;
  const role = input.role;

  if (!name || !email || !phone || !departmentId || !password || !role) {
    throw new AppError(
      "Name, email, phone, role, department_id, and password are required.",
      400,
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Email is invalid.", 400);
  }

  if (!validRoles.has(role)) {
    throw new AppError("Role must be one of: admin, manager, agent.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must contain at least 8 characters.", 400);
  }

  return {
    name,
    email,
    phone,
    image,
    role,
    department_id: departmentId,
    password,
  };
}

function validateUpdateUserInput(input: UpdateUserInput): UpdateUserInput {
  const updates: UpdateUserInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new AppError("Name cannot be empty.", 400);
    }

    updates.name = name;
  }

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Email is invalid.", 400);
    }

    updates.email = email;
  }

  if (input.phone !== undefined) {
    const phone = input.phone.trim();

    if (!phone) {
      throw new AppError("Phone cannot be empty.", 400);
    }

    updates.phone = phone;
  }

  if (input.image !== undefined) {
    updates.image = input.image.trim();
  }

  if (input.role !== undefined) {
    if (!validRoles.has(input.role)) {
      throw new AppError("Role must be one of: admin, manager, agent.", 400);
    }

    updates.role = input.role;
  }

  if (input.department_id !== undefined) {
    const departmentId = input.department_id.trim();

    if (!departmentId) {
      throw new AppError("department_id cannot be empty.", 400);
    }

    updates.department_id = departmentId;
  }

  return updates;
}

function normalizeEmail(email: string): string {
  return email?.trim().toLowerCase();
}
