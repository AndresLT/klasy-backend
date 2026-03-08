import {
  Injectable, NestInterceptor,
  ExecutionContext, CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly db: DatabaseService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario autenticado, dejamos pasar
    // (el JwtAuthGuard ya habrá bloqueado si el endpoint lo requiere)
    if (!user) return next.handle();

    const institutionId = request.headers['x-institution-id'];

    // Si no viene el header, dejamos pasar
    // Hay endpoints que no necesitan contexto de institución
    // como GET /auth/profile
    if (!institutionId) return next.handle();

    // Verificamos que el usuario pertenece a esa institución
    const result = await this.db.query(
      `SELECT
         m.role_code,
         i.schema_name
       FROM public.memberships m
       INNER JOIN public.institutions i ON i.id = m.institution_id
       WHERE m.user_id = $1
         AND m.institution_id = $2
         AND m.is_active = true
         AND i.is_active = true`,
      [user.id, institutionId],
    );

    if (result.length === 0) {
      throw new ForbiddenException(
        'No perteneces a esta institución o está inactiva',
      );
    }

    // Adjuntamos al request para que los controllers los consuman
    request.schemaName = result[0].schema_name;
    request.klasyRole = result[0].role_code;

    return next.handle();
  }
}