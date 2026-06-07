import {
  Badge,
  Box,
  Button,
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
  Stack,
  Text,
} from '@chakra-ui/react'
import type { InventoryItem, Product } from '../types'

interface ProductDetailsDrawerProps {
  inventoryDrafts: Record<string, string>
  inventoryItems: InventoryItem[]
  isInventoryError: boolean
  product?: Product
  onClose: () => void
  onEditProduct: (product: Product) => void
  onInventoryDraftChange: (productId: string, value: string) => void
  onSaveStock: (productId: string, stockQuantity: number) => void
}

export function ProductDetailsDrawer({
  inventoryDrafts,
  inventoryItems,
  isInventoryError,
  product,
  onClose,
  onEditProduct,
  onInventoryDraftChange,
  onSaveStock,
}: ProductDetailsDrawerProps) {
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
                    const draftValue = inventoryDrafts[item.product.id] ?? item.stockQuantity

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
                            value={draftValue}
                            onChange={(event) =>
                              onInventoryDraftChange(item.product.id, event.target.value)
                            }
                          />
                          <Button
                            flexShrink={0}
                            size="sm"
                            onClick={() => onSaveStock(item.product.id, Number(draftValue))}
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
