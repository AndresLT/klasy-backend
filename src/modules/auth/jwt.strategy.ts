import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  institution_schema?: string;
  klasy_role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private db: DatabaseService,
  ) {
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: false as false,

      // En lugar de un secreto estático, usamos passportJwtSecret
      // que consulta el endpoint JWKS de Supabase para obtener
      // la clave pública correcta automáticamente
      secretOrKeyProvider: passportJwtSecret({
        cache: true,           // cachea la clave pública para no consultarla en cada request
        rateLimit: true,       // limita las consultas al endpoint JWKS
        jwksRequestsPerMinute: 5,
        jwksUri: configService.get<string>('jwt.jwksUri') as string,
      }),

      // RS256 es el algoritmo asimétrico que usa Supabase con las nuevas signing keys
      algorithms: ['ES256'],
    };
    super(options);
  }

  async validate(payload: JwtPayload) {
    const users = await this.db.query(
      `SELECT id, email, full_name, is_active
       FROM public.users
       WHERE id = $1`,
      [payload.sub],
    );

    const user = users[0];

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado en el sistema');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return {
      id: payload.sub,
      email: payload.email,
      fullName: user.full_name,
      klasyRole: payload.klasy_role,
      institutionSchema: payload.institution_schema,
    };
  }
}