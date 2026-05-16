import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  HStack,
  Heading,
  Input,
  Select,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
} from '../api/adminApi'
import { logout, selectCurrentUser } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Order } from '../types'

const orderStatuses: Order['status'][] = ['pending', 'shipped', 'delivered', 'cancelled']
const paymentStatusColorSchemes: Record<Order['paymentStatus'], string> = {
  mock_paid: 'green',
  paid: 'green',
  payment_failed: 'red',
  payment_required: 'yellow',
}
const paymentStatusLabels: Record<Order['paymentStatus'], string> = {
  mock_paid: 'mock paid',
  paid: 'paid',
  payment_failed: 'failed',
  payment_required: 'awaiting payment',
}
const emptyProductForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: 'tees',
  sku: '',
  stockQuantity: '0',
}

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, string>>({})
  const [productForm, setProductForm] = useState(emptyProductForm)
  const {
    data: analytics,
    isError: isAnalyticsError,
    isLoading: isAnalyticsLoading,
  } = useGetAdminAnalyticsQuery()
  const { data: ordersData, isError: isOrdersError } = useGetAdminOrdersQuery(undefined, {
    pollingInterval: 5000,
  })
  const { data: productsData, isError: isProductsError } = useGetAdminProductsQuery()
  const { data: inventoryData, isError: isInventoryError } = useGetAdminInventoryQuery()
  const { data: usersData, isError: isUsersError } = useGetAdminUsersQuery()
  const [createProduct] = useCreateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [updateInventory] = useUpdateInventoryMutation()
  const hasAdminDataError =
    isAnalyticsError || isOrdersError || isProductsError || isInventoryError || isUsersError

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Stack spacing={8}>
        <Box>
          <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
            Back office
          </Text>
          <Heading>Admin dashboard</Heading>
        </Box>

        {hasAdminDataError ? (
          <Alert status="error" borderRadius="md" alignItems="start">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="bold">Admin data could not be loaded.</Text>
              <Text color="neutral.700" fontSize="sm">
                Your session may be expired, or the local API may have restarted. Sign in again with
                an admin account and retry.
              </Text>
            </Box>
            <Button size="sm" variant="outline" onClick={() => dispatch(logout())}>
              Sign out
            </Button>
          </Alert>
        ) : null}

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
          {isAnalyticsLoading ? (
            <>
              <Skeleton h={28} />
              <Skeleton h={28} />
              <Skeleton h={28} />
            </>
          ) : (
            <>
              <Stat bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
                <StatLabel>Orders</StatLabel>
                <StatNumber>{analytics?.orderCount ?? 0}</StatNumber>
              </Stat>
              <Stat bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
                <StatLabel>Revenue</StatLabel>
                <StatNumber>${(analytics?.revenue ?? 0).toFixed(2)}</StatNumber>
              </Stat>
              <Stat bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
                <StatLabel>Pending</StatLabel>
                <StatNumber>{analytics?.pendingCount ?? 0}</StatNumber>
              </Stat>
            </>
          )}
        </Grid>

        <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
          <Heading as="h2" size="md" mb={4}>
            Orders
          </Heading>
          {isOrdersError ? (
            <Text color="error.600">Orders could not be loaded.</Text>
          ) : ordersData?.orders.length ? (
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ordersData.orders.map((order) => (
                  <Tr key={order.id}>
                    <Td fontWeight="bold">{order.id}</Td>
                    <Td>{order.customer.email}</Td>
                    <Td>${order.totals.total.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={paymentStatusColorSchemes[order.paymentStatus]}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </Badge>
                    </Td>
                    <Td>
                      <Select
                        size="sm"
                        value={order.status}
                        onChange={(event) =>
                          updateOrderStatus({
                            orderId: order.id,
                            status: event.target.value as Order['status'],
                          })
                        }
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text color="neutral.600">No orders yet.</Text>
          )}
        </Box>

        <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6}>
          <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
            <Heading as="h2" size="md" mb={4}>
              Products
            </Heading>
            <Box
              as="form"
              mb={5}
              onSubmit={async (event: FormEvent<HTMLDivElement>) => {
                event.preventDefault()
                await createProduct({
                  id: productForm.id,
                  name: productForm.name,
                  description: productForm.description,
                  price: Number(productForm.price),
                  imageUrl: productForm.imageUrl,
                  category: productForm.category,
                  sku: productForm.sku || undefined,
                  stockQuantity: Number(productForm.stockQuantity),
                })
                setProductForm(emptyProductForm)
              }}
            >
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                <Input
                  placeholder="Product id"
                  value={productForm.id}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, id: event.target.value }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Name"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, price: event.target.value }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Image URL"
                  value={productForm.imageUrl}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, imageUrl: event.target.value }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Category"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, category: event.target.value }))
                  }
                  isRequired
                />
                <Input
                  placeholder="Initial stock"
                  type="number"
                  min={0}
                  value={productForm.stockQuantity}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      stockQuantity: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Button mt={3} type="submit" size="sm" colorScheme="brand">
                Add product
              </Button>
            </Box>
            <VStack align="stretch" spacing={3}>
              {isProductsError ? (
                <Text color="error.600">Products could not be loaded.</Text>
              ) : null}
              {productsData?.products.map((product) => (
                <HStack key={product.id} justify="space-between">
                  <Box>
                    <Text fontWeight="bold">{product.name}</Text>
                    <Text color="neutral.600" fontSize="sm">
                      {product.category} · ${product.price.toFixed(2)}
                    </Text>
                  </Box>
                  <HStack>
                    <Badge>{product.id}</Badge>
                    <Button size="xs" variant="outline" onClick={() => deleteProduct(product.id)}>
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>

          <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
            <Heading as="h2" size="md" mb={4}>
              Inventory
            </Heading>
            <VStack align="stretch" spacing={4}>
              {isInventoryError ? (
                <Text color="error.600">Inventory could not be loaded.</Text>
              ) : null}
              {inventoryData?.inventory.map((item) => (
                <Box key={item.product.id}>
                  <HStack justify="space-between" align="end">
                    <Box>
                      <Text fontWeight="bold">{item.product.name}</Text>
                      <Text color="neutral.600" fontSize="sm">
                        {item.sku} · threshold {item.lowStockThreshold}
                      </Text>
                    </Box>
                    <HStack>
                      <Input
                        size="sm"
                        w={24}
                        type="number"
                        value={inventoryDrafts[item.product.id] ?? item.stockQuantity}
                        onChange={(event) =>
                          setInventoryDrafts((current) => ({
                            ...current,
                            [item.product.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          updateInventory({
                            productId: item.product.id,
                            stockQuantity: Number(
                              inventoryDrafts[item.product.id] ?? item.stockQuantity
                            ),
                          })
                        }
                      >
                        Save
                      </Button>
                    </HStack>
                  </HStack>
                  <Divider mt={3} />
                </Box>
              ))}
            </VStack>
          </Box>
        </Grid>

        <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={5}>
          <Heading as="h2" size="md" mb={4}>
            Users
          </Heading>
          <VStack align="stretch" spacing={3}>
            {isUsersError ? <Text color="error.600">Users could not be loaded.</Text> : null}
            {usersData?.users.map((user) => (
              <HStack key={user.id} justify="space-between">
                <Box>
                  <Text fontWeight="bold">{user.name}</Text>
                  <Text color="neutral.600" fontSize="sm">
                    {user.email}
                  </Text>
                </Box>
                <Badge colorScheme={user.role === 'admin' ? 'purple' : 'gray'}>{user.role}</Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Stack>
    </Container>
  )
}
