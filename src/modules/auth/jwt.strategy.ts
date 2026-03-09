import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
  StrategyOptionsWithRequest,
} from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';

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
  private readonly supabase;

  constructor(
    configService: ConfigService,
    private db: DatabaseService,
  ) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: configService.get<string>('jwt.jwksUri') as string,
      }),
      algorithms: ['ES256'],
      // Necesitamos el request para extraer el JWT crudo
      passReqToCallback: true,
    };
    super(options);

    this.supabase = createClient(
      configService.get<string>('supabase.url') as string,
      configService.get<string>('supabase.serviceKey') as string,
    );
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extraemos el JWT crudo del header Authorization
    const jwt = req.headers.authorization?.replace('Bearer ', '');

    // Verificamos contra Supabase si la sesión sigue activa
    // getUser(jwt) falla si la sesión fue cerrada con logout
    const { data, error } = await this.supabase.auth.getUser(jwt);

    if (error || !data.user) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    // Verificamos que el usuario existe en nuestra tabla
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