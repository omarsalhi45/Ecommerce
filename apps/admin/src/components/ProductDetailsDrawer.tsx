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
import { productColorOptions, productSizeOptions } from '../catalog/variantOptions'
import type { InventoryItem, Product } from '../types'
import { VariantValueList } from './VariantValueList'

export interface InventoryVariantFormValues {
  sku: string
  sizeDraft: string
  colorDraft: string
  sizes: string[]
  colors: string[]
  stockQuantity: string
  lowStockThreshold: string
}

export interface InventoryVariantCreateInput {
  color: string
  lowStockThreshold: string
  size: string
  sku: string
  stockQuantity: string
}

const emptyVariantForm: InventoryVariantFormValues = {
  colorDraft: '',
  colors: [],
  lowStockThreshold: '5',
  sizeDraft: '',
  sizes: [],
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
  onCreateVariant: (input: InventoryVariantCreateInput) => void
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
        color: variantForm.colors,
        existingSkus: inventoryItems.map((item) => item.sku),
        productId: product.id,
        size: variantForm.sizes,
      })
    : []

  const updateVariantForm = (
    field: Exclude<keyof InventoryVariantFormValues, 'colors' | 'sizes'>,
    value: string
  ) => {
    setVariantForm((current) => ({ ...current, [field]: value }))
  }

  const addVariantValue = (field: 'colors' | 'sizes') => {
    const draftField = field === 'sizes' ? 'sizeDraft' : 'colorDraft'
    const nextValue = variantForm[draftField].trim()

    if (!nextValue) {
      return
    }

    setVariantForm((current) => ({
      ...current,
      [draftField]: '',
      [field]: Array.from(new Set([...current[field], nextValue])),
    }))
  }

  const removeVariantValue = (field: 'colors' | 'sizes', value: string) => {
    setVariantForm((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }))
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
                  Add sizes and colors to generate every combination.
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
                  <VariantValueList
                    addButtonLabel="Add size"
                    emptyLabel="No sizes added yet."
                    inputLabel="Sizes"
                    options={productSizeOptions}
                    placeholder="Choose size"
                    value={variantForm.sizeDraft}
                    values={variantForm.sizes}
                    onAdd={() => addVariantValue('sizes')}
                    onChange={(value) => updateVariantForm('sizeDraft', value)}
                    onRemove={(value) => removeVariantValue('sizes', value)}
                  />
                  <VariantValueList
                    addButtonLabel="Add color"
                    emptyLabel="No colors added yet."
                    inputLabel="Colors"
                    options={productColorOptions}
                    placeholder="Choose color"
                    value={variantForm.colorDraft}
                    values={variantForm.colors}
                    onAdd={() => addVariantValue('colors')}
                    onChange={(value) => updateVariantForm('colorDraft', value)}
                    onRemove={(value) => removeVariantValue('colors', value)}
                  />
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
