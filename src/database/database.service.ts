import { Injectable, OnModuleInit, OnModuleDestroy, Logger }
  from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool = new Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get('database.url'),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    const client = await this.pool.connect();
    client.release();
    this.logger.log('Conexion a PostgreSQL establecida');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // La clave del multi-tenant: SET search_path apunta al schema correcto
  async queryWithSchema(
    schemaName: string,
    text: string,
    params?: any[],
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO ${schemaName}, public`);
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release(); // search_path se resetea al liberar
    }
  }

  async withTransaction(
    schemaName: string,
    callback: (client: PoolClient) => Promise<any>,
  ): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO ${schemaName}, public`);
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}