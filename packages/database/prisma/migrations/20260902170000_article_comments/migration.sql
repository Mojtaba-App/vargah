-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "article_comments" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_comments_articleId_status_idx" ON "article_comments"("articleId", "status");

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
