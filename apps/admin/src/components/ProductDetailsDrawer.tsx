import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { buildVariantMatrix } from '../catalog/variantMatrix'
import type { InventoryItem, Product } from '../types'

export interface InventoryVariantFormValues {
  sku: string
  size: string
  color: string
  stockQuantity: string
  lowStockThreshold: string
}

const emptyVariantForm: InventoryVariantFormValues = {
  color: '',
  lowStockThreshold: '5',
  size: '',
  sku: '',
  stockQuantity: '0',
}

interface ProductDetailsDrawerProps {
  inventoryDrafts: Record<string, string>
  inventoryItems: InventoryItem[]
  isInventoryError: boolean
  lowStockThresholdDrafts: Record<string, string>
  product?: Product
  onClose: () => void
  onEditProduct: (product: Product) => void
  onInventoryDraftChange: (productId: string, value: string) => void
  onCreateVariant: (input: InventoryVariantFormValues) => void
  onDeleteVariant: (sku: string) => void
  onLowStockThresholdDraftChange: (sku: string, value: string) => void
  onSaveInventory: (sku: string, stockQuantity: number, lowStockThreshold: number) => void
}

export function ProductDetailsDrawer({
  inventoryDrafts,
  inventoryItems,
  isInventoryError,
  lowStockThresholdDrafts,
  product,
  onClose,
  onEditProduct,
  onCreateVariant,
  onDeleteVariant,
  onInventoryDraftChange,
  onLowStockThresholdDraftChange,
  onSaveInventory,
}: ProductDetailsDrawerProps) {
  const [variantForm, setVariantForm] = useState(emptyVariantForm)
  const variantInputs = product
    ? buildVariantMatrix({
        ...variantForm,
        existingSkus: inventoryItems.map((item) => item.sku),
        productId: product.id,
      })
    : []

  const updateVariantForm = (field: keyof InventoryVariantFormValues, value: string) => {
    setVariantForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <Drawer isOpen={Boolean(product)} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{product?.name ?? 'Product details'}</DrawerHeader>
        <DrawerBody>
          {product ? (
            <Stack spacing={5}>
              <Image
                alt={product.name}
                aspectRatio={4 / 3}
                borderRadius="md"
                fit="cover"
                src={product.imageUrl}
              />
              <Box>
                <Text color="neutral.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                  Product
                </Text>
                <Heading as="h3" size="md">
                  {product.name}
                </Heading>
                <Text color="neutral.600" mt={2}>
                  {product.description}
                </Text>
              </Box>
              <HStack wrap="wrap">
                <Badge colorScheme="gray">{product.category}</Badge>
                <Badge colorScheme={product.isActive === false ? 'orange' : 'green'}>
                  {product.isActive === false ? 'Archived' : 'Published'}
                </Badge>
                <Badge colorScheme="blue">{product.id}</Badge>
              </HStack>
              <Box>
                <Text fontWeight="bold">Pricing</Text>
                <Text color="neutral.700">
                  ${product.price.toFixed(2)}
                  {product.compareAtPrice ? ` sale from $${product.compareAtPrice.toFixed(2)}` : ''}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Inventory
                </Text>
                {isInventoryError ? (
                  <Text color="error.600">Inventory could not be loaded.</Text>
                ) : null}
                {!isInventoryError && inventoryItems.length === 0 ? (
                  <Text color="neutral.600">No inventory record for this product.</Text>
                ) : null}
                <Stack spacing={3}>
                  {inventoryItems.map((item) => {
                    const isLowStock = item.stockQuantity <= item.lowStockThreshold
                    const stockDraftValue = inventoryDrafts[item.sku] ?? item.stockQuantity
                    const lowStockDraftValue =
                      lowStockThresholdDrafts[item.sku] ?? item.lowStockThreshold

                    return (
                      <Box
                        key={item.sku}
                        border="1px solid"
                        borderColor="neutral.200"
                        borderRadius="md"
                        data-testid={`inventory-variant-${item.sku}`}
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
                        <HStack align="end" mt={3}>
                          <Box flex="1">
                            <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                              Stock
                            </Text>
                            <Input
                              min={0}
                              size="sm"
                              type="number"
                              value={stockDraftValue}
                              onChange={(event) =>
                                onInventoryDraftChange(item.sku, event.target.value)
                              }
                            />
                          </Box>
                          <Box flex="1">
                            <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                              Low alert
                            </Text>
                            <Input
                              min={0}
                              size="sm"
                              type="number"
                              value={lowStockDraftValue}
                              onChange={(event) =>
                                onLowStockThresholdDraftChange(item.sku, event.target.value)
                              }
                            />
                          </Box>
                          <Button
                            flexShrink={0}
                            size="sm"
                            onClick={() =>
                              onSaveInventory(
                                item.sku,
                                Number(stockDraftValue),
                                Number(lowStockDraftValue)
                              )
                            }
                          >
                            Save
                          </Button>
                          <Button
                            colorScheme="red"
                            flexShrink={0}
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteVariant(item.sku)}
                          >
                            Remove
                          </Button>
                        </HStack>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Add variants
                </Text>
                <Text color="neutral.600" fontSize="sm" mb={3}>
                  Enter comma-separated sizes and colors to generate every combination.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <Box>
                    <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                      SKU prefix
                    </Text>
                    <Input
                      placeholder="OSAI-HOOD"
                      value={variantForm.sku}
                      onChange={(event) => updateVariantForm('sku', event.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                      Sizes
                    </Text>
                    <Input
                      placeholder="S, M, L"
                      value={variantForm.size}
                      onChange={(event) => updateVariantForm('size', event.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                      Colors
                    </Text>
                    <Input
                      placeholder="Black, Grey"
                      value={variantForm.color}
                      onChange={(event) => updateVariantForm('color', event.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                      Stock
                    </Text>
                    <Input
                      min={0}
                      type="number"
                      value={variantForm.stockQuantity}
                      onChange={(event) => updateVariantForm('stockQuantity', event.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text color="neutral.600" fontSize="xs" fontWeight="bold" mb={1}>
                      Low alert
                    </Text>
                    <Input
                      min={0}
                      type="number"
                      value={variantForm.lowStockThreshold}
                      onChange={(event) =>
                        updateVariantForm('lowStockThreshold', event.target.value)
                      }
                    />
                  </Box>
                </SimpleGrid>
                <Text color="neutral.600" fontSize="sm" mt={3}>
                  {variantInputs.length > 0
                    ? `${variantInputs.length} new variant${variantInputs.length === 1 ? '' : 's'} ready to add.`
                    : 'No new variants to add yet.'}
                </Text>
                <Button
                  colorScheme="brand"
                  isDisabled={variantInputs.length === 0}
                  mt={3}
                  onClick={() => {
                    variantInputs.forEach(onCreateVariant)
                    setVariantForm(emptyVariantForm)
                  }}
                >
                  Add variants
                </Button>
              </Box>
            </Stack>
          ) : null}
        </DrawerBody>
        <DrawerFooter gap={3}>
          {product ? (
            <Button variant="outline" onClick={() => onEditProduct(product)}>
              Edit product
            </Button>
          ) : null}
          <Button onClick={onClose}>Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
