import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from './database.service';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);
  private readonly schemaTemplate: string;

  constructor(private readonly db: DatabaseService) {
    this.schemaTemplate = readFileSync(
      join(__dirname, 'migrations', '003_institution_schema_template.sql'),
      'utf8',
    );
  }

  async createInstitutionSchema(schemaName: string): Promise<void> {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(schemaName)) {
      throw new Error(`Schema name invalido: ${schemaName}`);
    }
    const sql = this.schemaTemplate.replaceAll('SCHEMA_NAME', schemaName);
    try {
      await this.db.query('BEGIN');
      await this.db.query(sql);
      await this.db.query('COMMIT');
      this.logger.log(`Schema ${schemaName} creado`);
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  async schemaExists(schemaName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = $1
      ) as exists`,
      [schemaName],
    );
    return result[0]?.exists ?? false;
  }

  generateSchemaName(slug: string): string {
    const sanitized = slug
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/, '');
    return `inst_${sanitized}`.substring(0, 63);
  }
}