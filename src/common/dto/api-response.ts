// src/common/dto/api-response.dto.ts

export class PaginationMeta {
  total: number = 0;
  page: number = 0;
  limit: number = 0;
  totalPages: number = 0;

  static of(total: number, page: number, limit: number): PaginationMeta {
    const meta = new PaginationMeta();
    meta.total = total;
    meta.page = page;
    meta.limit = limit;
    meta.totalPages = Math.ceil(total / limit);
    return meta;
  }
}

export class ApiResponseDto<T> {
  success: boolean = false;
  statusCode: number = 0;
  message: string = '';
  data?: T;
  meta?: PaginationMeta;

  // Respuesta exitosa genérica
  static ok<T>(message: string, statusCode = 200, data?: T): ApiResponseDto<T> {
    const res = new ApiResponseDto<T>();
    res.success = true;
    res.statusCode = statusCode;
    res.message = message;
    res.data = data;
    return res;
  }

  // Respuesta paginada
  static paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message: string,
  ): ApiResponseDto<T[]> {
    const res = new ApiResponseDto<T[]>();
    res.success = true;
    res.statusCode = 200;
    res.message = message;
    res.data = data;
    res.meta = meta;
    return res;
  }

  // Respuesta de error
  static error(message: string, statusCode: number): ApiResponseDto<null> {
    const res = new ApiResponseDto<null>();
    res.success = false;
    res.statusCode = statusCode;
    res.message = message;
    res.data = null;
    return res;
  }
}