import {
  ExecutionContext, Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero validamos el JWT con Passport
    // Esto pone req.user en el request
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const institutionId = request.headers['x-institution-id'];

    // Si no viene el header, dejamos pasar
    // Endpoints como GET /auth/profile no necesitan institución
    if (!institutionId) return true;

    // Verificamos la membresía y resolvemos el schema y rol
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

    // Ahora sí están disponibles para el RolesGuard y los controllers
    request.schemaName = result[0].schema_name;
    request.klasyRole = result[0].role_code;

    return true;
  }
}