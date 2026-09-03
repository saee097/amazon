import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonData<T>(data: T, extra: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ success: true, data, ...extra }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function jsonRaw<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}
