-- CreateEnum
CREATE TYPE "AiAgentType" AS ENUM ('EVENT_DRAFT', 'PRICING', 'MARKETING', 'AUDIENCE', 'OPERATIONS', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AiAgentRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_FOR_TOOL', 'WAITING_FOR_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiAgentTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AiAgentToolCallStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiArtifactType" AS ENUM ('EVENT_BRIEF', 'EVENT_COPY', 'MARKETING_CAPTION', 'PRICING_PLAN', 'AUDIENCE_FORECAST', 'VENUE_SUGGESTION', 'RISK_REVIEW');

-- CreateEnum
CREATE TYPE "AiHumanReviewStatus" AS ENUM ('NOT_REQUIRED', 'REQUIRED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "AiEventDraft" ADD COLUMN     "agentId" INTEGER,
ADD COLUMN     "audienceEstimate" JSONB,
ADD COLUMN     "humanReviewStatus" "AiHumanReviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "lastAgentRunId" INTEGER,
ADD COLUMN     "marketingCaptions" JSONB,
ADD COLUMN     "pricingEstimate" JSONB,
ADD COLUMN     "promptHash" TEXT,
ADD COLUMN     "safetyNotes" TEXT,
ADD COLUMN     "suggestions" JSONB;

-- AlterTable
ALTER TABLE "ResaleListing" ADD COLUMN     "activeListingKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "supabaseUserId" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "SmallEventTicketClaim" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "ticketId" INTEGER,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmallEventTicketClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AiAgentType" NOT NULL,
    "description" TEXT,
    "defaultModel" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "toolManifest" JSONB,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentRun" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventDraftId" INTEGER,
    "eventId" INTEGER,
    "status" "AiAgentRunStatus" NOT NULL DEFAULT 'QUEUED',
    "traceId" TEXT,
    "idempotencyKey" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "modelUsed" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costUsd" DECIMAL(10,4),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentTask" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AiAgentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentToolCall" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "toolName" TEXT NOT NULL,
    "status" "AiAgentToolCallStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "latencyMs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAgentToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgentArtifact" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "eventDraftId" INTEGER,
    "eventId" INTEGER,
    "type" "AiArtifactType" NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAgentArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmallEventTicketClaim_ticketId_key" ON "SmallEventTicketClaim"("ticketId");

-- CreateIndex
CREATE INDEX "SmallEventTicketClaim_eventId_claimedAt_idx" ON "SmallEventTicketClaim"("eventId", "claimedAt");

-- CreateIndex
CREATE INDEX "SmallEventTicketClaim_userId_claimedAt_idx" ON "SmallEventTicketClaim"("userId", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmallEventTicketClaim_eventId_userId_key" ON "SmallEventTicketClaim"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_slug_key" ON "AiAgent"("slug");

-- CreateIndex
CREATE INDEX "AiAgent_type_isActive_idx" ON "AiAgent"("type", "isActive");

-- CreateIndex
CREATE INDEX "AiAgent_createdById_idx" ON "AiAgent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgentRun_traceId_key" ON "AiAgentRun"("traceId");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgentRun_idempotencyKey_key" ON "AiAgentRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiAgentRun_agentId_status_createdAt_idx" ON "AiAgentRun"("agentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentRun_userId_status_createdAt_idx" ON "AiAgentRun"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentRun_eventDraftId_createdAt_idx" ON "AiAgentRun"("eventDraftId", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentRun_eventId_createdAt_idx" ON "AiAgentRun"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentRun_status_createdAt_idx" ON "AiAgentRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentTask_runId_sortOrder_idx" ON "AiAgentTask"("runId", "sortOrder");

-- CreateIndex
CREATE INDEX "AiAgentTask_status_createdAt_idx" ON "AiAgentTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentToolCall_runId_createdAt_idx" ON "AiAgentToolCall"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentToolCall_taskId_createdAt_idx" ON "AiAgentToolCall"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentToolCall_toolName_status_createdAt_idx" ON "AiAgentToolCall"("toolName", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentArtifact_runId_type_idx" ON "AiAgentArtifact"("runId", "type");

-- CreateIndex
CREATE INDEX "AiAgentArtifact_eventDraftId_type_createdAt_idx" ON "AiAgentArtifact"("eventDraftId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AiAgentArtifact_eventId_type_createdAt_idx" ON "AiAgentArtifact"("eventId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiEventDraft_lastAgentRunId_key" ON "AiEventDraft"("lastAgentRunId");

-- CreateIndex
CREATE INDEX "AiEventDraft_agentId_status_idx" ON "AiEventDraft"("agentId", "status");

-- CreateIndex
CREATE INDEX "AiEventDraft_promptHash_idx" ON "AiEventDraft"("promptHash");

-- CreateIndex
CREATE INDEX "Event_createdById_status_idx" ON "Event"("createdById", "status");

-- CreateIndex
CREATE INDEX "Event_aiGenerated_status_createdAt_idx" ON "Event"("aiGenerated", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResaleListing_activeListingKey_key" ON "ResaleListing"("activeListingKey");

-- CreateIndex
CREATE INDEX "ResaleListing_activeListingKey_idx" ON "ResaleListing"("activeListingKey");

-- CreateIndex
CREATE INDEX "Ticket_eventId_currentOwnerId_status_idx" ON "Ticket"("eventId", "currentOwnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_supabaseUserId_idx" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- AddForeignKey
ALTER TABLE "SmallEventTicketClaim" ADD CONSTRAINT "SmallEventTicketClaim_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallEventTicketClaim" ADD CONSTRAINT "SmallEventTicketClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallEventTicketClaim" ADD CONSTRAINT "SmallEventTicketClaim_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallEventTicketClaim" ADD CONSTRAINT "SmallEventTicketClaim_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEventDraft" ADD CONSTRAINT "AiEventDraft_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEventDraft" ADD CONSTRAINT "AiEventDraft_lastAgentRunId_fkey" FOREIGN KEY ("lastAgentRunId") REFERENCES "AiAgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentRun" ADD CONSTRAINT "AiAgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentRun" ADD CONSTRAINT "AiAgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentRun" ADD CONSTRAINT "AiAgentRun_eventDraftId_fkey" FOREIGN KEY ("eventDraftId") REFERENCES "AiEventDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentRun" ADD CONSTRAINT "AiAgentRun_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentTask" ADD CONSTRAINT "AiAgentTask_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiAgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentToolCall" ADD CONSTRAINT "AiAgentToolCall_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiAgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentToolCall" ADD CONSTRAINT "AiAgentToolCall_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiAgentTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentArtifact" ADD CONSTRAINT "AiAgentArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiAgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentArtifact" ADD CONSTRAINT "AiAgentArtifact_eventDraftId_fkey" FOREIGN KEY ("eventDraftId") REFERENCES "AiEventDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentArtifact" ADD CONSTRAINT "AiAgentArtifact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
