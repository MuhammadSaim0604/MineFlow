
ALTER TABLE "users" ADD COLUMN "wallet_address" text;
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address");
