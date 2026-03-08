import {
  Controller, Post, Get,
  Body, UseGuards, HttpCode,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /api/v1/auth/profile
  // Cualquier usuario autenticado puede ver su propio perfil
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  // POST /api/v1/auth/users
  // Solo admin puede crear usuarios en su institución
  @Post('users')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Crear un nuevo usuario (solo admin)' })
  @ApiHeader({
    name: 'X-Institution-Id',
    description: 'UUID de la institución activa',
    required: true,
  })
  createUser(
    @Body() dto: CreateUserDto,
    @Headers('x-institution-id') institutionId: string
  ) {
    return this.authService.createUser(
      dto,
      institutionId,
    );
  }
}