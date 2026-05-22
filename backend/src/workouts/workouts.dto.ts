import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SyncWorkoutStatus {
  not_started = 'not_started',
  in_progress = 'in_progress',
  resting = 'resting',
  paused = 'paused',
  completed = 'completed',
  abandoned = 'abandoned',
}

export class SyncWorkoutSetDto {
  @IsUUID('4', { message: '组记录 ID 无效' })
  id!: string;

  @IsUUID('4', { message: '动作 ID 无效' })
  exerciseId!: string;

  @IsInt({ message: '组序号必须是整数' })
  @Min(1, { message: '组序号必须大于 0' })
  setIndex!: number;

  @IsOptional()
  @IsInt({ message: '目标次数必须是整数' })
  @Min(1, { message: '目标次数必须大于 0' })
  targetReps?: number;

  @IsInt({ message: '实际次数必须是整数' })
  @Min(0, { message: '实际次数不能为负数' })
  actualReps!: number;

  @IsOptional()
  @IsNumber({}, { message: '重量必须是数字' })
  @Min(0, { message: '重量不能为负数' })
  weightKg?: number;

  @IsOptional()
  @IsISO8601({}, { message: '完成时间格式无效' })
  completedAt?: string;
}

export class SyncWorkoutSessionDto {
  @IsUUID('4', { message: '训练 Session ID 无效' })
  id!: string;

  @IsUUID('4', { message: '训练计划 ID 无效' })
  trainingPlanId!: string;

  @IsInt({ message: '计划日序号必须是整数' })
  @Min(0, { message: '计划日序号不能为负数' })
  planDayIndex!: number;

  @IsEnum(SyncWorkoutStatus, { message: '训练状态无效' })
  status!: SyncWorkoutStatus;

  @IsOptional()
  @IsISO8601({}, { message: '开始时间格式无效' })
  startedAt?: string;

  @IsOptional()
  @IsISO8601({}, { message: '完成时间格式无效' })
  completedAt?: string;

  @IsOptional()
  @IsInt({ message: '训练时长必须是整数' })
  @Min(0, { message: '训练时长不能为负数' })
  durationSeconds?: number;
}

export class SyncWorkoutRequestDto {
  @ValidateNested()
  @Type(() => SyncWorkoutSessionDto)
  session!: SyncWorkoutSessionDto;

  @IsArray({ message: '组记录必须是数组' })
  @ArrayNotEmpty({ message: '至少包含一组训练记录' })
  @ValidateNested({ each: true })
  @Type(() => SyncWorkoutSetDto)
  sets!: SyncWorkoutSetDto[];
}
