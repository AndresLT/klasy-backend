import {
  Injectable, BadRequestException,
  InternalServerErrorException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/login.dto';
import { ApiResponseDto } from '../../common/dto/api-response';
import { HttpStatusCode } from '../../common/constants/http-codes';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') as string,
      this.configService.get<string>('supabase.serviceKey') as string,
    );
  }

  // Retorna el perfil con todas las instituciones del usuario
  async getProfile(userId: string) {
    const userResult = await this.db.query(
      `SELECT id, email, full_name, avatar_url
       FROM public.users
       WHERE id = $1 AND is_active = true`,
      [userId],
    );

    const user = userResult[0];
    if (!user) return null;

    const institutions = await this.db.query(
      `SELECT
         i.id,
         i.name,
         i.slug,
         i.logo_url,
         i.primary_color,
         i.secondary_color,
         i.schema_name,
         m.role_code
       FROM public.institutions i
       INNER JOIN public.memberships m ON m.institution_id = i.id
       WHERE m.user_id = $1
         AND m.is_active = true
         AND i.is_active = true
       ORDER BY i.name ASC`,
      [userId],
    );

    const data = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      institutions: institutions.map(i => ({
        id: i.id,
        name: i.name,
        slug: i.slug,
        logoUrl: i.logo_url,
        primaryColor: i.primary_color,
        secondaryColor: i.secondary_color,
        schemaName: i.schema_name,
        roleCode: i.role_code,
      })),
    };

    return ApiResponseDto.ok(data, 'Operacion exitosa', HttpStatusCode.OK)
  }

  // Verifica que el usuario pertenece a la institución
  // y retorna los datos necesarios para el frontend
  async resolveInstitution(userId: string, institutionId: string) {
    const result = await this.db.query(
      `SELECT
         m.role_code,
         i.schema_name,
         i.id,
         i.name,
         i.logo_url,
         i.primary_color,
         i.secondary_color
       FROM public.memberships m
       INNER JOIN public.institutions i ON i.id = m.institution_id
       WHERE m.user_id = $1
         AND m.institution_id = $2
         AND m.is_active = true
         AND i.is_active = true`,
      [userId, institutionId],
    );

    if (result.length === 0) {
      throw new ForbiddenException(
        ApiResponseDto.error('No perteneces a esta institución o está inactiva', HttpStatusCode.CONFLICT),
      );
    }

    const membership = result[0];

    const data = {
      institutionId: membership.id,
      institutionName: membership.name,
      schemaName: membership.schema_name,
      roleCode: membership.role_code,
      logoUrl: membership.logo_url,
      primaryColor: membership.primary_color,
      secondaryColor: membership.secondary_color,
    };

    return ApiResponseDto.ok(data, 'Operacion exitosa', HttpStatusCode.OK)
  }

  async createUser(
    dto: CreateUserDto,
    institutionId: string,
  ) {
    const existing = await this.db.query(
      `SELECT u.id FROM public.users u
       INNER JOIN public.memberships m ON m.user_id = u.id
       WHERE u.email = $1 AND m.institution_id = $2`,
      [dto.email, institutionId],
    );

    if (existing.length > 0) {
      throw new BadRequestException(
        ApiResponseDto.error('Ya existe un usuario con ese email en esta institución', HttpStatusCode.CONFLICT),
      );
    }

    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        email_confirm: true,
        user_metadata: { full_name: dto.fullName },
      });

    if (authError) {
      this.logger.error('Error creando usuario en Supabase Auth', authError);
      throw new InternalServerErrorException(
        ApiResponseDto.error('No se pudo crear el usuario. Intenta de nuevo.', HttpStatusCode.CONFLICT),
      );
    }

    const userId = authData.user.id;

    try {
      await this.db.query(
        `INSERT INTO public.users (id, email, full_name)
         VALUES ($1, $2, $3)`,
        [userId, dto.email, dto.fullName],
      );

      await this.db.query(
        `INSERT INTO public.memberships
           (user_id, institution_id, role_code)
         VALUES ($1, $2, $3)`,
        [userId, institutionId, dto.roleCode],
      );

      const data = {
        id: userId,
        email: dto.email,
        fullName: dto.fullName,
        roleCode: dto.roleCode,
      };

      return ApiResponseDto.ok(data,'Usuario creado correctamente.', HttpStatusCode.CREATED)
    } catch (error) {
      await this.supabase.auth.admin.deleteUser(userId);
      await this.db.query(
        `DELETE from public.users
        WHERE id = $1`,
        [userId]
      )
      throw new InternalServerErrorException(
        ApiResponseDto.error('Error al guardar el usuario. La operación fue revertida.', HttpStatusCode.INTERNAL_ERROR),
      );
    }
  }
}