import { ArrowBackIcon, StarIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  HStack,
  Heading,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetProductsQuery,
  useGetRecommendationsQuery,
} from '../api/productsApi'
import {
  formatCategoryLabel,
  getCompleteTheFitProducts,
  getRelatedProducts,
} from '../catalog/catalogFilters'
import ProductList from '../components/ProductList'
import { addItem } from '../slices/cartSlice'
import { openMiniCart } from '../slices/cartUiSlice'
import { selectIsWishlisted, toggleWishlistItem } from '../slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Product, ProductVariant } from '../types'

interface FitProfile {
  readonly modelHeight: string
  readonly modelSize: string
  readonly fit: string
  readonly material: string
  readonly care: string
}

interface ProductQuestion {
  readonly question: string
  readonly answer: string
}

interface ProductMediaItem {
  readonly type: 'image' | 'video'
  readonly url: string
  readonly label: string
}

const isString = (value: string | undefined): value is string => Boolean(value)

const getUniqueVariantValues = (variants: ProductVariant[], key: 'size' | 'color') => [
  ...new Set(variants.map((variant) => variant[key]).filter(isString)),
]

const getVariantLabel = (variant: ProductVariant): string =>
  [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku

const getProductMedia = (product: Product): ProductMediaItem[] => {
  const imageUrls = Array.from(new Set([product.imageUrl, ...(product.imageUrls ?? [])])).filter(
    Boolean
  )
  const imageMedia = imageUrls.map((url, index) => ({
    type: 'image' as const,
    url,
    label: `${product.name} view ${index + 1}`,
  }))

  return product.videoUrl
    ? [...imageMedia, { type: 'video', url: product.videoUrl, label: `${product.name} video` }]
    : imageMedia
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

const getFitProfile = (product: Product): FitProfile => {
  const category = product.category.toLowerCase()

  if (category.includes('jacket')) {
    return {
      modelHeight: '6 ft 1 in',
      modelSize: 'L',
      fit: 'Relaxed shell fit with room for a hoodie underneath.',
      material: 'Lightweight woven nylon blend with a smooth lining.',
      care: 'Machine wash cold, hang dry, avoid bleach.',
    }
  }

  if (category.includes('tee')) {
    return {
      modelHeight: '5 ft 11 in',
      modelSize: 'M',
      fit: 'Boxy street fit with dropped shoulders.',
      material: 'Heavy cotton jersey that keeps its shape.',
      care: 'Wash inside out cold, tumble dry low.',
    }
  }

  if (category.includes('pant') || category.includes('cargo')) {
    return {
      modelHeight: '6 ft',
      modelSize: 'M',
      fit: 'Relaxed through the leg with easy movement.',
      material: 'Structured cotton twill with light stretch.',
      care: 'Machine wash cold, line dry for best shape.',
    }
  }

  return {
    modelHeight: '6 ft',
    modelSize: 'M',
    fit: 'Relaxed everyday fit, designed for layering.',
    material: 'Soft midweight fleece with a brushed inside.',
    care: 'Machine wash cold, tumble dry low.',
  }
}

const getProductReasons = (product: Product): string[] => {
  const reasons = ['Easy to style with the rest of the OSAI catalog']

  if ((product.popularityScore ?? 0) >= 90) {
    reasons.unshift('One of the most saved pieces in the current drop')
  }

  if ((product.ratingSummary?.averageRating ?? 0) >= 4.7) {
    reasons.push('Strong shopper rating for comfort and shape')
  }

  if (
    product.variants?.some((variant) => variant.stockQuantity > 0 && variant.stockQuantity <= 5)
  ) {
    reasons.push('Limited stock in select options')
  }

  return reasons.slice(0, 3)
}

const getProductQuestions = (product: Product): ProductQuestion[] => {
  const category = product.category.toLowerCase()
  const isOuterwear = category.includes('jacket')

  return [
    {
      question: 'How does it fit?',
      answer: isOuterwear
        ? 'Roomy enough for a hoodie layer. Size down only if you want a sharper fit.'
        : 'Relaxed without feeling oversized. Choose your usual size for the intended look.',
    },
    {
      question: 'When will it arrive?',
      answer: 'Orders usually ship in 2-4 business days with tracking after confirmation.',
    },
    {
      question: 'Can I return it?',
      answer: 'Yes. Unworn items can be returned within 30 days after delivery.',
    },
  ]
}

export default function ProductDetailPage() {
  const { productId = '' } = useParams()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const sizeGuide = useDisclosure()
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>()
  const [selectedSize, setSelectedSize] = useState<string>()
  const [selectedColor, setSelectedColor] = useState<string>()
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProductQuery(productId, {
    skip: !productId,
  })
  const { data: products = [] } = useGetProductsQuery()
  const { data: recommendations = [] } = useGetRecommendationsQuery(productId, {
    skip: !productId,
  })
  const { data: reviewsData } = useGetProductReviewsQuery(productId, {
    skip: !productId,
  })

  const completeTheFitProducts = product ? getCompleteTheFitProducts(products, product) : []
  const completeTheFitProductIds = new Set(completeTheFitProducts.map((item) => item.id))
  const relatedProducts = (
    recommendations.length ? recommendations : product ? getRelatedProducts(products, product) : []
  ).filter((item) => !completeTheFitProductIds.has(item.id))
  const fitProfile = product ? getFitProfile(product) : undefined
  const productReasons = product ? getProductReasons(product) : []
  const productQuestions = product ? getProductQuestions(product) : []
  const productMedia = product ? getProductMedia(product) : []
  const selectedMedia = productMedia[Math.min(selectedMediaIndex, productMedia.length - 1)]
  const ratingSummary = reviewsData?.summary ?? product?.ratingSummary
  const reviews = reviewsData?.reviews ?? []
  const isWishlisted = useAppSelector(selectIsWishlisted(productId))
  const variants = product?.variants ?? []
  const variantSizes = getUniqueVariantValues(variants, 'size')
  const variantColors = getUniqueVariantValues(variants, 'color')
  const hasSizeChoices = variantSizes.length > 0
  const hasColorChoices = variantColors.length > 0
  const hasStructuredChoices = hasSizeChoices || hasColorChoices
  const selectedVariant = variants.find((variant) => variant.sku === selectedVariantSku)
  const selectedVariantLabel = selectedVariant ? getVariantLabel(selectedVariant) : undefined
  const variantStockMessage = selectedVariant
    ? selectedVariant.stockQuantity <= 0
      ? `${selectedVariantLabel} is sold out. Try another option.`
      : selectedVariant.stockQuantity <= 5
        ? `Only ${selectedVariant.stockQuantity} left in ${selectedVariantLabel}.`
        : `${selectedVariant.stockQuantity} available in ${selectedVariantLabel}.`
    : hasStructuredChoices
      ? `Choose ${hasSizeChoices && hasColorChoices ? 'a size and color' : hasSizeChoices ? 'a size' : 'a color'} to check availability.`
      : undefined

  const findMatchingVariant = (nextSize = selectedSize, nextColor = selectedColor) => {
    const matches = variants.filter((variant) => {
      const sizeMatches = !hasSizeChoices || variant.size === nextSize
      const colorMatches = !hasColorChoices || variant.color === nextColor

      return sizeMatches && colorMatches
    })

    return matches.find((variant) => variant.stockQuantity > 0) ?? matches[0]
  }

  const handleSelectSize = (size: string) => {
    setSelectedSize(size)
    setSelectedVariantSku(findMatchingVariant(size, selectedColor)?.sku)
  }

  const handleSelectColor = (color: string) => {
    setSelectedColor(color)
    setSelectedVariantSku(findMatchingVariant(selectedSize, color)?.sku)
  }

  const handleAddToCart = () => {
    if (!product) {
      return
    }

    if (variants.length > 0 && !selectedVariant) {
      toast({
        title: 'Choose your option first',
        description: 'Pick the size and color you want before adding this piece.',
        status: 'warning',
        duration: 2400,
        isClosable: true,
        position: 'bottom-right',
      })
      return
    }

    if (selectedVariant && selectedVariant.stockQuantity <= 0) {
      toast({
        title: 'That option is sold out',
        description: 'Pick another size or color before adding this piece.',
        status: 'warning',
        duration: 2400,
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
    dispatch(openMiniCart())
    toast({
      title: `${product.name} added to cart`,
      description: selectedVariantLabel
        ? `${selectedVariantLabel} is in your bag.`
        : 'Your cart is ready when you are.',
      status: 'success',
      duration: 2200,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  const handleToggleWishlist = () => {
    if (!product) {
      return
    }

    dispatch(toggleWishlistItem({ productId: product.id }))
    toast({
      title: isWishlisted ? `${product.name} removed from wishlist` : `${product.name} saved`,
      status: isWishlisted ? 'info' : 'success',
      duration: 1800,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  if (isLoading) {
    return (
      <Container maxW="7xl" py={10}>
        <Grid templateColumns={{ base: '1fr', lg: '1.05fr 0.95fr' }} gap={8}>
          <Skeleton h={{ base: '520px', md: '680px' }} borderRadius="lg" />
          <Stack spacing={5}>
            <Skeleton h={8} maxW="32" />
            <Skeleton h={14} />
            <Skeleton h={24} />
            <Skeleton h={12} maxW="64" />
          </Stack>
        </Grid>
      </Container>
    )
  }

  if (error || !product) {
    return (
      <Container maxW="4xl" py={20}>
        <VStack spacing={4}>
          <Heading as="h1" size="xl">
            Product not found
          </Heading>
          <Text color="neutral.600" textAlign="center">
            This item may have been removed from the collection or the link is out of date.
          </Text>
          <HStack spacing={3}>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="outline">
              Back to shop
            </Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </HStack>
        </VStack>
      </Container>
    )
  }

  return (
    <Box>
      <Container maxW="7xl" py={{ base: 6, md: 10 }} pb={{ base: 28, lg: 10 }}>
        <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="ghost" mb={6}>
          Back to shop
        </Button>

        <Grid templateColumns={{ base: '1fr', lg: '1.05fr 0.95fr' }} gap={{ base: 8, lg: 12 }}>
          <Stack spacing={3}>
            <Box
              bg="white"
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              overflow="hidden"
            >
              {selectedMedia?.type === 'video' ? (
                <Box
                  as="video"
                  src={selectedMedia.url}
                  aria-label={selectedMedia.label}
                  controls
                  muted
                  playsInline
                  w="full"
                  aspectRatio="4 / 5"
                  objectFit="cover"
                  bg="black"
                />
              ) : (
                <Image
                  src={selectedMedia?.url ?? product.imageUrl}
                  alt={selectedMedia?.label ?? product.name}
                  objectFit="cover"
                  w="full"
                  aspectRatio="4 / 5"
                />
              )}
            </Box>

            {productMedia.length > 1 ? (
              <SimpleGrid columns={{ base: 4, md: 5 }} spacing={3} aria-label="Product media">
                {productMedia.map((media, index) => {
                  const isSelected = index === selectedMediaIndex

                  return (
                    <Button
                      key={`${media.type}-${media.url}`}
                      aria-label={`Show ${media.label}`}
                      aria-pressed={isSelected}
                      h="auto"
                      minH={20}
                      overflow="hidden"
                      p={0}
                      border="2px solid"
                      borderColor={isSelected ? 'neutral.900' : 'neutral.200'}
                      borderRadius="md"
                      bg="white"
                      onClick={() => setSelectedMediaIndex(index)}
                    >
                      {media.type === 'image' ? (
                        <Image src={media.url} alt="" objectFit="cover" w="full" aspectRatio="1" />
                      ) : (
                        <VStack spacing={1} color="neutral.900" px={2}>
                          <Text fontWeight="black">Video</Text>
                          <Text color="neutral.500" fontSize="xs">
                            0:15
                          </Text>
                        </VStack>
                      )}
                    </Button>
                  )
                })}
              </SimpleGrid>
            ) : null}
          </Stack>

          <Stack spacing={7} align="stretch">
            <Stack spacing={4}>
              <Badge
                alignSelf="flex-start"
                bg="black"
                color="white"
                px={3}
                py={1}
                borderRadius="full"
              >
                {formatCategoryLabel(product.category)}
              </Badge>
              <Heading as="h1" size="3xl" color="neutral.900" lineHeight="1">
                {product.name}
              </Heading>
              <Text color="neutral.600" fontSize="lg" lineHeight="tall">
                {product.description}
              </Text>
              <Text fontSize="3xl" fontWeight="black" color="neutral.900">
                ${product.price.toFixed(2)}
              </Text>
              {ratingSummary?.reviewCount ? (
                <HStack spacing={2}>
                  <Badge colorScheme="yellow" borderRadius="full" px={3} py={1}>
                    {ratingSummary.averageRating.toFixed(1)} / 5
                  </Badge>
                  <Text color="neutral.600" fontWeight="bold">
                    {ratingSummary.reviewCount} reviews
                  </Text>
                </HStack>
              ) : null}
            </Stack>

            <Divider />

            {product.variants?.length ? (
              <Stack spacing={5}>
                <HStack justify="space-between" align="center">
                  <Box>
                    <Text color="neutral.900" fontWeight="black">
                      Choose your option
                    </Text>
                  </Box>
                  <Button
                    variant="link"
                    color="neutral.900"
                    fontWeight="black"
                    onClick={sizeGuide.onOpen}
                  >
                    Size guide
                  </Button>
                </HStack>

                {hasSizeChoices ? (
                  <Box>
                    <Text color="neutral.600" fontSize="sm" fontWeight="bold" mb={2}>
                      Size
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {variantSizes.map((size) => {
                        const hasStock = variants.some(
                          (variant) => variant.size === size && variant.stockQuantity > 0
                        )

                        return (
                          <Button
                            key={size}
                            type="button"
                            aria-label={`Select size ${size}${hasStock ? '' : ' (sold out)'}`}
                            aria-pressed={selectedSize === size}
                            size="sm"
                            variant={selectedSize === size ? 'solid' : 'outline'}
                            colorScheme={selectedSize === size ? 'brand' : 'gray'}
                            isDisabled={!hasStock}
                            onClick={() => handleSelectSize(size)}
                            minW="48px"
                          >
                            {size}
                          </Button>
                        )
                      })}
                    </HStack>
                  </Box>
                ) : null}

                {hasColorChoices ? (
                  <Box>
                    <Text color="neutral.600" fontSize="sm" fontWeight="bold" mb={2}>
                      Color
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {variantColors.map((color) => {
                        const hasStock = variants.some(
                          (variant) => variant.color === color && variant.stockQuantity > 0
                        )

                        return (
                          <Button
                            key={color}
                            type="button"
                            aria-label={`Select color ${color}${hasStock ? '' : ' (sold out)'}`}
                            aria-pressed={selectedColor === color}
                            size="sm"
                            variant={selectedColor === color ? 'solid' : 'outline'}
                            colorScheme={selectedColor === color ? 'brand' : 'gray'}
                            isDisabled={!hasStock}
                            onClick={() => handleSelectColor(color)}
                            leftIcon={
                              <Box
                                as="span"
                                w={3}
                                h={3}
                                borderRadius="full"
                                border="1px solid"
                                borderColor={
                                  color.toLowerCase().includes('white')
                                    ? 'neutral.300'
                                    : 'transparent'
                                }
                                bg={getColorSwatch(color)}
                              />
                            }
                          >
                            {color}
                          </Button>
                        )
                      })}
                    </HStack>
                  </Box>
                ) : null}

                {!hasStructuredChoices ? (
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                    {product.variants.map((variant) => (
                      <Button
                        key={variant.sku}
                        type="button"
                        variant={selectedVariantSku === variant.sku ? 'solid' : 'outline'}
                        colorScheme={selectedVariantSku === variant.sku ? 'brand' : 'gray'}
                        isDisabled={variant.stockQuantity <= 0}
                        onClick={() => setSelectedVariantSku(variant.sku)}
                      >
                        {variant.stockQuantity > 0 ? 'Standard' : 'Sold out'}
                      </Button>
                    ))}
                  </SimpleGrid>
                ) : null}

                {variantStockMessage ? (
                  <Text
                    color={
                      selectedVariant && selectedVariant.stockQuantity <= 5
                        ? 'orange.600'
                        : 'neutral.600'
                    }
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {variantStockMessage}
                  </Text>
                ) : null}
              </Stack>
            ) : null}

            <Stack spacing={4}>
              <Text color="neutral.900" fontWeight="black">
                Fit & fabric
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {fitProfile
                  ? [
                      ['Model', `${fitProfile.modelHeight}, wearing ${fitProfile.modelSize}`],
                      ['Fit', fitProfile.fit],
                      ['Material', fitProfile.material],
                      ['Care', fitProfile.care],
                    ].map(([title, body]) => (
                      <Box
                        key={title}
                        border="1px solid"
                        borderColor="neutral.200"
                        borderRadius="lg"
                        bg="white"
                        px={4}
                        py={3}
                      >
                        <Text color="neutral.900" fontWeight="black">
                          {title}
                        </Text>
                        <Text color="neutral.600" fontSize="sm">
                          {body}
                        </Text>
                      </Box>
                    ))
                  : null}
              </SimpleGrid>
            </Stack>

            <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
              <Button colorScheme="brand" size="lg" onClick={handleAddToCart}>
                Add to cart
              </Button>
              <Button
                leftIcon={<StarIcon />}
                variant={isWishlisted ? 'solid' : 'outline'}
                colorScheme={isWishlisted ? 'yellow' : 'gray'}
                size="lg"
                onClick={handleToggleWishlist}
              >
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
              <Button as={RouterLink} to="/checkout" variant="outline" size="lg">
                Checkout
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
              {[
                ['Delivery', 'Ships in 2-4 business days'],
                ['Returns', '30-day returns on unworn items'],
                ['Checkout', 'Secure Stripe payment'],
                ['Support', 'Help before and after your order'],
              ].map(([title, body]) => (
                <Box
                  key={title}
                  border="1px solid"
                  borderColor="neutral.200"
                  borderRadius="lg"
                  bg="white"
                  px={4}
                  py={3}
                >
                  <Text color="neutral.900" fontWeight="black">
                    {title}
                  </Text>
                  <Text color="neutral.600" fontSize="sm">
                    {body}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Grid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={{ base: 12, md: 16 }}>
          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            p={{ base: 5, md: 6 }}
          >
            <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
              Product notes
            </Text>
            <Heading as="h2" size="lg" color="neutral.900" mt={1} mb={4}>
              Why this piece
            </Heading>
            <Stack spacing={3}>
              {productReasons.map((reason) => (
                <HStack key={reason} align="start" spacing={3}>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg="accent.600"
                    flexShrink={0}
                    mt="0.55rem"
                  />
                  <Text color="neutral.700" fontWeight="semibold">
                    {reason}
                  </Text>
                </HStack>
              ))}
            </Stack>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            p={{ base: 5, md: 6 }}
          >
            <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
              Quick answers
            </Text>
            <Heading as="h2" size="lg" color="neutral.900" mt={1} mb={4}>
              Questions shoppers ask
            </Heading>
            <Stack spacing={4} divider={<Divider />}>
              {productQuestions.map((item) => (
                <Box key={item.question}>
                  <Text color="neutral.900" fontWeight="black">
                    {item.question}
                  </Text>
                  <Text color="neutral.600" fontSize="sm" mt={1}>
                    {item.answer}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        </SimpleGrid>

        {reviews.length > 0 && ratingSummary?.reviewCount ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Community rating
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Reviews
              </Heading>
              <Text color="neutral.600" mt={2}>
                Average {ratingSummary.averageRating.toFixed(1)} out of 5 from{' '}
                {ratingSummary.reviewCount} shoppers.
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  bg="white"
                  border="1px solid"
                  borderColor="neutral.200"
                  borderRadius="lg"
                  p={5}
                >
                  <HStack justify="space-between" align="start" mb={3}>
                    <Box>
                      <Text fontWeight="black">{review.title}</Text>
                      <Text color="neutral.500" fontSize="sm">
                        {review.authorName}
                      </Text>
                    </Box>
                    <Badge colorScheme="yellow">{review.rating} / 5</Badge>
                  </HStack>
                  <Text color="neutral.700">{review.body}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        ) : null}

        {completeTheFitProducts.length > 0 ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Outfit builder
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Complete the fit
              </Heading>
              <Text color="neutral.600" mt={2}>
                Add complementary pieces that balance the shape, layer, and color of this item.
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <ProductList products={completeTheFitProducts} />
            </SimpleGrid>
          </VStack>
        ) : null}

        {relatedProducts.length > 0 ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Keep browsing
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Recommended pieces
              </Heading>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <ProductList products={relatedProducts} />
            </SimpleGrid>
          </VStack>
        ) : null}
      </Container>

      <Box
        display={{ base: 'block', lg: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={20}
        bg="white"
        borderTop="1px solid"
        borderColor="neutral.200"
        px={4}
        py={3}
        boxShadow="0 -10px 30px rgba(15, 23, 42, 0.12)"
      >
        <HStack justify="space-between" spacing={3}>
          <Box minW={0}>
            <Text fontWeight="black">${product.price.toFixed(2)}</Text>
            <Text color="neutral.500" fontSize="sm" noOfLines={1}>
              {selectedVariantLabel ??
                (variants.length > 0 ? 'Choose size and color' : product.name)}
            </Text>
          </Box>
          <Button colorScheme="brand" onClick={handleAddToCart} minW="136px">
            Add to cart
          </Button>
        </HStack>
      </Box>

      <Modal isOpen={sizeGuide.isOpen} onClose={sizeGuide.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Size guide</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text color="neutral.600" mb={4}>
              OSAI pieces are cut relaxed. Choose your usual size for a roomy street fit.
            </Text>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Size</Th>
                    <Th>Chest</Th>
                    <Th>Length</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    ['S', '34-36 in', '26 in'],
                    ['M', '38-40 in', '27 in'],
                    ['L', '42-44 in', '28 in'],
                    ['XL', '46-48 in', '29 in'],
                  ].map(([size, chest, length]) => (
                    <Tr key={size}>
                      <Td fontWeight="bold">{size}</Td>
                      <Td>{chest}</Td>
                      <Td>{length}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <Text color="neutral.500" fontSize="sm" mt={4}>
              Need help?{' '}
              <Link as={RouterLink} to="/cart" fontWeight="bold">
                Review your bag
              </Link>{' '}
              before checkout.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
