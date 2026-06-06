import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Image,
  Input,
  Select,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  Table,
  Tabs,
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
  useDeleteProductPermanentlyMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useUpdateInventoryMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useUploadProductImageMutation,
} from '../api/adminApi'
import { logout, selectCurrentUser } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { InventoryItem, Order, Product } from '../types'

const orderStatuses: Order['status'][] = ['pending', 'shipped', 'delivered', 'cancelled']
const orderStatusColorSchemes: Record<Order['status'], string> = {
  cancelled: 'red',
  delivered: 'green',
  pending: 'yellow',
  shipped: 'blue',
}
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
type OrderStatusFilter = 'all' | Order['status']
type PaymentStatusFilter = 'all' | Order['paymentStatus']
type ProductStockFilter = 'all' | 'in_stock' | 'low_stock' | 'missing_stock' | 'sold_out'
const paymentStatuses = Object.keys(paymentStatusLabels) as Order['paymentStatus'][]
const emptyProductForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  imageUrl: '',
  category: 'tees',
  sku: '',
  stockQuantity: '0',
}
const emptyImageSource = ''
type ProductStatusFilter = 'all' | 'archived' | 'published'
const productStatusFilters: ProductStatusFilter[] = ['all', 'published', 'archived']
const recentOrderLimit = 25

const formatOrderDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const getOrderItemCount = (order: Order) =>
  order.items.reduce((total, item) => total + item.quantity, 0)

const getInventorySummary = (items: InventoryItem[]) => {
  const totalStock = items.reduce((total, item) => total + item.stockQuantity, 0)
  const isLowStock = items.some((item) => item.stockQuantity <= item.lowStockThreshold)

  if (items.length === 0) {
    return {
      colorScheme: 'gray',
      label: 'No stock record',
      state: 'missing_stock' as ProductStockFilter,
      totalStock,
    }
  }

  if (totalStock === 0) {
    return {
      colorScheme: 'red',
      label: 'Sold out',
      state: 'sold_out' as ProductStockFilter,
      totalStock,
    }
  }

  return {
    colorScheme: isLowStock ? 'yellow' : 'green',
    label: `${totalStock} in stock`,
    state: isLowStock ? ('low_stock' as ProductStockFilter) : ('in_stock' as ProductStockFilter),
    totalStock,
  }
}

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, string>>({})
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState<string | undefined>()
  const [isProductEditorOpen, setProductEditorOpen] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStockFilter, setProductStockFilter] = useState<ProductStockFilter>('all')
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>()
  const [externalImageUrl, setExternalImageUrl] = useState(emptyImageSource)
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatusFilter>('all')
  const [productFormError, setProductFormError] = useState<string | undefined>()
  const [imageStatus, setImageStatus] = useState<string | undefined>()
  const canLoadAdminData = currentUser?.role === 'admin'
  const {
    data: analytics,
    isError: isAnalyticsError,
    isLoading: isAnalyticsLoading,
  } = useGetAdminAnalyticsQuery(undefined, { skip: !canLoadAdminData })
  const { data: ordersData, isError: isOrdersError } = useGetAdminOrdersQuery(undefined, {
    pollingInterval: canLoadAdminData ? 5000 : 0,
    skip: !canLoadAdminData,
  })
  const { data: productsData, isError: isProductsError } = useGetAdminProductsQuery(undefined, {
    skip: !canLoadAdminData,
  })
  const { data: inventoryData, isError: isInventoryError } = useGetAdminInventoryQuery(undefined, {
    skip: !canLoadAdminData,
  })
  const { data: usersData, isError: isUsersError } = useGetAdminUsersQuery(undefined, {
    skip: !canLoadAdminData,
  })
  const [createProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation()
  const [archiveProduct] = useDeleteProductMutation()
  const [deleteProductPermanently] = useDeleteProductPermanentlyMutation()
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation()
  const [updateProductStatus] = useUpdateProductStatusMutation()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [updateInventory] = useUpdateInventoryMutation()
  const [uploadProductImage, { isLoading: isImageUploading }] = useUploadProductImageMutation()
  const hasAdminDataError =
    isAnalyticsError || isOrdersError || isProductsError || isInventoryError || isUsersError
  const isEditingProduct = Boolean(editingProductId)
  const isSavingProduct = isImageUploading || isCreatingProduct || isUpdatingProduct
  const orders = ordersData?.orders ?? []
  const products = productsData?.products ?? []
  const inventoryItems = inventoryData?.inventory ?? []
  const inventoryByProductId = inventoryItems.reduce((itemsByProductId, item) => {
    const productItems = itemsByProductId.get(item.product.id) ?? []
    productItems.push(item)
    itemsByProductId.set(item.product.id, productItems)
    return itemsByProductId
  }, new Map<string, InventoryItem[]>())
  const selectedProduct = selectedProductId
    ? products.find((product) => product.id === selectedProductId)
    : undefined
  const selectedProductInventory = selectedProduct
    ? (inventoryByProductId.get(selectedProduct.id) ?? [])
    : []
  const editingProductInventoryItem = editingProductId
    ? inventoryByProductId.get(editingProductId)?.[0]
    : undefined
  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId)
    : undefined
  const normalizedOrderSearch = orderSearch.trim().toLowerCase()
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter
    const matchesPayment =
      paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter
    const searchableText = [
      order.id,
      order.customer.email,
      order.customer.firstName,
      order.customer.lastName,
      order.customer.phone,
      order.shippingAddress.city,
      order.shippingAddress.country,
      order.shippingAddress.postalCode,
      ...order.items.flatMap((item) => [item.name, item.productId]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch =
      normalizedOrderSearch.length === 0 || searchableText.includes(normalizedOrderSearch)

    return matchesStatus && matchesPayment && matchesSearch
  })
  const visibleOrders = filteredOrders.slice(0, recentOrderLimit)
  const hasMoreOrders = filteredOrders.length > visibleOrders.length
  const productCategories = Array.from(new Set(products.map((product) => product.category))).sort()
  const normalizedProductSearch = productSearch.trim().toLowerCase()
  const productStatusCounts = products.reduce(
    (counts, product) => {
      if (product.isActive === false) {
        counts.archived += 1
        return counts
      }

      counts.published += 1
      return counts
    },
    { archived: 0, published: 0 }
  )
  const visibleProducts = products.filter((product) => {
    if (productStatusFilter === 'archived') {
      if (product.isActive !== false) {
        return false
      }
    }

    if (productStatusFilter === 'published') {
      if (product.isActive === false) {
        return false
      }
    }

    const productInventoryItems = inventoryByProductId.get(product.id) ?? []
    const inventorySummary = getInventorySummary(productInventoryItems)
    const matchesCategory =
      productCategoryFilter === 'all' || product.category === productCategoryFilter
    const matchesStock =
      productStockFilter === 'all' || inventorySummary.state === productStockFilter
    const matchesSearch =
      normalizedProductSearch.length === 0 ||
      [product.name, product.id, product.category, product.description]
        .join(' ')
        .toLowerCase()
        .includes(normalizedProductSearch)

    return matchesCategory && matchesStock && matchesSearch
  })
  const productStatusFilterIndex = productStatusFilters.indexOf(productStatusFilter)

  const handleProductImageChange = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setProductFormError(undefined)
    setImageStatus(undefined)

    try {
      const upload = await uploadProductImage(file).unwrap()
      setExternalImageUrl(emptyImageSource)
      setProductForm((current) => ({ ...current, imageUrl: upload.imageUrl }))
      setImageStatus('Uploaded image ready.')
    } catch {
      setProductForm((current) => ({ ...current, imageUrl: '' }))
      setProductFormError('Image upload failed. Try a JPG, PNG, WebP, or GIF under 2 MB.')
    }
  }

  const handleExternalImageUrlChange = (value: string) => {
    setProductFormError(undefined)
    setImageStatus(undefined)

    if (value.trim().startsWith('data:')) {
      setProductFormError('Paste a normal https image link, or use upload for image files.')
      return
    }

    setExternalImageUrl(value)
    setProductForm((current) => ({ ...current, imageUrl: value.trim() }))
    setImageStatus(value.trim() ? 'External image ready.' : undefined)
  }

  const startEditingProduct = (product: Product) => {
    const productInventoryItem = inventoryByProductId.get(product.id)?.[0]
    setEditingProductId(product.id)
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() ?? '',
      imageUrl: product.imageUrl,
      category: product.category,
      sku: '',
      stockQuantity: productInventoryItem?.stockQuantity.toString() ?? '0',
    })
    setExternalImageUrl(product.imageUrl)
    setProductFormError(undefined)
    setImageStatus('Editing existing image.')
    setSelectedProductId(undefined)
    setProductEditorOpen(true)
  }

  const cancelEditingProduct = () => {
    setEditingProductId(undefined)
    setProductForm(emptyProductForm)
    setExternalImageUrl(emptyImageSource)
    setProductFormError(undefined)
    setImageStatus(undefined)
    setProductEditorOpen(false)
  }

  const startCreatingProduct = () => {
    setEditingProductId(undefined)
    setProductForm(emptyProductForm)
    setExternalImageUrl(emptyImageSource)
    setProductFormError(undefined)
    setImageStatus(undefined)
    setProductEditorOpen(true)
  }

  const handlePermanentProductDelete = (product: Product) => {
    const confirmed = window.confirm(
      `Delete ${product.name} forever? This removes the product, inventory, reviews, and cart references.`
    )

    if (!confirmed) {
      return
    }

    if (editingProductId === product.id) {
      cancelEditingProduct()
    }

    deleteProductPermanently(product.id)
  }

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
              onChange={(event) => setOrderSearch(event.target.value)}
            />
            <Select
              value={orderStatusFilter}
              onChange={(event) => setOrderStatusFilter(event.target.value as OrderStatusFilter)}
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
                setPaymentStatusFilter(event.target.value as PaymentStatusFilter)
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
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
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

        <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6}>
          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            gridColumn={{ base: 'auto', xl: '1 / -1' }}
            p={5}
          >
            <Heading as="h2" size="md" mb={4}>
              Products
            </Heading>
            <Button mb={5} colorScheme="brand" onClick={startCreatingProduct}>
              Add product
            </Button>
            <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={3} mb={4}>
              <Input
                placeholder="Search product, id, category, or copy"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
              <Select
                value={productCategoryFilter}
                onChange={(event) => setProductCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                value={productStockFilter}
                onChange={(event) =>
                  setProductStockFilter(event.target.value as ProductStockFilter)
                }
              >
                <option value="all">All stock</option>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="sold_out">Sold out</option>
                <option value="missing_stock">No stock record</option>
              </Select>
            </Grid>
            <Tabs
              index={productStatusFilterIndex}
              onChange={(index) => setProductStatusFilter(productStatusFilters[index] ?? 'all')}
            >
              <TabList borderBottomColor="neutral.200" overflowX="auto">
                <Tab fontWeight="bold">All {products.length}</Tab>
                <Tab fontWeight="bold">Published {productStatusCounts.published}</Tab>
                <Tab fontWeight="bold">Archived {productStatusCounts.archived}</Tab>
              </TabList>
            </Tabs>
            <VStack align="stretch" mt={4} spacing={3}>
              <Text color="neutral.600" fontSize="sm">
                Showing {visibleProducts.length} of {products.length} products
              </Text>
              {isProductsError ? (
                <Text color="error.600">Products could not be loaded.</Text>
              ) : null}
              {!isProductsError && visibleProducts.length === 0 ? (
                <Text color="neutral.600">
                  {productStatusFilter === 'archived'
                    ? 'No archived products yet.'
                    : 'No products in this view.'}
                </Text>
              ) : null}
              {visibleProducts.map((product) => {
                const isEditing = editingProductId === product.id
                const isActive = product.isActive !== false
                const productInventoryItems = inventoryByProductId.get(product.id) ?? []
                const inventorySummary = getInventorySummary(productInventoryItems)

                return (
                  <Box
                    key={product.id}
                    border="1px solid"
                    borderColor={
                      isEditing ? 'neutral.300' : isActive ? 'neutral.100' : 'orange.200'
                    }
                    borderRadius="md"
                    opacity={isActive ? 1 : 0.72}
                    p={4}
                  >
                    <Stack
                      align={{ base: 'stretch', md: 'start' }}
                      direction={{ base: 'column', md: 'row' }}
                      justify="space-between"
                      spacing={4}
                    >
                      <Box minW={0}>
                        <HStack align="start" spacing={2} wrap="wrap">
                          <Text fontWeight="bold">{product.name}</Text>
                          <Badge colorScheme={isActive ? 'green' : 'orange'}>
                            {isActive ? 'Published' : 'Archived'}
                          </Badge>
                          <Badge colorScheme={inventorySummary.colorScheme}>
                            {inventorySummary.label}
                          </Badge>
                        </HStack>
                        <Text color="neutral.600" fontSize="sm">
                          {product.category} - ${product.price.toFixed(2)} - {product.id}
                          {product.compareAtPrice
                            ? ` sale from $${product.compareAtPrice.toFixed(2)}`
                            : ''}
                        </Text>
                      </Box>
                      <HStack justify={{ base: 'start', md: 'end' }} spacing={2} wrap="wrap">
                        <Button
                          size="xs"
                          variant={isEditing ? 'solid' : 'outline'}
                          colorScheme={isEditing ? 'brand' : undefined}
                          onClick={() => startEditingProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          Details
                        </Button>
                        {isActive ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => archiveProduct(product.id)}
                          >
                            Archive
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              updateProductStatus({ productId: product.id, isActive: true })
                            }
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => handlePermanentProductDelete(product)}
                        >
                          Delete forever
                        </Button>
                      </HStack>
                    </Stack>
                  </Box>
                )
              })}
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

      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(undefined)}
        placement="right"
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedOrder?.id ?? 'Order details'}</DrawerHeader>
          <DrawerBody>
            {selectedOrder ? (
              <Stack spacing={5}>
                <HStack align="start" justify="space-between">
                  <Box>
                    <Text
                      color="neutral.500"
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      Placed
                    </Text>
                    <Text fontWeight="bold">{formatOrderDate(selectedOrder.createdAt)}</Text>
                  </Box>
                  <Stack align="end" spacing={2}>
                    <Badge colorScheme={paymentStatusColorSchemes[selectedOrder.paymentStatus]}>
                      {paymentStatusLabels[selectedOrder.paymentStatus]}
                    </Badge>
                    <Badge colorScheme={orderStatusColorSchemes[selectedOrder.status]}>
                      {selectedOrder.status}
                    </Badge>
                  </Stack>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box border="1px solid" borderColor="neutral.200" borderRadius="md" p={4}>
                    <Text fontWeight="bold" mb={2}>
                      Customer
                    </Text>
                    <Text>
                      {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                    </Text>
                    <Text color="neutral.600">{selectedOrder.customer.email}</Text>
                    {selectedOrder.customer.phone ? (
                      <Text color="neutral.600">{selectedOrder.customer.phone}</Text>
                    ) : null}
                  </Box>
                  <Box border="1px solid" borderColor="neutral.200" borderRadius="md" p={4}>
                    <Text fontWeight="bold" mb={2}>
                      Shipping
                    </Text>
                    <Text>{selectedOrder.shippingAddress.line1}</Text>
                    {selectedOrder.shippingAddress.line2 ? (
                      <Text>{selectedOrder.shippingAddress.line2}</Text>
                    ) : null}
                    <Text color="neutral.600">
                      {selectedOrder.shippingAddress.city}
                      {selectedOrder.shippingAddress.state
                        ? `, ${selectedOrder.shippingAddress.state}`
                        : ''}{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </Text>
                    <Text color="neutral.600">{selectedOrder.shippingAddress.country}</Text>
                  </Box>
                </Grid>

                <Box>
                  <Text fontWeight="bold" mb={3}>
                    Items
                  </Text>
                  <Stack spacing={3}>
                    {selectedOrder.items.map((item) => (
                      <HStack
                        key={`${selectedOrder.id}-${item.productId}`}
                        border="1px solid"
                        borderColor="neutral.200"
                        borderRadius="md"
                        justify="space-between"
                        p={3}
                      >
                        <Box>
                          <Text fontWeight="bold">{item.name}</Text>
                          <Text color="neutral.600" fontSize="sm">
                            {item.productId} - Qty {item.quantity} - ${item.unitPrice.toFixed(2)}
                          </Text>
                        </Box>
                        <Text fontWeight="bold">${item.lineTotal.toFixed(2)}</Text>
                      </HStack>
                    ))}
                  </Stack>
                </Box>

                <Box border="1px solid" borderColor="neutral.200" borderRadius="md" p={4}>
                  <Text fontWeight="bold" mb={3}>
                    Totals
                  </Text>
                  <Stack spacing={2}>
                    <HStack justify="space-between">
                      <Text color="neutral.600">Subtotal</Text>
                      <Text>${selectedOrder.totals.subtotal.toFixed(2)}</Text>
                    </HStack>
                    {selectedOrder.totals.discount ? (
                      <HStack justify="space-between">
                        <Text color="neutral.600">
                          Discount
                          {selectedOrder.discount ? ` (${selectedOrder.discount.code})` : ''}
                        </Text>
                        <Text>-${selectedOrder.totals.discount.toFixed(2)}</Text>
                      </HStack>
                    ) : null}
                    <HStack justify="space-between">
                      <Text color="neutral.600">Shipping</Text>
                      <Text>${selectedOrder.totals.shipping.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="neutral.600">Tax</Text>
                      <Text>${selectedOrder.totals.tax.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between" fontWeight="bold">
                      <Text>Total</Text>
                      <Text>${selectedOrder.totals.total.toFixed(2)}</Text>
                    </HStack>
                  </Stack>
                </Box>

                <FormControl>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Order status
                  </FormLabel>
                  <Select
                    value={selectedOrder.status}
                    onChange={(event) =>
                      updateOrderStatus({
                        orderId: selectedOrder.id,
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
                </FormControl>
              </Stack>
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={() => setSelectedOrderId(undefined)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={isProductEditorOpen}
        onClose={cancelEditingProduct}
        placement="right"
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {isEditingProduct ? `Edit ${productForm.name || editingProductId}` : 'Add product'}
          </DrawerHeader>
          <DrawerBody>
            {isEditingProduct ? (
              <Alert status="info" borderRadius="md" mb={4}>
                <AlertIcon />
                Save product details and stock from one place.
              </Alert>
            ) : null}
            <Box
              as="form"
              id="product-editor-form"
              onSubmit={async (event: FormEvent<HTMLDivElement>) => {
                event.preventDefault()

                if (isImageUploading) {
                  setProductFormError('Wait for the image upload to finish before saving.')
                  return
                }

                if (!productForm.imageUrl.trim()) {
                  setProductFormError('Add a product image before saving.')
                  return
                }

                if (!productForm.name.trim() || !productForm.description.trim()) {
                  setProductFormError('Name and description are required.')
                  return
                }

                const price = Number(productForm.price)
                const compareAtPrice = productForm.compareAtPrice
                  ? Number(productForm.compareAtPrice)
                  : undefined
                const stockQuantity = Number(productForm.stockQuantity)

                if (Number.isNaN(price) || price < 0) {
                  setProductFormError('Price must be a positive number.')
                  return
                }

                if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
                  setProductFormError('Stock must be zero or higher.')
                  return
                }

                if (
                  compareAtPrice !== undefined &&
                  (Number.isNaN(compareAtPrice) || compareAtPrice <= price)
                ) {
                  setProductFormError('Original price must be higher than the current price.')
                  return
                }

                try {
                  if (editingProductId) {
                    await updateProduct({
                      productId: editingProductId,
                      updates: {
                        category: productForm.category.trim(),
                        compareAtPrice,
                        description: productForm.description.trim(),
                        imageUrl: productForm.imageUrl.trim(),
                        name: productForm.name.trim(),
                        price,
                      },
                    }).unwrap()
                    if (editingProductInventoryItem) {
                      await updateInventory({
                        productId: editingProductId,
                        stockQuantity,
                      }).unwrap()
                    }
                  } else {
                    await createProduct({
                      id: productForm.id.trim(),
                      name: productForm.name.trim(),
                      description: productForm.description.trim(),
                      price,
                      compareAtPrice,
                      imageUrl: productForm.imageUrl.trim(),
                      category: productForm.category.trim(),
                      sku: productForm.sku.trim() || undefined,
                      stockQuantity,
                    }).unwrap()
                  }
                  setProductForm(emptyProductForm)
                  setEditingProductId(undefined)
                  setExternalImageUrl(emptyImageSource)
                  setProductFormError(undefined)
                  setImageStatus(undefined)
                  setProductEditorOpen(false)
                } catch {
                  setProductFormError('Product could not be saved. Check the fields and try again.')
                }
              }}
            >
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                <FormControl isRequired>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Product id
                  </FormLabel>
                  <Input
                    placeholder="black-tee"
                    isDisabled={isEditingProduct}
                    value={productForm.id}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, id: event.target.value }))
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Name
                  </FormLabel>
                  <Input
                    placeholder="Oversized tee"
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Price
                  </FormLabel>
                  <Input
                    min={0}
                    placeholder="39.00"
                    step="0.01"
                    type="number"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Original price
                  </FormLabel>
                  <Input
                    min={0}
                    placeholder="59.00"
                    step="0.01"
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        compareAtPrice: event.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Category
                  </FormLabel>
                  <Input
                    placeholder="tees"
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    {isEditingProduct ? 'Stock' : 'Initial stock'}
                  </FormLabel>
                  <Input
                    min={0}
                    placeholder="0"
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        stockQuantity: event.target.value,
                      }))
                    }
                  />
                  {isEditingProduct && !editingProductInventoryItem ? (
                    <Text color="neutral.500" fontSize="xs" mt={1}>
                      This product has no inventory record yet.
                    </Text>
                  ) : null}
                </FormControl>
                <FormControl
                  gridColumn={{ base: 'auto', md: '1 / -1' }}
                  isInvalid={Boolean(productFormError)}
                >
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Product image
                  </FormLabel>
                  <Stack spacing={3}>
                    {productForm.imageUrl ? (
                      <HStack
                        align="center"
                        border="1px solid"
                        borderColor="neutral.200"
                        borderRadius="md"
                        p={3}
                        spacing={3}
                      >
                        <Image
                          alt="Product image preview"
                          borderRadius="md"
                          boxSize="64px"
                          fallbackSrc=""
                          fit="cover"
                          src={productForm.imageUrl}
                        />
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {imageStatus ?? 'Image ready.'}
                          </Text>
                          <Text color="neutral.500" fontSize="xs">
                            This is the image that will be saved with the product.
                          </Text>
                        </Box>
                      </HStack>
                    ) : (
                      <Text color="neutral.500" fontSize="sm">
                        Upload one image, or paste one normal image link.
                      </Text>
                    )}
                    <Input
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      pt={1}
                      type="file"
                      onChange={(event) => {
                        handleProductImageChange(event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                    <Input
                      placeholder="https://example.com/product.jpg"
                      value={externalImageUrl}
                      onChange={(event) => handleExternalImageUrlChange(event.target.value)}
                    />
                    <FormErrorMessage>{productFormError}</FormErrorMessage>
                  </Stack>
                </FormControl>
                <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }} isRequired>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Description
                  </FormLabel>
                  <Input
                    placeholder="Short product description"
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </FormControl>
                {!isEditingProduct ? (
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      SKU
                    </FormLabel>
                    <Input
                      placeholder="OSAI-TEE-BLK"
                      value={productForm.sku}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, sku: event.target.value }))
                      }
                    />
                  </FormControl>
                ) : null}
              </Grid>
            </Box>
          </DrawerBody>
          <DrawerFooter gap={3}>
            <Button variant="outline" onClick={cancelEditingProduct}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              form="product-editor-form"
              isDisabled={isSavingProduct}
              isLoading={isSavingProduct}
              loadingText={isImageUploading ? 'Uploading image' : 'Saving product'}
              type="submit"
            >
              {isEditingProduct ? 'Save changes' : 'Add product'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProductId(undefined)}
        placement="right"
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedProduct?.name ?? 'Product details'}</DrawerHeader>
          <DrawerBody>
            {selectedProduct ? (
              <Stack spacing={5}>
                <Image
                  alt={selectedProduct.name}
                  aspectRatio={4 / 3}
                  borderRadius="md"
                  fit="cover"
                  src={selectedProduct.imageUrl}
                />
                <Box>
                  <Text
                    color="neutral.500"
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                  >
                    Product
                  </Text>
                  <Heading as="h3" size="md">
                    {selectedProduct.name}
                  </Heading>
                  <Text color="neutral.600" mt={2}>
                    {selectedProduct.description}
                  </Text>
                </Box>
                <HStack wrap="wrap">
                  <Badge colorScheme="gray">{selectedProduct.category}</Badge>
                  <Badge colorScheme={selectedProduct.isActive === false ? 'orange' : 'green'}>
                    {selectedProduct.isActive === false ? 'Archived' : 'Published'}
                  </Badge>
                  <Badge colorScheme="blue">{selectedProduct.id}</Badge>
                </HStack>
                <Box>
                  <Text fontWeight="bold">Pricing</Text>
                  <Text color="neutral.700">
                    ${selectedProduct.price.toFixed(2)}
                    {selectedProduct.compareAtPrice
                      ? ` sale from $${selectedProduct.compareAtPrice.toFixed(2)}`
                      : ''}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={3}>
                    Inventory
                  </Text>
                  {isInventoryError ? (
                    <Text color="error.600">Inventory could not be loaded.</Text>
                  ) : null}
                  {!isInventoryError && selectedProductInventory.length === 0 ? (
                    <Text color="neutral.600">No inventory record for this product.</Text>
                  ) : null}
                  <Stack spacing={3}>
                    {selectedProductInventory.map((item) => {
                      const isLowStock = item.stockQuantity <= item.lowStockThreshold

                      return (
                        <Box
                          key={item.sku}
                          border="1px solid"
                          borderColor="neutral.200"
                          borderRadius="md"
                          p={3}
                        >
                          <HStack align="start" justify="space-between">
                            <Box>
                              <Text fontWeight="bold">{item.sku}</Text>
                              <Text color="neutral.600" fontSize="sm">
                                {[item.size, item.color].filter(Boolean).join(' / ') ||
                                  'Default variant'}
                              </Text>
                              <Text color="neutral.600" fontSize="sm">
                                Low threshold {item.lowStockThreshold}
                              </Text>
                            </Box>
                            <Badge colorScheme={isLowStock ? 'yellow' : 'green'}>
                              {item.stockQuantity} stock
                            </Badge>
                          </HStack>
                          <HStack mt={3}>
                            <Input
                              min={0}
                              size="sm"
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
                              flexShrink={0}
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
                              Save stock
                            </Button>
                          </HStack>
                        </Box>
                      )
                    })}
                  </Stack>
                </Box>
              </Stack>
            ) : null}
          </DrawerBody>
          <DrawerFooter gap={3}>
            {selectedProduct ? (
              <Button variant="outline" onClick={() => startEditingProduct(selectedProduct)}>
                Edit product
              </Button>
            ) : null}
            <Button onClick={() => setSelectedProductId(undefined)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Container>
  )
}
