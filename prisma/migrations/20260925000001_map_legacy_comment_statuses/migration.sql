-- Legacy local databases used visibility-oriented status names.  Rename the
-- enum labels in place so existing comments keep their intended state while
-- matching the Prisma CommentStatus enum used by the application.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'VISIBLE') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'VISIBLE' TO 'APPROVED';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'HIDDEN') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'HIDDEN' TO 'PENDING_REVIEW';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = '"CommentStatus"'::regtype AND enumlabel = 'REMOVED') THEN
    ALTER TYPE "CommentStatus" RENAME VALUE 'REMOVED' TO 'DELETED';
  END IF;
END $$;
