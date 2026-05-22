import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const CATEGORIES = ['push', 'pull', 'legs', 'core', 'full_body'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const EQUIPMENT = ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight', 'cable'] as const;

export class ListExercisesQueryDto {
  @IsOptional()
  @IsIn(CATEGORIES, { message: '分类无效' })
  category?: string;

  @IsOptional()
  @IsIn(DIFFICULTIES, { message: '难度无效' })
  difficulty?: string;

  @IsOptional()
  @IsIn(EQUIPMENT, { message: '器械无效' })
  equipment?: string;

  @IsOptional()
  @IsString({ message: '搜索关键词无效' })
  @MaxLength(50, { message: '搜索关键词过长' })
  q?: string;
}
