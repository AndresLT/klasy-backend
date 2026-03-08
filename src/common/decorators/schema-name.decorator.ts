import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SchemaName = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().schemaName,
);