import { query, withTransaction } from '../db'
import type { Order, OrderItemSnapshot } from '../services/orderService'

interface OrderRow {
  readonly id: string
  readonly user_id: string | null
  readonly status: Order['status']
  readonly payment_status: Order['paymentStatus']
  readonly customer_email: string
  readonly customer_first_name: string
  readonly customer_last_name: string
  readonly customer_phone: string | null
  readonly shipping_line1: string
  readonly shipping_line2: string | null
  readonly shipping_city: string
  readonly shipping_state: string
  readonly shipping_postal_code: string
  readonly shipping_country: string
  readonly subtotal: string
  readonly shipping: string
  readonly tax: string
  readonly total: string
  readonly created_at: Date
}

interface OrderItemRow {
  readonly product_id: string
  readonly product_name: string
  readonly quantity: number
  readonly unit_price: string
  readonly line_total: string
}

const mapOrderItem = (row: OrderItemRow): OrderItemSnapshot => ({
  productId: row.product_id,
  name: row.product_name,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  lineTotal: Number(row.line_total),
})

const mapOrder = (row: OrderRow, items: OrderItemSnapshot[]): Order => ({
  id: row.id,
  status: row.status,
  paymentStatus: row.payment_status,
  customer: {
    email: row.customer_email,
    firstName: row.customer_first_name,
    lastName: row.customer_last_name,
    phone: row.customer_phone ?? undefined,
  },
  shippingAddress: {
    line1: row.shipping_line1,
    line2: row.shipping_line2 ?? undefined,
    city: row.shipping_city,
    state: row.shipping_state,
    postalCode: row.shipping_postal_code,
    country: row.shipping_country,
  },
  items,
  totals: {
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
  },
  userId: row.user_id ?? undefined,
  createdAt: row.created_at.toISOString(),
})

const getItemsForOrder = async (orderId: string): Promise<OrderItemSnapshot[]> => {
  const result = await query<OrderItemRow>(
    `SELECT product_id, product_name, quantity, unit_price, line_total
     FROM order_items
     WHERE order_id = $1
     ORDER BY id ASC`,
    [orderId]
  )

  return result.rows.map(mapOrderItem)
}

export const insertOrderIntoDb = async (order: Order): Promise<Order> => {
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (
         id,
         user_id,
         status,
         payment_status,
         customer_email,
         customer_first_name,
         customer_last_name,
         customer_phone,
         shipping_line1,
         shipping_line2,
         shipping_city,
         shipping_state,
         shipping_postal_code,
         shipping_country,
         subtotal,
         shipping,
         tax,
         total
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        order.id,
        order.userId,
        order.status,
        order.paymentStatus,
        order.customer.email,
        order.customer.firstName,
        order.customer.lastName,
        order.customer.phone,
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        order.shippingAddress.city,
        order.shippingAddress.state,
        order.shippingAddress.postalCode,
        order.shippingAddress.country,
        order.totals.subtotal,
        order.totals.shipping,
        order.totals.tax,
        order.totals.total,
      ]
    )

    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (
           order_id,
           product_id,
           product_name,
           quantity,
           unit_price,
           line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.productId, item.name, item.quantity, item.unitPrice, item.lineTotal]
      )
    }
  })

  return order
}

export const listOrdersFromDb = async (): Promise<Order[]> => {
  const result = await query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC')
  const orders = await Promise.all(
    result.rows.map(async (row) => mapOrder(row, await getItemsForOrder(row.id)))
  )

  return orders
}

export const getOrderFromDb = async (orderId: string): Promise<Order | undefined> => {
  const result = await query<OrderRow>('SELECT * FROM orders WHERE id = $1', [orderId])

  if (!result.rows[0]) {
    return undefined
  }

  return mapOrder(result.rows[0], await getItemsForOrder(orderId))
}

export const updateOrderStatusInDb = async (
  orderId: string,
  status: Order['status']
): Promise<Order | undefined> => {
  const result = await query<OrderRow>(
    `UPDATE orders
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId, status]
  )

  if (!result.rows[0]) {
    return undefined
  }

  return mapOrder(result.rows[0], await getItemsForOrder(orderId))
}

export const getOrderAnalyticsFromDb = async () => {
  const result = await query<{
    readonly order_count: string
    readonly revenue: string | null
    readonly pending_count: string
  }>(
    `SELECT
       COUNT(*)::text AS order_count,
       COALESCE(SUM(total), 0)::text AS revenue,
       COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_count
     FROM orders`
  )

  const row = result.rows[0]

  return {
    orderCount: Number(row.order_count),
    revenue: Number(row.revenue ?? 0),
    pendingCount: Number(row.pending_count),
  }
}
