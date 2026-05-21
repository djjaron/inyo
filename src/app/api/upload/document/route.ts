import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

function isAllowedFile(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".txt") || lower.endsWith(".md");
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const familyId = formData.get("familyId") as string | null;
  const dealId = formData.get("dealId") as string | null | undefined;
  const companyId = formData.get("companyId") as string | null | undefined;
  const nameOverride = formData.get("name") as string | null | undefined;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  // Check file size before reading bytes
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 413 });
  }

  // Validate file type
  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: "Unsupported file type. Accepted: PDF, TXT, MD." },
      { status: 415 }
    );
  }

  // Read bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract text
  let textContent = "";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    textContent = parsed.text;
  } else {
    // .txt, .md, plain text
    textContent = buffer.toString("utf-8");
  }

  const docName = nameOverride ?? file.name;

  // Persist to DB (best-effort)
  let document: Record<string, unknown>;
  try {
    document = await prisma.document.create({
      data: {
        familyId,
        dealId: dealId ?? null,
        companyId: companyId ?? null,
        name: docName,
        type: "other",
        textContent,
        mimeType: file.type,
      },
    });
  } catch {
    document = {
      id: `doc_mock_${Date.now()}`,
      familyId,
      name: docName,
      type: "other",
      textContent,
      mimeType: file.type,
      _mock: true,
    };
  }

  return NextResponse.json({
    document: {
      id: document.id,
      name: document.name,
      textContent: document.textContent,
      mimeType: document.mimeType,
    },
    extracted: textContent.length > 0,
  });
}
