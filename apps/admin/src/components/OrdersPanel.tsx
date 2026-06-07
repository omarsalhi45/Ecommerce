import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import type { Order } from '../types'

export const orderStatuses: Order['status'][] = ['pending', 'shipped', 'delivered', 'cancelled']

export const orderStatusColorSchemes: Record<Order['status'], string> = {
  cancelled: 'red',
  delivered: 'green',
  pending: 'yellow',
  shipped: 'blue',
}

export const paymentStatusColorSchemes: Record<Order['paymentStatus'], string> = {
  mock_paid: 'green',
  paid: 'green',
  payment_failed: 'red',
  payment_required: 'yellow',
}

export const paymentStatusLabels: Record<Order['paymentStatus'], string> = {
  mock_paid: 'mock paid',
  paid: 'paid',
  payment_failed: 'failed',
  payment_required: 'awaiting payment',
}

export type OrderStatusFilter = 'all' | Order['status']
export type PaymentStatusFilter = 'all' | Order['paymentStatus']

export const paymentStatuses = Object.keys(paymentStatusLabels) as Order['paymentStatus'][]
export const recentOrderLimit = 25

export const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export const getOrderItemCount = (order: Order) =>
  order.items.reduce((total, item) => total + item.quantity, 0)

interface OrdersPanelProps {
  filteredOrders: Order[]
  hasMoreOrders: boolean
  isOrdersError: boolean
  orders: Order[]
  orderSearch: string
  orderStatusFilter: OrderStatusFilter
  paymentStatusFilter: PaymentStatusFilter
  visibleOrders: Order[]
  onOrderSearchChange: (value: string) => void
  onOrderStatusFilterChange: (value: OrderStatusFilter) => void
  onPaymentStatusFilterChange: (value: PaymentStatusFilter) => void
  onSelectOrder: (orderId: string) => void
}

export function OrdersPanel({
  filteredOrders,
  hasMoreOrders,
  isOrdersError,
  orders,
  orderSearch,
  orderStatusFilter,
  paymentStatusFilter,
  visibleOrders,
  onOrderSearchChange,
  onOrderStatusFilterChange,
  onPaymentStatusFilterChange,
  onSelectOrder,
}: OrdersPanelProps) {
  return (
    <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
      <HStack align={{ base: 'stretch', md: 'center' }} justify="space-between" mb={4}>
        <Box>
          <Heading as="h2" size="md">
            Orders
          </Heading>
          <Text color="neutral.600" fontSize="sm">
            Showing {visibleOrders.length} of {filteredOrders.length} matching orders
          </Text>
        </Box>
      </HStack>
      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={3} mb={4}>
        <Input
          placeholder="Search order, email, customer, city, or item"
          value={orderSearch}
          onChange={(event) => onOrderSearchChange(event.target.value)}
        />
        <Select
          value={orderStatusFilter}
          onChange={(event) => onOrderStatusFilterChange(event.target.value as OrderStatusFilter)}
        >
          <option value="all">All statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          value={paymentStatusFilter}
          onChange={(event) =>
            onPaymentStatusFilterChange(event.target.value as PaymentStatusFilter)
          }
        >
          <option value="all">All payments</option>
          {paymentStatuses.map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabels[status]}
            </option>
          ))}
        </Select>
      </Grid>
      {isOrdersError ? (
        <Text color="error.600">Orders could not be loaded.</Text>
      ) : visibleOrders.length ? (
        <>
          <Box
            border="1px solid"
            borderColor="neutral.100"
            borderRadius="md"
            maxH="420px"
            overflow="auto"
          >
            <Table size="sm">
              <Thead bg="white" position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {visibleOrders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <Text fontWeight="bold">{order.id}</Text>
                      <Text color="neutral.500" fontSize="xs">
                        {formatOrderDate(order.createdAt)}
                      </Text>
                    </Td>
                    <Td>
                      <Text>{order.customer.email}</Text>
                      <Text color="neutral.500" fontSize="xs">
                        {order.customer.firstName} {order.customer.lastName}
                      </Text>
                    </Td>
                    <Td>{getOrderItemCount(order)}</Td>
                    <Td>${order.totals.total.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={paymentStatusColorSchemes[order.paymentStatus]}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={orderStatusColorSchemes[order.status]}>
                        {order.status}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Button size="xs" variant="outline" onClick={() => onSelectOrder(order.id)}>
                        Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          {hasMoreOrders ? (
            <Text color="neutral.600" fontSize="sm" mt={3}>
              Narrow the filters to see more than the first {recentOrderLimit} results.
            </Text>
          ) : null}
        </>
      ) : (
        <Text color="neutral.600">
          {orders.length ? 'No orders match these filters.' : 'No orders yet.'}
        </Text>
      )}
    </Box>
  )
}
