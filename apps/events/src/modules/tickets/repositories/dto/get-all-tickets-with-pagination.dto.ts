import { BaseQueryParams } from '../../../../core/dto/base.query.params';

export class GetAllTicketsWithPaginationDto extends BaseQueryParams {
  userId: string;
}
