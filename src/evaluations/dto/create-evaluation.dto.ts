import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateEvaluationDto {
  @IsString()
  playerId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  dribbling!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  passing!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  shooting!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  defense!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  decisionMaking!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  attitude!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}