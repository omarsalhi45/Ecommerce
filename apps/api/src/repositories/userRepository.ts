import { query } from '../db'
import type { PublicUser, StoredUser, UserRole } from '../services/authService'

interface UserRow {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly password_hash: string
}

const mapStoredUser = (row: UserRow): StoredUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash,
})

export const findUserByEmailFromDb = async (email: string): Promise<StoredUser | undefined> => {
  const result = await query<UserRow>(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email]
  )

  return result.rows[0] ? mapStoredUser(result.rows[0]) : undefined
}

export const findUserByIdFromDb = async (userId: string): Promise<StoredUser | undefined> => {
  const result = await query<UserRow>(
    'SELECT id, name, email, role, password_hash FROM users WHERE id = $1',
    [userId]
  )

  return result.rows[0] ? mapStoredUser(result.rows[0]) : undefined
}

export const insertUserIntoDb = async (user: StoredUser): Promise<StoredUser> => {
  const result = await query<UserRow>(
    `INSERT INTO users (id, name, email, role, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, password_hash`,
    [user.id, user.name, user.email, user.role, user.passwordHash]
  )

  return mapStoredUser(result.rows[0])
}

export const listUsersFromDb = async (): Promise<PublicUser[]> => {
  const result = await query<Omit<UserRow, 'password_hash'>>(
    'SELECT id, name, email, role FROM users ORDER BY created_at DESC'
  )

  return result.rows
}
