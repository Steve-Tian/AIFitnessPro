-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_cn" TEXT NOT NULL,
    "desc_cn" TEXT NOT NULL,
    "icon_emoji" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "achievement_logs_user_id_idx" ON "achievement_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_logs_user_id_achievement_id_key" ON "achievement_logs"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "achievement_logs" ADD CONSTRAINT "achievement_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_logs" ADD CONSTRAINT "achievement_logs_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
