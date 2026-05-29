import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/domains/shared/auth";
import { handleHttpError } from "@/domains/shared/http";
import { AppError } from "@/domains/shared/app-error";

export const runtime = "nodejs";

const allowedTypes = new Set(["profile", "document"]);
const maxUploadSizeBytes = 4 * 1024 * 1024;

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

    if (file.size > maxUploadSizeBytes) {
      throw new AppError("File size must be lower than 4MB.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = getSafeExtension(file.name);
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    const absolutePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/${type}/${filename}`;

    const url = await saveUploadOrFallback({
      absolutePath,
      buffer,
      file,
      uploadDir,
      publicUrl,
    });

    return NextResponse.json({
      file: {
        url,
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

async function saveUploadOrFallback({
  absolutePath,
  buffer,
  file,
  uploadDir,
  publicUrl,
}: {
  absolutePath: string;
  buffer: Buffer;
  file: File;
  uploadDir: string;
  publicUrl: string;
}) {
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(absolutePath, buffer);
    return publicUrl;
  } catch (error) {
    if (isReadOnlyFilesystemError(error)) {
      const mimeType = file.type || "application/octet-stream";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    throw error;
  }
}

function isReadOnlyFilesystemError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "EROFS"
  );
}
