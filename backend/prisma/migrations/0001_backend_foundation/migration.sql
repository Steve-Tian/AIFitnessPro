-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('bulk', 'cut', 'strength', 'fitness');

-- CreateEnum
CREATE TYPE "Experience" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('coach', 'buddy', 'comedian', 'beauty_coach');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('metric');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('not_started', 'in_progress', 'resting', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'gif', 'video');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "dev_external_id" TEXT,
    "device_label" TEXT NOT NULL,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "active_plan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" "Gender" NOT NULL,
    "age" INTEGER NOT NULL,
    "height_cm" INTEGER NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "goal" "Goal" NOT NULL,
    "experience" "Experience" NOT NULL,
    "days_per_week" INTEGER NOT NULL,
    "equipment" TEXT[],
    "persona" "Persona" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "unit" "UnitSystem" NOT NULL DEFAULT 'metric',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "privacy_version" TEXT NOT NULL,
    "terms_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    "source" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_days" (
    "id" UUID NOT NULL,
    "training_plan_id" UUID NOT NULL,
    "day_index" INTEGER NOT NULL,
    "scheduled_date" DATE,
    "day_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_exercises" (
    "id" UUID NOT NULL,
    "plan_day_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "target_reps" INTEGER NOT NULL,
    "target_rest_seconds" INTEGER NOT NULL,
    "recommended_weight_kg" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_plan_id" UUID,
    "plan_day_id" UUID,
    "status" "WorkoutStatus" NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" UUID NOT NULL,
    "workout_session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "target_reps" INTEGER,
    "actual_reps" INTEGER,
    "weight_kg" DECIMAL(5,2),
    "rpe" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "workout_session_id" UUID,
    "rpe" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_adjustments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "average_rpe" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "feedback_count" INTEGER NOT NULL DEFAULT 0,
    "next_sets" INTEGER,
    "next_reps" INTEGER,
    "next_rest_seconds" INTEGER,
    "next_weight_kg" DECIMAL(5,2),
    "trend" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_cn" TEXT NOT NULL,
    "aliases" TEXT[],
    "category" TEXT NOT NULL,
    "primary_muscles" TEXT[],
    "equipment" TEXT[],
    "difficulty" TEXT NOT NULL,
    "instructions" TEXT[],
    "common_mistakes" TEXT[],
    "safety_notes" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_media" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "suitable_goals" TEXT[],
    "ingredients" JSONB NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein_g" DECIMAL(6,2) NOT NULL,
    "carbs_g" DECIMAL(6,2) NOT NULL,
    "fat_g" DECIMAL(6,2) NOT NULL,
    "prep_time_minutes" INTEGER,
    "difficulty" TEXT,
    "allergens" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_dev_external_id_key" ON "users"("dev_external_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "consent_logs_user_id_idx" ON "consent_logs"("user_id");

-- CreateIndex
CREATE INDEX "training_plans_user_id_idx" ON "training_plans"("user_id");

-- CreateIndex
CREATE INDEX "plan_days_training_plan_id_idx" ON "plan_days"("training_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_days_training_plan_id_day_index_key" ON "plan_days"("training_plan_id", "day_index");

-- CreateIndex
CREATE INDEX "plan_exercises_plan_day_id_idx" ON "plan_exercises"("plan_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_exercises_plan_day_id_sort_order_key" ON "plan_exercises"("plan_day_id", "sort_order");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_idx" ON "workout_sessions"("user_id");

-- CreateIndex
CREATE INDEX "workout_sets_workout_session_id_idx" ON "workout_sets"("workout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sets_workout_session_id_exercise_id_set_index_key" ON "workout_sets"("workout_session_id", "exercise_id", "set_index");

-- CreateIndex
CREATE INDEX "exercise_feedback_user_id_exercise_id_idx" ON "exercise_feedback"("user_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_adjustments_user_id_exercise_id_key" ON "exercise_adjustments"("user_id", "exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "exercise_media_exercise_id_idx" ON "exercise_media"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_days" ADD CONSTRAINT "plan_days_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_feedback" ADD CONSTRAINT "exercise_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_feedback" ADD CONSTRAINT "exercise_feedback_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_feedback" ADD CONSTRAINT "exercise_feedback_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_adjustments" ADD CONSTRAINT "exercise_adjustments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_adjustments" ADD CONSTRAINT "exercise_adjustments_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_media" ADD CONSTRAINT "exercise_media_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
