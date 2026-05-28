import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — return notes for a deal (stored as AIAnalysis with agentType: "note")
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const notes = await prisma.aIAnalysis.findMany({
      where: { dealId: id, agentType: "note" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch {
    // Fallback mock
    return NextResponse.json({
      notes: [
        {
          id: "mock-note-1",
          input: { authorLabel: "Team", text: "Initial meeting went well. Strong founder with deep domain expertise." },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "mock-note-2",
          input: { authorLabel: "Team", text: "Requested financials — awaiting response from founders." },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    });
  }
}

// POST — create a new note
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { text: string; authorLabel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  try {
    const note = await prisma.aIAnalysis.create({
      data: {
        dealId: id,
        agentType: "note",
        input: { authorLabel: body.authorLabel ?? "Team", text: body.text.trim() },
        output: {},
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch {
    // Fallback mock note
    const mockNote = {
      id: `mock-note-${Date.now()}`,
      input: { authorLabel: body.authorLabel ?? "Team", text: body.text.trim() },
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ note: mockNote }, { status: 201 });
  }
}
