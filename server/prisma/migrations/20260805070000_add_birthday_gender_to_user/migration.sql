-- AddColumn birthday and gender to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" TEXT;
