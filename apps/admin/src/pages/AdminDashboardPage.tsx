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
  Text,
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
import {
  type OrderStatusFilter,
  OrdersPanel,
  type PaymentStatusFilter,
  formatOrderDate,
  orderStatusColorSchemes,
  orderStatuses,
  paymentStatusColorSchemes,
  paymentStatusLabels,
  recentOrderLimit,
} from '../components/OrdersPanel'
import { ProductEditorDrawer, type ProductFormValues } from '../components/ProductEditorDrawer'
import {
  ProductManagementPanel,
  type ProductStatusFilter,
  type ProductStockFilter,
  getInventorySummary,
  productStatusFilters,
} from '../components/ProductManagementPanel'
import { logout, selectCurrentUser } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { InventoryItem, Order, Product } from '../types'

const emptyProductForm: ProductFormValues = {
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

  const updateProductFormField = (field: keyof ProductFormValues, value: string) => {
    setProductForm((current) => ({ ...current, [field]: value }))
  }

  const handleProductFormSubmit = async (event: FormEvent<HTMLDivElement>) => {
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

    if (compareAtPrice !== undefined && (Number.isNaN(compareAtPrice) || compareAtPrice <= price)) {
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

        <OrdersPanel
          filteredOrders={filteredOrders}
          hasMoreOrders={hasMoreOrders}
          isOrdersError={isOrdersError}
          orders={orders}
          orderSearch={orderSearch}
          orderStatusFilter={orderStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          visibleOrders={visibleOrders}
          onOrderSearchChange={setOrderSearch}
          onOrderStatusFilterChange={setOrderStatusFilter}
          onPaymentStatusFilterChange={setPaymentStatusFilter}
          onSelectOrder={setSelectedOrderId}
        />

        <ProductManagementPanel
          editingProductId={editingProductId}
          inventoryByProductId={inventoryByProductId}
          isProductsError={isProductsError}
          productCategories={productCategories}
          productCategoryFilter={productCategoryFilter}
          productSearch={productSearch}
          products={products}
          productStatusCounts={productStatusCounts}
          productStatusFilter={productStatusFilter}
          productStatusFilterIndex={productStatusFilterIndex}
          productStockFilter={productStockFilter}
          visibleProducts={visibleProducts}
          onArchiveProduct={(productId) => archiveProduct(productId)}
          onCreateProduct={startCreatingProduct}
          onDeleteProduct={handlePermanentProductDelete}
          onEditProduct={startEditingProduct}
          onProductCategoryFilterChange={setProductCategoryFilter}
          onProductSearchChange={setProductSearch}
          onProductStatusFilterChange={setProductStatusFilter}
          onProductStockFilterChange={setProductStockFilter}
          onPublishProduct={(productId) =>
            updateProductStatus({
              productId,
              isActive: true,
            })
          }
          onSelectProduct={setSelectedProductId}
        />

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
                          {[item.size, item.color].filter(Boolean).length > 0 ? (
                            <Text color="neutral.600" fontSize="sm" fontWeight="semibold">
                              {[item.size, item.color].filter(Boolean).join(' / ')}
                            </Text>
                          ) : null}
                          <Text color="neutral.600" fontSize="sm">
                            {[item.productId, item.variantSku].filter(Boolean).join(' - ')}
                            {' - '}Qty {item.quantity} - ${item.unitPrice.toFixed(2)}
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

      <ProductEditorDrawer
        editingProductId={editingProductId}
        externalImageUrl={externalImageUrl}
        hasEditingInventoryItem={Boolean(editingProductInventoryItem)}
        imageStatus={imageStatus}
        isEditingProduct={isEditingProduct}
        isImageUploading={isImageUploading}
        isOpen={isProductEditorOpen}
        isSavingProduct={isSavingProduct}
        productForm={productForm}
        productFormError={productFormError}
        onCancel={cancelEditingProduct}
        onExternalImageUrlChange={handleExternalImageUrlChange}
        onFieldChange={updateProductFormField}
        onImageChange={handleProductImageChange}
        onSubmit={handleProductFormSubmit}
      />

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
