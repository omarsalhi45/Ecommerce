import { StarIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getProductPriceDetails } from '../catalog/productPricing'
import { useTranslation } from '../i18n'
import { addItem } from '../slices/cartSlice'
import { openMiniCart } from '../slices/cartUiSlice'
import {
  removeWishlistItem,
  selectWishlistProductIds,
  toggleWishlistItem,
} from '../slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Product, ProductVariant } from '../types'

interface QuickAddSelection {
  readonly color?: string
  readonly size?: string
  readonly sku?: string
}

export default function ProductList({ products }: { products: Product[] }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const wishlistProductIds = useAppSelector(selectWishlistProductIds)
  const toast = useToast()
  const [quickAddProductId, setQuickAddProductId] = useState<string>()
  const [quickAddSelection, setQuickAddSelection] = useState<QuickAddSelection>({})
  const quickAddProduct = products.find((product) => product.id === quickAddProductId)
  const quickAddVariants =
    quickAddProduct?.variants?.filter((variant) => variant.stockQuantity > 0) ?? []
  const quickAddSizes = getUniqueVariantValues(quickAddVariants, 'size')
  const quickAddColors = getUniqueVariantValues(quickAddVariants, 'color')
  const quickAddSelectedVariant = quickAddProduct
    ? getSelectedVariant(quickAddProduct, quickAddSelection)
    : undefined
  const hasCompletedQuickAddSelection =
    quickAddSizes.length === 0 && quickAddColors.length === 0
      ? Boolean(quickAddSelection.sku)
      : (quickAddSizes.length === 0 || Boolean(quickAddSelection.size)) &&
        (quickAddColors.length === 0 || Boolean(quickAddSelection.color))
  const quickAddStatusTone = quickAddSelectedVariant
    ? 'success'
    : hasCompletedQuickAddSelection
      ? 'error'
      : 'neutral'

  const addProductToCart = (product: Product, selectedVariant: ProductVariant | undefined) => {
    dispatch(
      addItem({
        productId: product.id,
        variantSku: selectedVariant?.sku,
        size: selectedVariant?.size,
        color: selectedVariant?.color,
      })
    )
    if (wishlistProductIds.includes(product.id)) {
      dispatch(removeWishlistItem({ productId: product.id }))
    }
    dispatch(openMiniCart())
    toast({
      title: t('product.addedToCart', { product: product.name }),
      description: selectedVariant
        ? t('product.variantInBag', { variant: getVariantLabel(selectedVariant) })
        : t('product.cartReady'),
      status: 'success',
      duration: 2200,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  const handleAddButtonClick = (product: Product) => {
    const inStockVariants = product.variants?.filter((variant) => variant.stockQuantity > 0) ?? []
    const needsQuickAddModal = inStockVariants.length > 0

    if (needsQuickAddModal) {
      setQuickAddProductId(product.id)
      setQuickAddSelection({})
      return
    }

    addProductToCart(product, inStockVariants[0])
  }

  const closeQuickAddModal = () => {
    setQuickAddProductId(undefined)
    setQuickAddSelection({})
  }

  const hasAvailableQuickAddVariant = (selection: QuickAddSelection) =>
    quickAddVariants.some((variant) => variantMatchesSelection(variant, selection))

  const handleAddModalSelection = () => {
    if (!quickAddProduct) {
      return
    }

    if (!quickAddSelectedVariant) {
      toast({
        title: t('product.pickSizeFirst'),
        description: t('product.pickSizeDescription', { product: quickAddProduct.name }),
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'bottom-right',
      })
      return
    }

    addProductToCart(quickAddProduct, quickAddSelectedVariant)
    closeQuickAddModal()
  }

  const handleToggleWishlist = (product: Product) => {
    const isWishlisted = wishlistProductIds.includes(product.id)

    dispatch(toggleWishlistItem({ productId: product.id }))
    toast({
      title: isWishlisted
        ? t('product.removedFromWishlist', { product: product.name })
        : t('product.savedToast', { product: product.name }),
      status: isWishlisted ? 'info' : 'success',
      duration: 1800,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  return (
    <>
      {products.map((product) => {
        const isWishlisted = wishlistProductIds.includes(product.id)
        const priceDetails = getProductPriceDetails(product)

        return (
          <Box
            key={product.id}
            bg="white"
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="neutral.200"
            transition="border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease"
            _hover={{
              transform: 'translateY(-3px)',
              boxShadow: 'md',
              borderColor: 'accent.300',
            }}
            position="relative"
          >
            <Box position="relative" overflow="hidden">
              <Image
                src={product.imageUrl}
                alt={product.name}
                objectFit="cover"
                width="100%"
                aspectRatio="4 / 5"
                transition="transform 0.3s ease"
                _hover={{ transform: 'scale(1.05)' }}
              />
              <VStack position="absolute" top={3} right={3} align="end" spacing={2}>
                <Badge
                  bg="black"
                  color="white"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {product.category}
                </Badge>
                {getProductBadges(product).map((badgeKey) => (
                  <Badge
                    key={badgeKey}
                    bg={
                      badgeKey === 'product.sale'
                        ? 'accent.600'
                        : badgeKey === 'product.lowStock'
                          ? 'orange.700'
                          : 'black'
                    }
                    color="white"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    {t(badgeKey)}
                  </Badge>
                ))}
              </VStack>
              <Button
                aria-label={
                  isWishlisted
                    ? t('product.removeSavedAria', { product: product.name })
                    : t('product.saveAria', { product: product.name })
                }
                aria-pressed={isWishlisted}
                leftIcon={<StarIcon color={isWishlisted ? 'yellow.300' : 'neutral.500'} />}
                position="absolute"
                top={3}
                left={3}
                borderRadius="full"
                size="sm"
                px={3}
                bg={isWishlisted ? 'black' : 'white'}
                color={isWishlisted ? 'white' : 'neutral.900'}
                boxShadow="sm"
                _hover={{
                  bg: isWishlisted ? 'neutral.800' : 'neutral.50',
                }}
                onClick={() => handleToggleWishlist(product)}
              >
                {isWishlisted ? t('common.saved') : t('common.save')}
              </Button>
            </Box>

            <VStack spacing={4} p={5} align="start">
              <VStack spacing={2} align="start" w="full">
                <Text
                  fontSize="xl"
                  fontWeight="black"
                  color="neutral.900"
                  lineHeight="tight"
                  noOfLines={2}
                >
                  {product.name}
                </Text>
                <Text color="neutral.600" fontSize="sm" lineHeight="tall" noOfLines={3}>
                  {product.description}
                </Text>
                {product.ratingSummary?.reviewCount ? (
                  <HStack color="neutral.700" fontSize="sm" fontWeight="bold" spacing={1}>
                    <StarIcon color="yellow.400" boxSize={3.5} />
                    <Text>
                      {product.ratingSummary.averageRating.toFixed(1)} / 5 -{' '}
                      {t('product.reviews', { count: product.ratingSummary.reviewCount })}
                    </Text>
                  </HStack>
                ) : null}
                {getAvailableColors(product).length > 0 ? (
                  <HStack
                    spacing={2}
                    aria-label={t('product.availableColorsAria', { product: product.name })}
                  >
                    {getAvailableColors(product).map((color) => (
                      <Box
                        key={color}
                        boxSize={4}
                        borderRadius="full"
                        border="1px solid"
                        borderColor="neutral.300"
                        bg={getColorSwatch(color)}
                        role="img"
                        aria-label={color}
                        title={color}
                      />
                    ))}
                  </HStack>
                ) : null}
              </VStack>

              <Stack
                direction={{ base: 'column', sm: 'row' }}
                justify="space-between"
                w="full"
                align={{ base: 'stretch', sm: 'center' }}
                gap={3}
              >
                <Text fontSize="2xl" fontWeight="black" color="neutral.900" letterSpacing="tight">
                  ${priceDetails.price.toFixed(2)}
                </Text>
                {priceDetails.compareAtPrice ? (
                  <VStack align={{ base: 'start', sm: 'end' }} spacing={0}>
                    <Text color="neutral.500" fontSize="sm" textDecoration="line-through">
                      ${priceDetails.compareAtPrice.toFixed(2)}
                    </Text>
                    <Text color="accent.700" fontSize="xs" fontWeight="black">
                      {t('product.saveAmount', { amount: priceDetails.saleAmount.toFixed(2) })}
                    </Text>
                  </VStack>
                ) : null}
                <HStack spacing={2} justify={{ base: 'stretch', sm: 'flex-end' }}>
                  <Button
                    as={RouterLink}
                    to={`/products/${product.id}`}
                    variant="outline"
                    size="sm"
                    borderRadius="full"
                    flex={{ base: 1, sm: 'initial' }}
                  >
                    {t('common.details')}
                  </Button>
                  <Button
                    colorScheme="brand"
                    size="sm"
                    borderRadius="full"
                    fontWeight="semibold"
                    px={5}
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'md',
                    }}
                    onClick={() => handleAddButtonClick(product)}
                    flex={{ base: 1, sm: 'initial' }}
                  >
                    {t('common.add')}
                  </Button>
                </HStack>
              </Stack>
            </VStack>
          </Box>
        )
      })}
      <Modal isOpen={Boolean(quickAddProduct)} onClose={closeQuickAddModal} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader bg="black" color="white" px={{ base: 5, md: 6 }} py={5}>
            <Text fontSize="xs" fontWeight="black" color="accent.300" textTransform="uppercase">
              {t('product.quickAddTitle')}
            </Text>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" lineHeight="short">
              {quickAddProduct?.name}
            </Text>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody px={{ base: 5, md: 6 }} py={6}>
            {quickAddProduct ? (
              <Stack spacing={6}>
                <HStack align="stretch" spacing={4}>
                  <Image
                    src={quickAddProduct.imageUrl}
                    alt={quickAddProduct.name}
                    boxSize={{ base: '112px', md: '148px' }}
                    borderRadius="xl"
                    objectFit="cover"
                  />
                  <Stack flex={1} justify="space-between" spacing={3}>
                    <Box>
                      <Badge bg="neutral.100" color="neutral.900" borderRadius="full" px={3} py={1}>
                        {quickAddProduct.category}
                      </Badge>
                      <Text color="neutral.600" fontSize="sm" mt={3}>
                        {t('product.quickAddCopy')}
                      </Text>
                    </Box>
                    <HStack justify="space-between">
                      <Text color="neutral.500" fontSize="sm" fontWeight="bold">
                        {quickAddProduct.category}
                      </Text>
                      <Text color="neutral.900" fontSize="2xl" fontWeight="black">
                        ${getProductPriceDetails(quickAddProduct).price.toFixed(2)}
                      </Text>
                      {getProductPriceDetails(quickAddProduct).compareAtPrice ? (
                        <VStack align="end" spacing={0}>
                          <Text color="neutral.500" fontSize="sm" textDecoration="line-through">
                            ${getProductPriceDetails(quickAddProduct).compareAtPrice?.toFixed(2)}
                          </Text>
                          <Badge colorScheme="red" borderRadius="full">
                            {t('product.salePercent', {
                              percent: getProductPriceDetails(quickAddProduct).salePercent,
                            })}
                          </Badge>
                        </VStack>
                      ) : null}
                    </HStack>
                  </Stack>
                </HStack>

                <Divider />

                <Stack spacing={5}>
                  {quickAddSizes.length > 0 ? (
                    <Box>
                      <Text color="neutral.900" fontWeight="black" mb={3}>
                        {t('common.size')}
                      </Text>
                      <HStack spacing={2} flexWrap="wrap">
                        {quickAddSizes.map((size) => {
                          const isSelected = quickAddSelection.size === size
                          const isDisabled = !hasAvailableQuickAddVariant({
                            ...quickAddSelection,
                            size,
                          })

                          return (
                            <Button
                              key={size}
                              type="button"
                              minW={12}
                              h={12}
                              borderRadius="full"
                              variant={isSelected ? 'solid' : 'outline'}
                              bg={isSelected ? 'black' : undefined}
                              color={isSelected ? 'white' : undefined}
                              borderColor={isSelected ? 'black' : 'neutral.300'}
                              isDisabled={isDisabled}
                              aria-label={t('productDetail.selectSizeAria', { size, suffix: '' })}
                              _hover={{
                                bg: isSelected ? 'neutral.800' : 'neutral.50',
                              }}
                              onClick={() =>
                                setQuickAddSelection((current) => {
                                  const nextSelection = { ...current, size }

                                  return hasAvailableQuickAddVariant(nextSelection)
                                    ? nextSelection
                                    : { size }
                                })
                              }
                            >
                              {size}
                            </Button>
                          )
                        })}
                      </HStack>
                    </Box>
                  ) : null}

                  {quickAddColors.length > 0 ? (
                    <Box>
                      <Text color="neutral.900" fontWeight="black" mb={3}>
                        {t('home.color')}
                      </Text>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        {quickAddColors.map((color) => {
                          const isSelected = quickAddSelection.color === color
                          const isDisabled = !hasAvailableQuickAddVariant({
                            ...quickAddSelection,
                            color,
                          })

                          return (
                            <Button
                              key={color}
                              type="button"
                              h={14}
                              justifyContent="flex-start"
                              borderRadius="xl"
                              variant={isSelected ? 'solid' : 'outline'}
                              bg={isSelected ? 'black' : undefined}
                              color={isSelected ? 'white' : undefined}
                              borderColor={isSelected ? 'black' : 'neutral.300'}
                              isDisabled={isDisabled}
                              aria-label={t('productDetail.selectColorAria', {
                                color,
                                suffix: '',
                              })}
                              leftIcon={
                                <Box
                                  as="span"
                                  boxSize={5}
                                  border="1px solid"
                                  borderColor={
                                    color.toLowerCase().includes('white')
                                      ? 'neutral.300'
                                      : 'transparent'
                                  }
                                  borderRadius="full"
                                  bg={getColorSwatch(color)}
                                />
                              }
                              _hover={{
                                bg: isSelected ? 'neutral.800' : 'neutral.50',
                              }}
                              onClick={() =>
                                setQuickAddSelection((current) => {
                                  const nextSelection = { ...current, color }

                                  return hasAvailableQuickAddVariant(nextSelection)
                                    ? nextSelection
                                    : { color }
                                })
                              }
                            >
                              {color}
                            </Button>
                          )
                        })}
                      </SimpleGrid>
                    </Box>
                  ) : null}

                  {quickAddSizes.length === 0 && quickAddColors.length === 0 ? (
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                      {quickAddVariants.map((variant) => {
                        const isSelected = quickAddSelection.sku === variant.sku

                        return (
                          <Button
                            key={variant.sku}
                            type="button"
                            h={14}
                            borderRadius="xl"
                            variant={isSelected ? 'solid' : 'outline'}
                            bg={isSelected ? 'black' : undefined}
                            color={isSelected ? 'white' : undefined}
                            borderColor={isSelected ? 'black' : 'neutral.300'}
                            onClick={() => setQuickAddSelection({ sku: variant.sku })}
                          >
                            {t('product.oneOption')}
                          </Button>
                        )
                      })}
                    </SimpleGrid>
                  ) : null}
                </Stack>

                <Box
                  border="1px solid"
                  borderColor={
                    quickAddStatusTone === 'success'
                      ? 'green.200'
                      : quickAddStatusTone === 'error'
                        ? 'red.200'
                        : 'neutral.200'
                  }
                  bg={
                    quickAddStatusTone === 'success'
                      ? 'green.50'
                      : quickAddStatusTone === 'error'
                        ? 'red.50'
                        : 'neutral.50'
                  }
                  borderRadius="xl"
                  p={4}
                >
                  <Text color="neutral.900" fontWeight="black" fontSize="sm">
                    {quickAddSelectedVariant
                      ? t('product.quickAddSelected', {
                          variant: getVariantLabel(quickAddSelectedVariant),
                        })
                      : hasCompletedQuickAddSelection
                        ? t('product.quickAddUnavailable')
                        : t('product.quickAddPrompt')}
                  </Text>
                  {quickAddSelectedVariant ? (
                    <Text color="neutral.600" fontSize="sm">
                      {quickAddSelectedVariant.stockQuantity <= 5
                        ? t('product.quickAddLowStock', {
                            count: quickAddSelectedVariant.stockQuantity,
                          })
                        : t('product.quickAddStock', {
                            count: quickAddSelectedVariant.stockQuantity,
                          })}
                    </Text>
                  ) : null}
                </Box>
              </Stack>
            ) : null}
          </ModalBody>
          <ModalFooter gap={3} px={{ base: 5, md: 6 }} pb={6}>
            <Button variant="outline" onClick={closeQuickAddModal}>
              {t('common.back')}
            </Button>
            <Button
              colorScheme="brand"
              isDisabled={!quickAddSelectedVariant}
              onClick={handleAddModalSelection}
            >
              {t('cart.addToCart')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

const getSelectedVariant = (
  product: Product,
  quickAddSelection: QuickAddSelection | undefined
): ProductVariant | undefined => {
  const inStockVariants = product.variants?.filter((variant) => variant.stockQuantity > 0) ?? []
  const variantSizes = getUniqueVariantValues(inStockVariants, 'size')
  const variantColors = getUniqueVariantValues(inStockVariants, 'color')

  if (quickAddSelection?.sku) {
    return inStockVariants.find((variant) => variant.sku === quickAddSelection.sku)
  }

  if (variantSizes.length > 0 || variantColors.length > 0) {
    if (variantSizes.length > 0 && !quickAddSelection?.size) {
      return undefined
    }

    if (variantColors.length > 0 && !quickAddSelection?.color) {
      return undefined
    }

    return inStockVariants.find((variant) => {
      const sizeMatches = variantSizes.length === 0 || variant.size === quickAddSelection?.size
      const colorMatches = variantColors.length === 0 || variant.color === quickAddSelection?.color

      return sizeMatches && colorMatches
    })
  }

  return inStockVariants.length === 1 ? inStockVariants[0] : undefined
}

const variantMatchesSelection = (
  variant: ProductVariant,
  quickAddSelection: QuickAddSelection
): boolean => {
  const sizeMatches = !quickAddSelection.size || variant.size === quickAddSelection.size
  const colorMatches = !quickAddSelection.color || variant.color === quickAddSelection.color
  const skuMatches = !quickAddSelection.sku || variant.sku === quickAddSelection.sku

  return sizeMatches && colorMatches && skuMatches
}

const getUniqueVariantValues = (variants: ProductVariant[], key: 'size' | 'color'): string[] => [
  ...new Set(
    variants.map((variant) => variant[key]).filter((value): value is string => Boolean(value))
  ),
]

const getVariantLabel = (variant: ProductVariant): string =>
  [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku

const getProductBadges = (
  product: Product
): Array<'product.bestSeller' | 'product.lowStock' | 'product.sale'> => {
  const badges: Array<'product.bestSeller' | 'product.lowStock' | 'product.sale'> = []
  const hasLowStockVariant = product.variants?.some(
    (variant) => variant.stockQuantity > 0 && variant.stockQuantity <= 5
  )

  if (getProductPriceDetails(product).isOnSale) {
    badges.push('product.sale')
  }

  if ((product.popularityScore ?? 0) >= 90) {
    badges.push('product.bestSeller')
  }

  if (hasLowStockVariant) {
    badges.push('product.lowStock')
  }

  return badges
}

const getAvailableColors = (product: Product): string[] => {
  const colors =
    product.variants
      ?.filter((variant) => variant.stockQuantity > 0 && variant.color)
      .map((variant) => variant.color as string) ?? []

  return [...new Set(colors)]
}

const getColorSwatch = (color: string): string => {
  const normalizedColor = color.toLowerCase()

  if (normalizedColor.includes('black')) {
    return '#111111'
  }

  if (normalizedColor.includes('grey') || normalizedColor.includes('gray')) {
    return '#9CA3AF'
  }

  if (normalizedColor.includes('white')) {
    return '#FFFFFF'
  }

  if (normalizedColor.includes('blue')) {
    return '#2563EB'
  }

  if (normalizedColor.includes('green')) {
    return '#16A34A'
  }

  return '#D4D4D4'
}
