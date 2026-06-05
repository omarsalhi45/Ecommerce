import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
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
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../api/adminApi'
import { logout, selectCurrentUser } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Order, Product } from '../types'

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
  compareAtPrice: '',
  imageUrl: '',
  category: 'tees',
  sku: '',
  stockQuantity: '0',
}
const emptyImageSource = ''

interface ProductEditForm {
  readonly category: string
  readonly compareAtPrice: string
  readonly description: string
  readonly imageUrl: string
  readonly name: string
  readonly price: string
}

const getProductEditForm = (product: Product): ProductEditForm => ({
  category: product.category,
  compareAtPrice: product.compareAtPrice?.toString() ?? '',
  description: product.description,
  imageUrl: product.imageUrl,
  name: product.name,
  price: product.price.toString(),
})

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, string>>({})
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState<string | undefined>()
  const [productEditForm, setProductEditForm] = useState<ProductEditForm | undefined>()
  const [productEditError, setProductEditError] = useState<string | undefined>()
  const [externalImageUrl, setExternalImageUrl] = useState(emptyImageSource)
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
  const [deleteProduct] = useDeleteProductMutation()
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [updateInventory] = useUpdateInventoryMutation()
  const [uploadProductImage, { isLoading: isImageUploading }] = useUploadProductImageMutation()
  const hasAdminDataError =
    isAnalyticsError || isOrdersError || isProductsError || isInventoryError || isUsersError

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
    setEditingProductId(product.id)
    setProductEditForm(getProductEditForm(product))
    setProductEditError(undefined)
  }

  const cancelEditingProduct = () => {
    setEditingProductId(undefined)
    setProductEditForm(undefined)
    setProductEditError(undefined)
  }

  const updateProductEditField = (field: keyof ProductEditForm, value: string) => {
    setProductEditForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleUpdateProduct = async (productId: string) => {
    if (!productEditForm) {
      return
    }

    const price = Number(productEditForm.price)
    const compareAtPrice = productEditForm.compareAtPrice
      ? Number(productEditForm.compareAtPrice)
      : undefined

    if (!productEditForm.name.trim() || !productEditForm.description.trim()) {
      setProductEditError('Name and description are required.')
      return
    }

    if (!productEditForm.imageUrl.trim()) {
      setProductEditError('Product image URL is required.')
      return
    }

    if (Number.isNaN(price) || price < 0) {
      setProductEditError('Price must be a positive number.')
      return
    }

    if (compareAtPrice !== undefined && (Number.isNaN(compareAtPrice) || compareAtPrice <= price)) {
      setProductEditError('Original price must be higher than the current price.')
      return
    }

    try {
      await updateProduct({
        productId,
        updates: {
          category: productEditForm.category.trim(),
          compareAtPrice,
          description: productEditForm.description.trim(),
          imageUrl: productEditForm.imageUrl.trim(),
          name: productEditForm.name.trim(),
          price,
        },
      }).unwrap()
      cancelEditingProduct()
    } catch {
      setProductEditError('Product could not be updated. Check the fields and try again.')
    }
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

                if (isImageUploading) {
                  setProductFormError('Wait for the image upload to finish before saving.')
                  return
                }

                if (!productForm.imageUrl.trim()) {
                  setProductFormError('Add a product image before saving.')
                  return
                }

                try {
                  await createProduct({
                    id: productForm.id.trim(),
                    name: productForm.name.trim(),
                    description: productForm.description.trim(),
                    price: Number(productForm.price),
                    compareAtPrice: productForm.compareAtPrice
                      ? Number(productForm.compareAtPrice)
                      : undefined,
                    imageUrl: productForm.imageUrl.trim(),
                    category: productForm.category.trim(),
                    sku: productForm.sku.trim() || undefined,
                    stockQuantity: Number(productForm.stockQuantity),
                  }).unwrap()
                  setProductForm(emptyProductForm)
                  setExternalImageUrl(emptyImageSource)
                  setProductFormError(undefined)
                  setImageStatus(undefined)
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
                    placeholder="39.00"
                    type="number"
                    min={0}
                    step="0.01"
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
                    placeholder="59.00"
                    type="number"
                    min={0}
                    step="0.01"
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
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      pt={1}
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
                <FormControl>
                  <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                    Initial stock
                  </FormLabel>
                  <Input
                    placeholder="0"
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
                </FormControl>
              </Grid>
              <Button
                mt={3}
                type="submit"
                size="sm"
                colorScheme="brand"
                isDisabled={isImageUploading || isCreatingProduct}
                isLoading={isImageUploading || isCreatingProduct}
                loadingText={isImageUploading ? 'Uploading image' : 'Saving product'}
              >
                Add product
              </Button>
            </Box>
            <VStack align="stretch" spacing={3}>
              {isProductsError ? (
                <Text color="error.600">Products could not be loaded.</Text>
              ) : null}
              {productsData?.products.map((product) => {
                const isEditing = editingProductId === product.id

                return (
                  <Box
                    key={product.id}
                    border="1px solid"
                    borderColor={isEditing ? 'neutral.300' : 'neutral.100'}
                    borderRadius="md"
                    p={3}
                  >
                    <HStack justify="space-between" align="start">
                      <Box>
                        <Text fontWeight="bold">{product.name}</Text>
                        <Text color="neutral.600" fontSize="sm">
                          {product.category} · ${product.price.toFixed(2)}
                          {product.compareAtPrice
                            ? ` sale from $${product.compareAtPrice.toFixed(2)}`
                            : ''}
                        </Text>
                      </Box>
                      <HStack>
                        <Badge>{product.id}</Badge>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => startEditingProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </HStack>

                    {isEditing && productEditForm ? (
                      <Box mt={4}>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                          <FormControl isRequired>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Name
                            </FormLabel>
                            <Input
                              value={productEditForm.name}
                              onChange={(event) =>
                                updateProductEditField('name', event.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Category
                            </FormLabel>
                            <Input
                              value={productEditForm.category}
                              onChange={(event) =>
                                updateProductEditField('category', event.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Price
                            </FormLabel>
                            <Input
                              min={0}
                              step="0.01"
                              type="number"
                              value={productEditForm.price}
                              onChange={(event) =>
                                updateProductEditField('price', event.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Original price
                            </FormLabel>
                            <Input
                              min={0}
                              step="0.01"
                              type="number"
                              value={productEditForm.compareAtPrice}
                              onChange={(event) =>
                                updateProductEditField('compareAtPrice', event.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }} isRequired>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Image URL
                            </FormLabel>
                            <Input
                              value={productEditForm.imageUrl}
                              onChange={(event) =>
                                updateProductEditField('imageUrl', event.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }} isRequired>
                            <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                              Description
                            </FormLabel>
                            <Input
                              value={productEditForm.description}
                              onChange={(event) =>
                                updateProductEditField('description', event.target.value)
                              }
                            />
                          </FormControl>
                        </Grid>

                        {productEditError ? (
                          <Alert status="error" borderRadius="md" mt={3}>
                            <AlertIcon />
                            {productEditError}
                          </Alert>
                        ) : null}

                        <HStack mt={3}>
                          <Button
                            colorScheme="brand"
                            isLoading={isUpdatingProduct}
                            size="sm"
                            onClick={() => handleUpdateProduct(product.id)}
                          >
                            Save changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingProduct}>
                            Cancel
                          </Button>
                        </HStack>
                      </Box>
                    ) : null}
                  </Box>
                )
              })}
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
