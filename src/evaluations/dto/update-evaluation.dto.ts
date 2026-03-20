import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateEvaluationDto {
  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  dribbling?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  passing?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  shooting?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  defense?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  decisionMaking?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  attitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}