-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'ANALYST');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('WITH_AGENT', 'WAITING_ANALYST', 'WITH_ANALYST', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransferReasonCode" AS ENUM ('USER_REQUEST', 'CRITICAL', 'OVERDUE', 'LOW_CONFIDENCE');

-- CreateEnum
CREATE TYPE "AuthorType" AS ENUM ('EMPLOYEE', 'AGENT', 'ANALYST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('INC', 'REQ');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ACESSO', 'REDE_VPN', 'HARDWARE', 'SOFTWARE', 'EMAIL', 'OUTROS');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'WAITING_ANALYST', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'APPROVED');

-- CreateEnum
CREATE TYPE "PendingOperation" AS ENUM ('CREATE', 'UPDATE', 'REOPEN');

-- CreateEnum
CREATE TYPE "PresentedAssurance" AS ENUM ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketEventKind" AS ENUM ('CREATED', 'UPDATED', 'REOPENED', 'STATUS_CHANGED', 'PRIORITY_CHANGED');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'WITH_AGENT',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "transferSummary" TEXT,
    "transferReasonCode" "TransferReasonCode",
    "assignedAnalystId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorType" "AuthorType" NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionTrace" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "understoodIntent" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "policyHits" JSONB NOT NULL,
    "toolCalls" JSONB NOT NULL,
    "modelConfidence" DOUBLE PRECISION,
    "presentedAssurance" "PresentedAssurance" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "ownerEmployeeId" TEXT NOT NULL,
    "affectedEmployeeId" TEXT NOT NULL,
    "slaDeadlineAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "kind" "TicketEventKind" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorType" "AuthorType" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingConfirmation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "operation" "PendingOperation" NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Conversation_status_updatedAt_idx" ON "Conversation"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_assignedAnalystId_status_idx" ON "Conversation"("assignedAnalystId", "status");

-- CreateIndex
CREATE INDEX "Conversation_employeeId_updatedAt_idx" ON "Conversation"("employeeId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionTrace_messageId_key" ON "DecisionTrace"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");

-- CreateIndex
CREATE INDEX "Ticket_ownerEmployeeId_status_idx" ON "Ticket"("ownerEmployeeId", "status");

-- CreateIndex
CREATE INDEX "Ticket_ownerEmployeeId_category_status_idx" ON "Ticket"("ownerEmployeeId", "category", "status");

-- CreateIndex
CREATE INDEX "Ticket_ownerEmployeeId_resolvedAt_idx" ON "Ticket"("ownerEmployeeId", "resolvedAt");

-- CreateIndex
CREATE INDEX "TicketEvent_ticketId_createdAt_idx" ON "TicketEvent"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticle_slug_key" ON "HelpArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PendingConfirmation_token_key" ON "PendingConfirmation"("token");

-- CreateIndex
CREATE INDEX "PendingConfirmation_employeeId_consumedAt_idx" ON "PendingConfirmation"("employeeId", "consumedAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedAnalystId_fkey" FOREIGN KEY ("assignedAnalystId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTrace" ADD CONSTRAINT "DecisionTrace_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_affectedEmployeeId_fkey" FOREIGN KEY ("affectedEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingConfirmation" ADD CONSTRAINT "PendingConfirmation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingConfirmation" ADD CONSTRAINT "PendingConfirmation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
