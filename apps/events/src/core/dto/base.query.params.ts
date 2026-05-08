import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export class BaseQueryParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @Transform(({ value }) => value.toUpperCase() ?? SortDirection.Desc)
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;
}
