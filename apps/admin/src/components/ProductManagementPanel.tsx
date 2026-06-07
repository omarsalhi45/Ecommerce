import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Image,
  Input,
  Select,
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
import type { InventoryItem, Product } from '../types'

export type ProductStockFilter = 'all' | 'in_stock' | 'low_stock' | 'missing_stock' | 'sold_out'
export type ProductStatusFilter = 'all' | 'archived' | 'published'

export const productStatusFilters: ProductStatusFilter[] = ['all', 'published', 'archived']

export const getInventorySummary = (items: InventoryItem[]) => {
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

interface ProductManagementPanelProps {
  editingProductId?: string
  inventoryByProductId: Map<string, InventoryItem[]>
  isProductsError: boolean
  productCategories: string[]
  productCategoryFilter: string
  productSearch: string
  products: Product[]
  productStatusCounts: Record<'archived' | 'published', number>
  productStatusFilter: ProductStatusFilter
  productStatusFilterIndex: number
  productStockFilter: ProductStockFilter
  visibleProducts: Product[]
  onArchiveProduct: (productId: string) => void
  onCreateProduct: () => void
  onDeleteProduct: (product: Product) => void
  onEditProduct: (product: Product) => void
  onProductCategoryFilterChange: (value: string) => void
  onProductSearchChange: (value: string) => void
  onProductStatusFilterChange: (value: ProductStatusFilter) => void
  onProductStockFilterChange: (value: ProductStockFilter) => void
  onPublishProduct: (productId: string) => void
  onSelectProduct: (productId: string) => void
}

export function ProductManagementPanel({
  editingProductId,
  inventoryByProductId,
  isProductsError,
  productCategories,
  productCategoryFilter,
  productSearch,
  products,
  productStatusCounts,
  productStatusFilter,
  productStatusFilterIndex,
  productStockFilter,
  visibleProducts,
  onArchiveProduct,
  onCreateProduct,
  onDeleteProduct,
  onEditProduct,
  onProductCategoryFilterChange,
  onProductSearchChange,
  onProductStatusFilterChange,
  onProductStockFilterChange,
  onPublishProduct,
  onSelectProduct,
}: ProductManagementPanelProps) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.200"
      borderRadius="lg"
      gridColumn={{ base: 'auto', xl: '1 / -1' }}
      p={5}
    >
      <HStack align={{ base: 'stretch', md: 'center' }} justify="space-between" mb={5}>
        <Box>
          <Heading as="h2" size="md">
            Products
          </Heading>
          <Text color="neutral.600" fontSize="sm">
            Showing {visibleProducts.length} of {products.length} products
          </Text>
        </Box>
        <Button colorScheme="brand" onClick={onCreateProduct}>
          Add product
        </Button>
      </HStack>
      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={3} mb={4}>
        <Input
          placeholder="Search product, id, category, or copy"
          value={productSearch}
          onChange={(event) => onProductSearchChange(event.target.value)}
        />
        <Select
          value={productCategoryFilter}
          onChange={(event) => onProductCategoryFilterChange(event.target.value)}
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
          onChange={(event) => onProductStockFilterChange(event.target.value as ProductStockFilter)}
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
        onChange={(index) => onProductStatusFilterChange(productStatusFilters[index] ?? 'all')}
      >
        <TabList borderBottomColor="neutral.200">
          <Tab fontWeight="bold">All {products.length}</Tab>
          <Tab fontWeight="bold">Published {productStatusCounts.published}</Tab>
          <Tab fontWeight="bold">Archived {productStatusCounts.archived}</Tab>
        </TabList>
      </Tabs>
      <VStack align="stretch" mt={4} spacing={3}>
        {isProductsError ? <Text color="error.600">Products could not be loaded.</Text> : null}
        {!isProductsError && visibleProducts.length === 0 ? (
          <Text color="neutral.600">
            {productStatusFilter === 'archived'
              ? 'No archived products yet.'
              : 'No products in this view.'}
          </Text>
        ) : null}
        {!isProductsError && visibleProducts.length > 0 ? (
          <Box
            border="1px solid"
            borderColor="neutral.100"
            borderRadius="md"
            maxH={{ base: '540px', lg: '620px' }}
            overflow="auto"
          >
            <Table size="sm">
              <Thead bg="white" position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th minW="300px">Product</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visibleProducts.map((product) => {
                  const isEditing = editingProductId === product.id
                  const isActive = product.isActive !== false
                  const productInventoryItems = inventoryByProductId.get(product.id) ?? []
                  const inventorySummary = getInventorySummary(productInventoryItems)

                  return (
                    <Tr key={product.id} opacity={isActive ? 1 : 0.72}>
                      <Td
                        borderLeft="3px solid"
                        borderLeftColor={
                          isEditing ? 'brand.500' : isActive ? 'transparent' : 'orange.300'
                        }
                      >
                        <HStack align="center" spacing={3}>
                          <Image
                            alt={product.name}
                            borderRadius="md"
                            boxSize="56px"
                            objectFit="cover"
                            src={product.imageUrl}
                          />
                          <Box minW={0}>
                            <Text fontWeight="bold" noOfLines={1}>
                              {product.name}
                            </Text>
                            <Text color="neutral.600" fontSize="xs" noOfLines={1}>
                              {product.category} - {product.id}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td whiteSpace="nowrap">
                        <Text fontWeight="semibold">${product.price.toFixed(2)}</Text>
                        {product.compareAtPrice ? (
                          <Text color="neutral.500" fontSize="xs">
                            was ${product.compareAtPrice.toFixed(2)}
                          </Text>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge colorScheme={inventorySummary.colorScheme}>
                          {inventorySummary.label}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={isActive ? 'green' : 'orange'}>
                          {isActive ? 'Published' : 'Archived'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack justify="end" spacing={2} wrap="wrap">
                          <Button
                            size="xs"
                            variant={isEditing ? 'solid' : 'outline'}
                            colorScheme={isEditing ? 'brand' : undefined}
                            onClick={() => onEditProduct(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => onSelectProduct(product.id)}
                          >
                            Details
                          </Button>
                          {isActive ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => onArchiveProduct(product.id)}
                            >
                              Archive
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => onPublishProduct(product.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => onDeleteProduct(product)}
                          >
                            Delete forever
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        ) : null}
      </VStack>
    </Box>
  )
}
