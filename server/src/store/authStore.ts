import type { Database as SqlDatabase } from "sql.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword, generateToken, generateTokenExpiry } from "../utils/auth.js";
import type { User, UserSession, CreateUserRequest, LoginRequest, LoginResponse } from "../types.js";

export class AuthStore {
  constructor(private readonly db: SqlDatabase) {
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'team_member')),
        supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        telegram_id TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON users(supervisor_id);
    `);
  }

  public async createUser(data: CreateUserRequest, creatorRole?: string): Promise<User> {
    // Validation: Only admins can create supervisors or other admins
    if (data.role === "admin" || data.role === "supervisor") {
      if (creatorRole !== "admin") {
        throw new AppError("Only admins can create supervisors or admins", 403);
      }
    }

    // Validation: Team members must have a supervisor
    if (data.role === "team_member" && !data.supervisorId) {
      throw new AppError("Team members must be assigned to a supervisor", 400);
    }

    const passwordHash = hashPassword(data.password);

    const insert = this.db.prepare(`
      INSERT INTO users (name, email, password_hash, role, supervisor_id)
      VALUES ($name, $email, $passwordHash, $role, $supervisorId)
    `);

    try {
      insert.run({
        $name: data.name,
        $email: data.email,
        $passwordHash: passwordHash,
        $role: data.role,
        $supervisorId: data.supervisorId || null,
      });
    } catch (error) {
      throw new AppError("Email already exists", 409);
    } finally {
      insert.free();
    }

    const id = this.lastInsertId();
    const user = this.getUserById(id);

    if (!user) {
      throw new AppError("Failed to create user", 500);
    }

    return user;
  }

  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const user = this.getUserByEmail(credentials.email);

    if (!user || !verifyPassword(credentials.password, user.password_hash)) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken();
    const expiresAt = generateTokenExpiry();

    const insert = this.db.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES ($userId, $token, $expiresAt)
    `);

    insert.run({
      $userId: user.id,
      $token: token,
      $expiresAt: expiresAt,
    });
    insert.free();

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        supervisorId: user.supervisor_id,
      },
    };
  }

  public validateSession(token: string): UserSession | null {
    const stmt = this.db.prepare(`
      SELECT user_id, token, expires_at
      FROM sessions
      WHERE token = $token AND datetime(expires_at) > datetime('now')
    `);

    stmt.bind({ $token: token });

    try {
      if (stmt.step()) {
        const row = stmt.getAsObject();
        return {
          user_id: Number(row.user_id),
          token: String(row.token),
          expires_at: String(row.expires_at),
        };
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public getUserById(id: number): User | null {
    const stmt = this.db.prepare(`
      SELECT id, name, email, password_hash, role, supervisor_id, telegram_id, created_at, updated_at
      FROM users
      WHERE id = $id
    `);

    stmt.bind({ $id: id });

    try {
      if (stmt.step()) {
        return this.mapUserRow(stmt.getAsObject());
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare(`
      SELECT id, name, email, password_hash, role, supervisor_id, telegram_id, created_at, updated_at
      FROM users
      WHERE email = $email
    `);

    stmt.bind({ $email: email });

    try {
      if (stmt.step()) {
        return this.mapUserRow(stmt.getAsObject());
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public getTeamMembers(supervisorId: number): User[] {
    const stmt = this.db.prepare(`
      SELECT id, name, email, password_hash, role, supervisor_id, telegram_id, created_at, updated_at
      FROM users
      WHERE supervisor_id = $supervisorId AND role = 'team_member'
      ORDER BY name ASC
    `);

    stmt.bind({ $supervisorId: supervisorId });

    const users: User[] = [];

    try {
      while (stmt.step()) {
        users.push(this.mapUserRow(stmt.getAsObject()));
      }
    } finally {
      stmt.free();
    }

    return users;
  }

  public getAllSupervisors(): User[] {
    const stmt = this.db.prepare(`
      SELECT id, name, email, password_hash, role, supervisor_id, telegram_id, created_at, updated_at
      FROM users
      WHERE role = 'supervisor'
      ORDER BY name ASC
    `);

    const users: User[] = [];

    try {
      while (stmt.step()) {
        users.push(this.mapUserRow(stmt.getAsObject()));
      }
    } finally {
      stmt.free();
    }

    return users;
  }

  public deleteUser(id: number, deleterRole: string): void {
    const user = this.getUserById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Only admins can delete supervisors or admins
    if ((user.role === "admin" || user.role === "supervisor") && deleterRole !== "admin") {
      throw new AppError("Only admins can delete supervisors or admins", 403);
    }

    const del = this.db.prepare("DELETE FROM users WHERE id = $id");
    del.run({ $id: id });
    del.free();
  }

  public logout(token: string): void {
    const del = this.db.prepare("DELETE FROM sessions WHERE token = $token");
    del.run({ $token: token });
    del.free();
  }

  private lastInsertId(): number {
    const result = this.db.exec("SELECT last_insert_rowid() as id");
    const idValue = result[0]?.values?.[0]?.[0];
    if (typeof idValue !== "number") {
      throw new AppError("Failed to retrieve inserted id", 500);
    }
    return idValue;
  }

  private mapUserRow(row: Record<string, unknown>): User {
    return {
      id: Number(row.id),
      name: String(row.name),
      email: String(row.email),
      password_hash: String(row.password_hash),
      role: row.role as "admin" | "supervisor" | "team_member",
      supervisor_id: row.supervisor_id === null ? null : Number(row.supervisor_id),
      telegram_id: row.telegram_id === null ? null : String(row.telegram_id),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}
