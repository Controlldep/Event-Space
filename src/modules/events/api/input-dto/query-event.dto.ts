import { BaseQueryParams } from '../../../../core/dto/base.query.params';

export class QueryEventDto extends BaseQueryParams {
  search?: string;
  category?: string;
  dateFrom?: string;
}
