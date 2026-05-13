CREATE TABLE IF NOT EXISTS "ContactInquiry" (
  "id" SERIAL NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "ticketType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);
