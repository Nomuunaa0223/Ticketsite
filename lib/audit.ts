import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorUserId?: number | null;
  actorType?: "USER" | "SYSTEM";
  action: string;
  entityType: string;
  entityId: number;
  description?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? "USER",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata
      }
    });
  } catch (error) {
    console.error("Failed to create audit log", error);
  }
}
