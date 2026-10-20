// Shop Carajás - Unified SQLite / Cloudflare D1 Client Adapter

export interface PreparedStatement {
  bind(...params: any[]): PreparedStatement;
  all<T = any>(): Promise<{ results: T[] }>;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: any }>;
}

export interface DatabaseAdapter {
  prepare(query: string): PreparedStatement;
  exec(query: string): Promise<void>;
  batch(statements: PreparedStatement[]): Promise<any[]>;
}

// In Node.js environment (dev server), we wrap node:sqlite DatabaseSync
class NodeSqliteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(dbInstance: any) {
    this.db = dbInstance;
  }

  prepare(query: string): PreparedStatement {
    return new NodePreparedStatement(this.db, query);
  }

  async exec(query: string): Promise<void> {
    this.db.exec(query);
  }

  async batch(statements: PreparedStatement[]): Promise<any[]> {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

class NodePreparedStatement implements PreparedStatement {
  private db: any;
  private query: string;
  private params: any[] = [];

  constructor(db: any, query: string) {
    this.db = db;
    this.query = query;
  }

  bind(...params: any[]): PreparedStatement {
    this.params = params.map(p => (p === undefined ? null : p));
    return this;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    try {
      const stmt = this.db.prepare(this.query);
      const rows = stmt.all(...this.params) as T[];
      return { results: rows || [] };
    } catch (err) {
      console.error('Error executing query all():', this.query, this.params, err);
      throw err;
    }
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.query);
      const row = stmt.get(...this.params) as any;
      if (!row) return null;
      if (colName && row[colName] !== undefined) return row[colName] as T;
      return row as T;
    } catch (err) {
      console.error('Error executing query first():', this.query, this.params, err);
      throw err;
    }
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    try {
      const stmt = this.db.prepare(this.query);
      const info = stmt.run(...this.params);
      return { success: true, meta: info };
    } catch (err) {
      console.error('Error executing query run():', this.query, this.params, err);
      throw err;
    }
  }
}

// Wrap Cloudflare D1
class CloudflareD1Adapter implements DatabaseAdapter {
  private d1: any;

  constructor(d1: any) {
    this.d1 = d1;
  }

  prepare(query: string): PreparedStatement {
    const d1Stmt = this.d1.prepare(query);
    return new CloudflarePreparedStatement(d1Stmt);
  }

  async exec(query: string): Promise<void> {
    await this.d1.exec(query);
  }

  async batch(statements: any[]): Promise<any[]> {
    return await this.d1.batch(statements.map((s: any) => s.d1Stmt || s));
  }
}

class CloudflarePreparedStatement implements PreparedStatement {
  private stmt: any;

  constructor(stmt: any) {
    this.stmt = stmt;
  }

  bind(...params: any[]): PreparedStatement {
    this.stmt = this.stmt.bind(...params.map(p => (p === undefined ? null : p)));
    return this;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const res = await this.stmt.all();
    return { results: res.results || [] };
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    return (await this.stmt.first(colName)) || null;
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const res = await this.stmt.run();
    return { success: res.success, meta: res.meta };
  }
}

let globalDb: DatabaseAdapter | null = null;

export function setGlobalDb(adapter: DatabaseAdapter) {
  globalDb = adapter;
}

export function getDb(env?: any): DatabaseAdapter {
  if (env && env.DB) {
    return new CloudflareD1Adapter(env.DB);
  }
  if (!globalDb) {
    throw new Error('Database not initialized');
  }
  return globalDb;
}

export function createNodeSqliteAdapter(nodeDbInstance: any): DatabaseAdapter {
  return new NodeSqliteAdapter(nodeDbInstance);
}
