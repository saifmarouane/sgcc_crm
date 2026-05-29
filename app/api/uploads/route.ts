import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { AppError } from "@/domains/shared/app-error";

export const runtime = "nodejs";

const allowedTypes = new Set(["profile", "document"]);

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") ?? "");

    if (!(file instanceof File)) {
      throw new AppError("file is required.", 400);
    }

    if (!allowedTypes.has(type)) {
      throw new AppError("type must be profile or document.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = getSafeExtension(file.name);
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    const absolutePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      file: {
        url: `/uploads/${type}/${filename}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    return handleHttpError(error);
  }
}

function getSafeExtension(filename: string): string {
  const extension = path.extname(filename).toLowerCase();

  if (!extension || extension.length > 12) {
    return "";
  }

  return extension.replace(/[^a-z0-9.]/g, "");
}
