import {
  Alert,
  AlertIcon,
  Box,
  Button,
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
  Image,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { FormEventHandler } from 'react'

export interface ProductFormValues {
  id: string
  name: string
  description: string
  price: string
  compareAtPrice: string
  imageUrl: string
  category: string
  sku: string
  stockQuantity: string
}

interface ProductEditorDrawerProps {
  editingProductId?: string
  externalImageUrl: string
  hasEditingInventoryItem: boolean
  imageStatus?: string
  isEditingProduct: boolean
  isImageUploading: boolean
  isOpen: boolean
  isSavingProduct: boolean
  productForm: ProductFormValues
  productFormError?: string
  onCancel: () => void
  onExternalImageUrlChange: (value: string) => void
  onFieldChange: (field: keyof ProductFormValues, value: string) => void
  onImageChange: (file: File | undefined) => void
  onSubmit: FormEventHandler<HTMLDivElement>
}

export function ProductEditorDrawer({
  editingProductId,
  externalImageUrl,
  hasEditingInventoryItem,
  imageStatus,
  isEditingProduct,
  isImageUploading,
  isOpen,
  isSavingProduct,
  productForm,
  productFormError,
  onCancel,
  onExternalImageUrlChange,
  onFieldChange,
  onImageChange,
  onSubmit,
}: ProductEditorDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onCancel} placement="right" size="lg">
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
          <Box as="form" id="product-editor-form" onSubmit={onSubmit}>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
              <FormControl isRequired>
                <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                  Product id
                </FormLabel>
                <Input
                  placeholder="black-tee"
                  isDisabled={isEditingProduct}
                  value={productForm.id}
                  onChange={(event) => onFieldChange('id', event.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                  Name
                </FormLabel>
                <Input
                  placeholder="Oversized tee"
                  value={productForm.name}
                  onChange={(event) => onFieldChange('name', event.target.value)}
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
                  onChange={(event) => onFieldChange('price', event.target.value)}
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
                  onChange={(event) => onFieldChange('compareAtPrice', event.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                  Category
                </FormLabel>
                <Input
                  placeholder="tees"
                  value={productForm.category}
                  onChange={(event) => onFieldChange('category', event.target.value)}
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
                  onChange={(event) => onFieldChange('stockQuantity', event.target.value)}
                />
                {isEditingProduct && !hasEditingInventoryItem ? (
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
                      onImageChange(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  <Input
                    placeholder="https://example.com/product.jpg"
                    value={externalImageUrl}
                    onChange={(event) => onExternalImageUrlChange(event.target.value)}
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
                  onChange={(event) => onFieldChange('description', event.target.value)}
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
                    onChange={(event) => onFieldChange('sku', event.target.value)}
                  />
                </FormControl>
              ) : null}
            </Grid>
          </Box>
        </DrawerBody>
        <DrawerFooter gap={3}>
          <Button variant="outline" onClick={onCancel}>
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
  )
}
