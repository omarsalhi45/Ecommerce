import { StarIcon } from '@chakra-ui/icons'
import { Badge, Box, Button, HStack, Image, Stack, Text, VStack, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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

export default function ProductList({ products }: { products: Product[] }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const wishlistProductIds = useAppSelector(selectWishlistProductIds)
  const toast = useToast()
  const [selectedVariantByProductId, setSelectedVariantByProductId] = useState<
    Record<string, string>
  >({})

  const handleAddToCart = (product: Product) => {
    const inStockVariants = product.variants?.filter((variant) => variant.stockQuantity > 0) ?? []
    const selectedVariant = getSelectedVariant(product, selectedVariantByProductId[product.id])

    if (inStockVariants.length > 0 && !selectedVariant) {
      toast({
        title: t('product.pickSizeFirst'),
        description: t('product.pickSizeDescription', { product: product.name }),
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'bottom-right',
      })
      return
    }

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
        const inStockVariants =
          product.variants?.filter((variant) => variant.stockQuantity > 0) ?? []
        const selectedVariant = getSelectedVariant(product, selectedVariantByProductId[product.id])
        const addLabel =
          inStockVariants.length > 1 && !selectedVariant ? t('product.pickSize') : t('common.add')
        const isWishlisted = wishlistProductIds.includes(product.id)

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
                    bg={badgeKey === 'product.lowStock' ? 'orange.700' : 'black'}
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

              {inStockVariants.length > 0 ? (
                <HStack
                  spacing={2}
                  flexWrap="wrap"
                  aria-label={t('product.quickAddOptionsAria', { product: product.name })}
                >
                  {inStockVariants.map((variant) => {
                    const isSelected = selectedVariant?.sku === variant.sku

                    return (
                      <Button
                        key={variant.sku}
                        type="button"
                        size="xs"
                        minW={10}
                        borderRadius="full"
                        variant={isSelected ? 'solid' : 'outline'}
                        colorScheme={isSelected ? 'brand' : 'gray'}
                        onClick={() =>
                          setSelectedVariantByProductId((current) => ({
                            ...current,
                            [product.id]: variant.sku,
                          }))
                        }
                      >
                        {variant.size ?? variant.color ?? t('product.oneOption')}
                      </Button>
                    )
                  })}
                </HStack>
              ) : null}

              <Stack
                direction={{ base: 'column', sm: 'row' }}
                justify="space-between"
                w="full"
                align={{ base: 'stretch', sm: 'center' }}
                gap={3}
              >
                <Text fontSize="2xl" fontWeight="black" color="neutral.900" letterSpacing="tight">
                  ${product.price.toFixed(2)}
                </Text>
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
                    onClick={() => handleAddToCart(product)}
                    flex={{ base: 1, sm: 'initial' }}
                  >
                    {addLabel}
                  </Button>
                </HStack>
              </Stack>
            </VStack>
          </Box>
        )
      })}
    </>
  )
}

const getSelectedVariant = (
  product: Product,
  selectedVariantSku: string | undefined
): ProductVariant | undefined => {
  const inStockVariants = product.variants?.filter((variant) => variant.stockQuantity > 0) ?? []

  if (selectedVariantSku) {
    return inStockVariants.find((variant) => variant.sku === selectedVariantSku)
  }

  return inStockVariants.length === 1 ? inStockVariants[0] : undefined
}

const getVariantLabel = (variant: ProductVariant): string =>
  [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku

const getProductBadges = (product: Product): Array<'product.bestSeller' | 'product.lowStock'> => {
  const badges: Array<'product.bestSeller' | 'product.lowStock'> = []
  const hasLowStockVariant = product.variants?.some(
    (variant) => variant.stockQuantity > 0 && variant.stockQuantity <= 5
  )

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
