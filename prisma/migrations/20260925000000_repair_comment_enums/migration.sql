-- Some locally bootstrapped databases retained the earlier lowercase enum
-- labels while the application schema uses Prisma's uppercase enum values.
-- Rename only labels that still use the legacy spelling, making this safe for
-- already-correct databases as well.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'approved') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'approved' TO 'APPROVED';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'pending_review') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'pending_review' TO 'PENDING_REVIEW';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'deleted') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'deleted' TO 'DELETED';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentKind"'::regtype AND enumlabel = 'general') THEN
    ALTER TYPE "CommentKind" RENAME VALUE 'general' TO 'GENERAL';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentKind"'::regtype AND enumlabel = 'question') THEN
    ALTER TYPE "CommentKind" RENAME VALUE 'question' TO 'QUESTION';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentKind"'::regtype AND enumlabel = 'answer') THEN
    ALTER TYPE "CommentKind" RENAME VALUE 'answer' TO 'ANSWER';
  END IF;
END $$;
