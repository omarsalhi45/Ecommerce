import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { apiConfig } from './config'

const pool = apiConfig.databaseUrl
  ? new Pool({
      connectionString: apiConfig.databaseUrl,
    })
  : undefined

export default pool

export const isDatabaseConfigured = Boolean(pool)

export const query = async <Row extends QueryResultRow>(
  text: string,
  params: Array<string | number | boolean | string[] | null | undefined> = []
) => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured')
  }

  return pool.query<Row>(text, params)
}

export const withTransaction = async <Result>(
  callback: (client: PoolClient) => Promise<Result>
): Promise<Result> => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
