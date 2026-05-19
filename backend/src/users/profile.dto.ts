import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';

export enum ProfileGender {
  male = 'male',
  female = 'female',
  other = 'other',
}

export enum ProfileGoal {
  bulk = 'bulk',
  cut = 'cut',
  strength = 'strength',
  fitness = 'fitness',
}

export enum ProfileExperience {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export enum ProfilePersona {
  coach = 'coach',
  buddy = 'buddy',
  comedian = 'comedian',
  beauty_coach = 'beauty_coach',
}

export enum ProfileEquipment {
  full_gym = 'full_gym',
  barbell_bench = 'barbell_bench',
  dumbbell_only = 'dumbbell_only',
  bodyweight = 'bodyweight',
}

export class UpsertProfileDto {
  @IsEnum(ProfileGender, { message: '请选择有效性别' })
  gender!: ProfileGender;

  @IsInt({ message: '年龄必须是整数' })
  @Min(16, { message: '年龄需在 16-65 岁之间' })
  @Max(65, { message: '年龄需在 16-65 岁之间' })
  age!: number;

  @IsInt({ message: '身高必须是整数' })
  @Min(140, { message: '身高需在 140-220cm 之间' })
  @Max(220, { message: '身高需在 140-220cm 之间' })
  heightCm!: number;

  @IsNumber({}, { message: '体重必须是数字' })
  @Min(30, { message: '体重需在 30-200kg 之间' })
  @Max(200, { message: '体重需在 30-200kg 之间' })
  weightKg!: number;

  @IsEnum(ProfileGoal, { message: '请选择有效目标' })
  goal!: ProfileGoal;

  @IsEnum(ProfileExperience, { message: '请选择有效训练经验' })
  experience!: ProfileExperience;

  @IsInt({ message: '每周训练天数必须是整数' })
  @Min(3, { message: '每周训练天数需在 3-5 天之间' })
  @Max(5, { message: '每周训练天数需在 3-5 天之间' })
  daysPerWeek!: number;

  @IsArray({ message: '器械必须是数组' })
  @ArrayNotEmpty({ message: '请至少选择一种器械' })
  @IsEnum(ProfileEquipment, { each: true, message: '包含无效器械类型' })
  equipment!: ProfileEquipment[];

  @IsEnum(ProfilePersona, { message: '请选择有效陪伴风格' })
  persona!: ProfilePersona;
}
