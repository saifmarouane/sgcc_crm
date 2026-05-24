import { NextResponse } from "next/server";
import { AppError } from "./app-error";

export function handleHttpError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error && error.name === "JsonWebTokenError") {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  if (error instanceof Error && error.name === "TokenExpiredError") {
    return NextResponse.json({ error: "Token expired." }, { status: 401 });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  return NextResponse.json({ error: message }, { status: 500 });
}
