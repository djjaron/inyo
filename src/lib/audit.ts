import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction = "create" | "update" | "delete" | "restore" | "approve" | "reject";

interface AuditParams {
  familyId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  resourceName?: string | null;
  diff?: { before?: unknown; after?: unknown } | null;
  performedBy?: string | null;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        familyId: params.familyId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName ?? null,
        diff: params.diff ? (params.diff as Prisma.InputJsonValue) : Prisma.JsonNull,
        performedBy: params.performedBy ?? "system",
      },
    });
  } catch {
    // Audit log failure must never block the primary operation
  }
}
