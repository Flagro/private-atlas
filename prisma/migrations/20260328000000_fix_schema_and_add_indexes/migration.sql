-- The initial migration was created before Google OAuth support was added.
-- This migration fixes the resulting schema gaps and adds performance indexes.

-- AlterTable: make password_hash nullable (required for OAuth-only accounts)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable: add image column (profile picture from OAuth provider)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- CreateTable: oauth_accounts (was missing from initial migration)
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: oauth_accounts -> users
ALTER TABLE "oauth_accounts" DROP CONSTRAINT IF EXISTS "oauth_accounts_user_id_fkey";
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: unique on oauth_accounts(provider, provider_account_id)
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_accounts_provider_providerAccountId_key"
    ON "oauth_accounts"("provider", "provider_account_id");

-- CreateIndex: unique on cities(name, country_id) — was missing from initial migration
CREATE UNIQUE INDEX IF NOT EXISTS "cities_name_countryId_key"
    ON "cities"("name", "country_id");

-- CreateIndex: performance indexes on visits
CREATE INDEX IF NOT EXISTS "visits_user_id_idx"     ON "visits"("user_id");
CREATE INDEX IF NOT EXISTS "visits_country_id_idx"  ON "visits"("country_id");
CREATE INDEX IF NOT EXISTS "visits_city_id_idx"     ON "visits"("city_id");

-- CreateIndex: performance index on cities(country_id) for getCitiesByCountry
CREATE INDEX IF NOT EXISTS "cities_country_id_idx"  ON "cities"("country_id");
