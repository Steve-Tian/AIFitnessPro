import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDevUserDto {
  @IsString({ message: '设备名称不能为空' })
  @MinLength(1, { message: '设备名称不能为空' })
  @MaxLength(80, { message: '设备名称不能超过 80 个字符' })
  deviceLabel!: string;

  @IsOptional()
  @IsString({ message: '外部设备标识必须是字符串' })
  @MaxLength(120, { message: '外部设备标识不能超过 120 个字符' })
  externalId?: string;
}
