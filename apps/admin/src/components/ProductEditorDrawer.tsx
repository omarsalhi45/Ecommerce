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
  Heading,
  Image,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { FormEventHandler, ReactNode } from 'react'
import { buildVariantMatrix } from '../catalog/variantMatrix'
import { productColorOptions, productSizeOptions } from '../catalog/variantOptions'
import { VariantValueList } from './VariantValueList'

export interface ProductFormValues {
  id: string
  name: string
  description: string
  price: string
  compareAtPrice: string
  imageUrl: string
  category: string
  modelHeight: string
  modelSize: string
  fitDescription: string
  materialDescription: string
  careInstructions: string
  productStory: string
  questionOne: string
  answerOne: string
  questionTwo: string
  answerTwo: string
  questionThree: string
  answerThree: string
  sku: string
  sizeDraft: string
  colorDraft: string
  sizes: string[]
  colors: string[]
  stockQuantity: string
  lowStockThreshold: string
  variantStockQuantity: string
  variantLowStockThreshold: string
}

export type ProductFormTextField = Exclude<keyof ProductFormValues, 'colors' | 'sizes'>
export type ProductVariantListField = 'colors' | 'sizes'

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
  onFieldChange: (field: ProductFormTextField, value: string) => void
  onImageChange: (file: File | undefined) => void
  onVariantValueAdd: (field: ProductVariantListField) => void
  onVariantValueRemove: (field: ProductVariantListField, value: string) => void
  onSubmit: FormEventHandler<HTMLDivElement>
}

interface ProductEditorSectionProps {
  children: ReactNode
  description: string
  title: string
}

function ProductEditorSection({ children, description, title }: ProductEditorSectionProps) {
  return (
    <Box border="1px solid" borderColor="neutral.200" borderRadius="lg" p={4}>
      <Stack spacing={1} mb={4}>
        <Heading as="h3" color="neutral.900" fontSize="md">
          {title}
        </Heading>
        <Text color="neutral.500" fontSize="sm">
          {description}
        </Text>
      </Stack>
      {children}
    </Box>
  )
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
  onVariantValueAdd,
  onVariantValueRemove,
  onSubmit,
}: ProductEditorDrawerProps) {
  const hasVariantMatrixDraft = Boolean(
    productForm.sku.trim() || productForm.sizes.length > 0 || productForm.colors.length > 0
  )
  const variantMatrixInputs =
    !isEditingProduct || hasVariantMatrixDraft
      ? buildVariantMatrix({
          color: productForm.colors,
          lowStockThreshold: isEditingProduct
            ? productForm.variantLowStockThreshold
            : productForm.lowStockThreshold,
          productId: editingProductId || productForm.name || 'product',
          size: productForm.sizes,
          sku: productForm.sku,
          stockQuantity: isEditingProduct
            ? productForm.variantStockQuantity
            : productForm.stockQuantity,
        })
      : []
  const variantMatrixCopy = isEditingProduct
    ? {
        description:
          'Update primary stock, or add new size/color variants without opening details.',
        empty: 'Fill SKU prefix, sizes, or colors to add variants while saving.',
        ready: 'new',
        lowAlertLabel: 'New variant low alert',
        skuLabel: 'New SKU prefix',
        stockLabel: 'New variant stock',
      }
    : {
        description: 'Create the initial size and color matrix for this new product.',
        empty: 'Add at least a SKU prefix, size, or color to create initial variants.',
        lowAlertLabel: 'Low alert',
        ready: 'initial',
        skuLabel: 'SKU prefix',
        stockLabel: 'Initial stock',
      }

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
            <Stack spacing={4}>
              <ProductEditorSection
                title="Basics"
                description="Name, category, and shopper-facing product copy."
              >
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                  {isEditingProduct ? (
                    <Box
                      border="1px solid"
                      borderColor="neutral.200"
                      borderRadius="md"
                      gridColumn={{ base: 'auto', md: '1 / -1' }}
                      p={3}
                    >
                      <Text
                        color="neutral.600"
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                      >
                        Product ID
                      </Text>
                      <Text color="neutral.900" fontFamily="mono" fontSize="sm" mt={1}>
                        {productForm.id}
                      </Text>
                    </Box>
                  ) : null}
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
                      Category
                    </FormLabel>
                    <Input
                      placeholder="tees"
                      value={productForm.category}
                      onChange={(event) => onFieldChange('category', event.target.value)}
                    />
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
                </Grid>
              </ProductEditorSection>

              <ProductEditorSection
                title="Pricing"
                description="Set the current price and optional sale comparison."
              >
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
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
                </Grid>
              </ProductEditorSection>

              <ProductEditorSection
                title="Media"
                description="Choose the primary product image shown across the storefront."
              >
                <FormControl isInvalid={Boolean(productFormError)}>
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
              </ProductEditorSection>

              <ProductEditorSection
                title="Content"
                description="Fit, fabric, care, and story details shown on product pages."
              >
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Model height
                    </FormLabel>
                    <Input
                      placeholder="6 ft"
                      value={productForm.modelHeight}
                      onChange={(event) => onFieldChange('modelHeight', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Model size
                    </FormLabel>
                    <Input
                      placeholder="M"
                      value={productForm.modelSize}
                      onChange={(event) => onFieldChange('modelSize', event.target.value)}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }}>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Fit description
                    </FormLabel>
                    <Input
                      placeholder="Relaxed everyday fit, designed for layering."
                      value={productForm.fitDescription}
                      onChange={(event) => onFieldChange('fitDescription', event.target.value)}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }}>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Material description
                    </FormLabel>
                    <Input
                      placeholder="Soft midweight fleece with a brushed inside."
                      value={productForm.materialDescription}
                      onChange={(event) => onFieldChange('materialDescription', event.target.value)}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }}>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Care instructions
                    </FormLabel>
                    <Input
                      placeholder="Machine wash cold, tumble dry low."
                      value={productForm.careInstructions}
                      onChange={(event) => onFieldChange('careInstructions', event.target.value)}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }}>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Why this piece
                    </FormLabel>
                    <Input
                      placeholder="A core OSAI layer built for daily rotation."
                      value={productForm.productStory}
                      onChange={(event) => onFieldChange('productStory', event.target.value)}
                    />
                  </FormControl>
                </Grid>
              </ProductEditorSection>

              <ProductEditorSection
                title="Q&A"
                description="Answer common shopper questions on the product detail page."
              >
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Question 1
                    </FormLabel>
                    <Input
                      placeholder="How does it fit?"
                      value={productForm.questionOne}
                      onChange={(event) => onFieldChange('questionOne', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Answer 1
                    </FormLabel>
                    <Input
                      placeholder="Relaxed, with room to layer."
                      value={productForm.answerOne}
                      onChange={(event) => onFieldChange('answerOne', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Question 2
                    </FormLabel>
                    <Input
                      placeholder="When will it arrive?"
                      value={productForm.questionTwo}
                      onChange={(event) => onFieldChange('questionTwo', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Answer 2
                    </FormLabel>
                    <Input
                      placeholder="Usually in 3-6 business days."
                      value={productForm.answerTwo}
                      onChange={(event) => onFieldChange('answerTwo', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Question 3
                    </FormLabel>
                    <Input
                      placeholder="Can I return it?"
                      value={productForm.questionThree}
                      onChange={(event) => onFieldChange('questionThree', event.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                      Answer 3
                    </FormLabel>
                    <Input
                      placeholder="Yes, exchanges are free."
                      value={productForm.answerThree}
                      onChange={(event) => onFieldChange('answerThree', event.target.value)}
                    />
                  </FormControl>
                </Grid>
              </ProductEditorSection>

              <ProductEditorSection title="Inventory" description={variantMatrixCopy.description}>
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                  {isEditingProduct ? (
                    <FormControl>
                      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                        Primary stock
                      </FormLabel>
                      <Input
                        min={0}
                        placeholder="0"
                        type="number"
                        value={productForm.stockQuantity}
                        onChange={(event) => onFieldChange('stockQuantity', event.target.value)}
                      />
                      {!hasEditingInventoryItem ? (
                        <Text color="neutral.500" fontSize="xs" mt={1}>
                          This product has no inventory record yet.
                        </Text>
                      ) : null}
                    </FormControl>
                  ) : null}
                  {isEditingProduct ? (
                    <FormControl>
                      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                        Primary low alert
                      </FormLabel>
                      <Input
                        min={0}
                        placeholder="5"
                        type="number"
                        value={productForm.lowStockThreshold}
                        onChange={(event) => onFieldChange('lowStockThreshold', event.target.value)}
                      />
                    </FormControl>
                  ) : null}
                  <>
                    <FormControl>
                      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                        {variantMatrixCopy.skuLabel}
                      </FormLabel>
                      <Input
                        placeholder="OSAI-TEE"
                        value={productForm.sku}
                        onChange={(event) => onFieldChange('sku', event.target.value)}
                      />
                    </FormControl>
                    <VariantValueList
                      addButtonLabel="Add size"
                      emptyLabel="No sizes added yet."
                      inputLabel="Sizes"
                      options={productSizeOptions}
                      placeholder="Choose size"
                      value={productForm.sizeDraft}
                      values={productForm.sizes}
                      onAdd={() => onVariantValueAdd('sizes')}
                      onChange={(value) => onFieldChange('sizeDraft', value)}
                      onRemove={(value) => onVariantValueRemove('sizes', value)}
                    />
                    <VariantValueList
                      addButtonLabel="Add color"
                      emptyLabel="No colors added yet."
                      inputLabel="Colors"
                      options={productColorOptions}
                      placeholder="Choose color"
                      value={productForm.colorDraft}
                      values={productForm.colors}
                      onAdd={() => onVariantValueAdd('colors')}
                      onChange={(value) => onFieldChange('colorDraft', value)}
                      onRemove={(value) => onVariantValueRemove('colors', value)}
                    />
                    <FormControl>
                      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                        {variantMatrixCopy.stockLabel}
                      </FormLabel>
                      <Input
                        min={0}
                        placeholder="0"
                        type="number"
                        value={
                          isEditingProduct
                            ? productForm.variantStockQuantity
                            : productForm.stockQuantity
                        }
                        onChange={(event) =>
                          onFieldChange(
                            isEditingProduct ? 'variantStockQuantity' : 'stockQuantity',
                            event.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
                        {variantMatrixCopy.lowAlertLabel}
                      </FormLabel>
                      <Input
                        min={0}
                        placeholder="5"
                        type="number"
                        value={
                          isEditingProduct
                            ? productForm.variantLowStockThreshold
                            : productForm.lowStockThreshold
                        }
                        onChange={(event) =>
                          onFieldChange(
                            isEditingProduct ? 'variantLowStockThreshold' : 'lowStockThreshold',
                            event.target.value
                          )
                        }
                      />
                    </FormControl>
                    <Text color="neutral.600" fontSize="sm" alignSelf="end">
                      {variantMatrixInputs.length > 0
                        ? `${variantMatrixInputs.length} ${variantMatrixCopy.ready} variant${variantMatrixInputs.length === 1 ? '' : 's'} will be ${isEditingProduct ? 'added' : 'created'}.`
                        : variantMatrixCopy.empty}
                    </Text>
                  </>
                </Grid>
              </ProductEditorSection>
            </Stack>
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
