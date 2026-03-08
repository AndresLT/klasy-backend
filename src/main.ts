import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import helmet from 'helmet'
import compression from 'compression';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService)

  app.setGlobalPrefix('api/v1')
  app.use(helmet())
  app.use(compression())

  app.enableCors({
    origin: config.get('app.allowedOrigins'),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  if(config.get('app.nodeEnv') !== 'production'){
    const swaggerConfig = new DocumentBuilder()
     .setTitle('Klasy API')
     .setVersion('1.0')
     .addBearerAuth()
     .build();

     SwaggerModule.setup('api/v1/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  const port = config.get('app.port')
  await app.listen(port);
  console.log(`Server: http://localhost:${port}/api/v1`);
  console.log(`Docs: http://localhost:${port}/api/v1/docs`);
  
}
bootstrap();
