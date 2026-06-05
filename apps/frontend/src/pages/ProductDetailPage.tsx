import { ArrowBackIcon, StarIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
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
import { type FormEvent, useState } from 'react'
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
import { getProductPriceDetails } from '../catalog/productPricing'
import ProductList from '../components/ProductList'
import { useTranslation } from '../i18n'
import { addItem } from '../slices/cartSlice'
import { openMiniCart } from '../slices/cartUiSlice'
import { selectIsWishlisted, toggleWishlistItem } from '../slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Product, ProductReview, ProductVariant } from '../types'

interface FitProfile {
  readonly modelHeight: string
  readonly modelSize: string
  readonly fitKey: TranslationKey
  readonly materialKey: TranslationKey
  readonly careKey: TranslationKey
}

interface ProductQuestion {
  readonly questionKey: TranslationKey
  readonly answerKey: TranslationKey
}

interface ProductMediaItem {
  readonly type: 'image' | 'video'
  readonly url: string
  readonly label: string
}

interface FitFeedback {
  readonly labelKey: TranslationKey
  readonly helperKey: TranslationKey
  readonly count: number
}

type TranslationKey = Parameters<ReturnType<typeof useTranslation>['t']>[0]

const isString = (value: string | undefined): value is string => Boolean(value)

const getUniqueVariantValues = (variants: ProductVariant[], key: 'size' | 'color') => [
  ...new Set(variants.map((variant) => variant[key]).filter(isString)),
]

const getVariantLabel = (variant: ProductVariant): string =>
  [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku

const getSoldOutVariants = (variants: ProductVariant[]): ProductVariant[] =>
  variants.filter((variant) => variant.stockQuantity <= 0)

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
      fitKey: 'productDetail.fit.jacketFit',
      materialKey: 'productDetail.fit.jacketMaterial',
      careKey: 'productDetail.fit.jacketCare',
    }
  }

  if (category.includes('tee')) {
    return {
      modelHeight: '5 ft 11 in',
      modelSize: 'M',
      fitKey: 'productDetail.fit.teeFit',
      materialKey: 'productDetail.fit.teeMaterial',
      careKey: 'productDetail.fit.teeCare',
    }
  }

  if (category.includes('pant') || category.includes('cargo')) {
    return {
      modelHeight: '6 ft',
      modelSize: 'M',
      fitKey: 'productDetail.fit.pantsFit',
      materialKey: 'productDetail.fit.pantsMaterial',
      careKey: 'productDetail.fit.pantsCare',
    }
  }

  return {
    modelHeight: '6 ft',
    modelSize: 'M',
    fitKey: 'productDetail.fit.defaultFit',
    materialKey: 'productDetail.fit.defaultMaterial',
    careKey: 'productDetail.fit.defaultCare',
  }
}

const getProductReasons = (product: Product): TranslationKey[] => {
  const reasons: TranslationKey[] = ['productDetail.reason.easyStyle']

  if ((product.popularityScore ?? 0) >= 90) {
    reasons.unshift('productDetail.reason.mostSaved')
  }

  if ((product.ratingSummary?.averageRating ?? 0) >= 4.7) {
    reasons.push('productDetail.reason.strongRating')
  }

  if (
    product.variants?.some((variant) => variant.stockQuantity > 0 && variant.stockQuantity <= 5)
  ) {
    reasons.push('productDetail.reason.limitedStock')
  }

  return reasons.slice(0, 3)
}

const getProductQuestions = (product: Product): ProductQuestion[] => {
  const category = product.category.toLowerCase()
  const isOuterwear = category.includes('jacket')

  return [
    {
      questionKey: 'productDetail.question.fit',
      answerKey: isOuterwear
        ? 'productDetail.question.outerwearAnswer'
        : 'productDetail.question.defaultFitAnswer',
    },
    {
      questionKey: 'productDetail.question.arrival',
      answerKey: 'productDetail.question.arrivalAnswer',
    },
    {
      questionKey: 'productDetail.question.return',
      answerKey: 'productDetail.question.returnAnswer',
    },
  ]
}

const fitFeedbackRules: Array<{
  readonly labelKey: TranslationKey
  readonly helperKey: TranslationKey
  readonly keywords: string[]
}> = [
  {
    labelKey: 'productDetail.fitFeedback.true',
    helperKey: 'productDetail.fitFeedback.trueHelp',
    keywords: ['true to size', 'usual size', 'regular size', 'fits well', 'fits perfectly'],
  },
  {
    labelKey: 'productDetail.fitFeedback.roomy',
    helperKey: 'productDetail.fitFeedback.roomyHelp',
    keywords: ['roomy', 'relaxed', 'layer', 'layering', 'space', 'loose'],
  },
  {
    labelKey: 'productDetail.fitFeedback.small',
    helperKey: 'productDetail.fitFeedback.smallHelp',
    keywords: ['runs small', 'tight', 'snug', 'size up', 'sizing up'],
  },
  {
    labelKey: 'productDetail.fitFeedback.oversized',
    helperKey: 'productDetail.fitFeedback.oversizedHelp',
    keywords: ['oversized', 'boxy', 'dropped shoulder', 'big fit'],
  },
]

const getFitFeedback = (reviews: ProductReview[]): FitFeedback[] => {
  const counts = new Map<TranslationKey, number>()

  for (const review of reviews) {
    const reviewText = `${review.title} ${review.body}`.toLowerCase()

    for (const rule of fitFeedbackRules) {
      if (rule.keywords.some((keyword) => reviewText.includes(keyword))) {
        counts.set(rule.labelKey, (counts.get(rule.labelKey) ?? 0) + 1)
      }
    }
  }

  return fitFeedbackRules
    .map((rule) => ({
      labelKey: rule.labelKey,
      helperKey: rule.helperKey,
      count: counts.get(rule.labelKey) ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((first, second) => second.count - first.count)
    .slice(0, 3)
}

export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { productId = '' } = useParams()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const sizeGuide = useDisclosure()
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>()
  const [selectedSize, setSelectedSize] = useState<string>()
  const [selectedColor, setSelectedColor] = useState<string>()
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [selectedWaitlistVariantSku, setSelectedWaitlistVariantSku] = useState('')
  const [joinedWaitlistLabel, setJoinedWaitlistLabel] = useState<string>()
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
  const priceDetails = product ? getProductPriceDetails(product) : undefined
  const selectedMedia = productMedia[Math.min(selectedMediaIndex, productMedia.length - 1)]
  const ratingSummary = reviewsData?.summary ?? product?.ratingSummary
  const reviews = reviewsData?.reviews ?? []
  const fitFeedback = getFitFeedback(reviews)
  const isWishlisted = useAppSelector(selectIsWishlisted(productId))
  const variants = product?.variants ?? []
  const soldOutVariants = getSoldOutVariants(variants)
  const activeWaitlistVariantSku = selectedWaitlistVariantSku || soldOutVariants[0]?.sku || ''
  const activeWaitlistVariant = soldOutVariants.find(
    (variant) => variant.sku === activeWaitlistVariantSku
  )
  const variantSizes = getUniqueVariantValues(variants, 'size')
  const variantColors = getUniqueVariantValues(variants, 'color')
  const hasSizeChoices = variantSizes.length > 0
  const hasColorChoices = variantColors.length > 0
  const hasStructuredChoices = hasSizeChoices || hasColorChoices
  const selectedVariant = variants.find((variant) => variant.sku === selectedVariantSku)
  const selectedVariantLabel = selectedVariant ? getVariantLabel(selectedVariant) : undefined
  const variantStockMessage = selectedVariant
    ? selectedVariant.stockQuantity <= 0
      ? t('productDetail.variantSoldOut', { variant: selectedVariantLabel })
      : selectedVariant.stockQuantity <= 5
        ? t('productDetail.variantLowStock', {
            count: selectedVariant.stockQuantity,
            variant: selectedVariantLabel,
          })
        : t('productDetail.variantAvailable', {
            count: selectedVariant.stockQuantity,
            variant: selectedVariantLabel,
          })
    : hasStructuredChoices
      ? t('productDetail.chooseAvailability', {
          choice:
            hasSizeChoices && hasColorChoices
              ? t('productDetail.sizeAndColor')
              : hasSizeChoices
                ? t('productDetail.sizeOnly')
                : t('productDetail.colorOnly'),
        })
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
        title: t('productDetail.chooseOptionFirst'),
        description: t('productDetail.chooseOptionFirstCopy'),
        status: 'warning',
        duration: 2400,
        isClosable: true,
        position: 'bottom-right',
      })
      return
    }

    if (selectedVariant && selectedVariant.stockQuantity <= 0) {
      toast({
        title: t('productDetail.optionSoldOut'),
        description: t('productDetail.optionSoldOutCopy'),
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
      title: t('product.addedToCart', { product: product.name }),
      description: selectedVariantLabel
        ? t('product.variantInBag', { variant: selectedVariantLabel })
        : t('product.cartReady'),
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
      title: isWishlisted
        ? t('product.removedFromWishlist', { product: product.name })
        : t('product.savedToast', { product: product.name }),
      status: isWishlisted ? 'info' : 'success',
      duration: 1800,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  const handleJoinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeWaitlistVariant) {
      return
    }

    if (!waitlistEmail.trim()) {
      toast({
        title: t('productDetail.addEmailFirst'),
        description: t('productDetail.addEmailFirstCopy'),
        status: 'warning',
        duration: 2200,
        isClosable: true,
        position: 'bottom-right',
      })
      return
    }

    const variantLabel = getVariantLabel(activeWaitlistVariant)
    setJoinedWaitlistLabel(variantLabel)
    toast({
      title: t('productDetail.onWaitlist', { variant: variantLabel }),
      description: t('productDetail.waitlistSuccessCopy'),
      status: 'success',
      duration: 2400,
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
            {t('productDetail.notFoundTitle')}
          </Heading>
          <Text color="neutral.600" textAlign="center">
            {t('productDetail.notFoundCopy')}
          </Text>
          <HStack spacing={3}>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="outline">
              {t('common.backToShop')}
            </Button>
            <Button onClick={() => refetch()}>{t('common.retry')}</Button>
          </HStack>
        </VStack>
      </Container>
    )
  }

  return (
    <Box>
      <Container maxW="7xl" py={{ base: 6, md: 10 }} pb={{ base: 28, lg: 10 }}>
        <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="ghost" mb={6}>
          {t('common.backToShop')}
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
              <SimpleGrid
                columns={{ base: 4, md: 5 }}
                spacing={3}
                aria-label={t('productDetail.productMediaAria')}
              >
                {productMedia.map((media, index) => {
                  const isSelected = index === selectedMediaIndex

                  return (
                    <Button
                      key={`${media.type}-${media.url}`}
                      aria-label={t('productDetail.showMediaAria', { label: media.label })}
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
                          <Text fontWeight="black">{t('productDetail.video')}</Text>
                          <Text color="neutral.500" fontSize="xs">
                            {t('productDetail.videoLength')}
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
              <HStack align="baseline" spacing={3} flexWrap="wrap">
                <Text fontSize="3xl" fontWeight="black" color="neutral.900">
                  ${priceDetails?.price.toFixed(2)}
                </Text>
                {priceDetails?.compareAtPrice ? (
                  <>
                    <Text color="neutral.500" fontSize="xl" textDecoration="line-through">
                      ${priceDetails.compareAtPrice.toFixed(2)}
                    </Text>
                    <Badge colorScheme="red" borderRadius="full" px={3} py={1}>
                      {t('product.salePercent', { percent: priceDetails.salePercent })}
                    </Badge>
                    <Text color="accent.700" fontSize="sm" fontWeight="black">
                      {t('product.saveAmount', { amount: priceDetails.saleAmount.toFixed(2) })}
                    </Text>
                  </>
                ) : null}
              </HStack>
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
                      {t('productDetail.chooseOption')}
                    </Text>
                  </Box>
                  <Button
                    variant="link"
                    color="neutral.900"
                    fontWeight="black"
                    onClick={sizeGuide.onOpen}
                  >
                    {t('productDetail.sizeGuide')}
                  </Button>
                </HStack>

                {hasSizeChoices ? (
                  <Box>
                    <Text color="neutral.600" fontSize="sm" fontWeight="bold" mb={2}>
                      {t('common.size')}
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
                            aria-label={t('productDetail.selectSizeAria', {
                              size,
                              suffix: hasStock ? '' : t('productDetail.soldOutSuffix'),
                            })}
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
                      {t('home.color')}
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
                            aria-label={t('productDetail.selectColorAria', {
                              color,
                              suffix: hasStock ? '' : t('productDetail.soldOutSuffix'),
                            })}
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
                        {variant.stockQuantity > 0
                          ? t('productDetail.standard')
                          : t('productDetail.soldOut')}
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

                {soldOutVariants.length > 0 ? (
                  <Box
                    as="form"
                    onSubmit={handleJoinWaitlist}
                    border="1px solid"
                    borderColor="neutral.200"
                    borderRadius="lg"
                    bg="neutral.50"
                    p={4}
                  >
                    <Stack spacing={3}>
                      <Box>
                        <Text color="neutral.900" fontWeight="black">
                          {t('productDetail.soldOutInSize')}
                        </Text>
                        <Text color="neutral.600" fontSize="sm">
                          {t('productDetail.waitlistCopy')}
                        </Text>
                      </Box>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl>
                          <FormLabel>{t('productDetail.soldOutOption')}</FormLabel>
                          <Select
                            value={activeWaitlistVariantSku}
                            onChange={(event) => setSelectedWaitlistVariantSku(event.target.value)}
                          >
                            {soldOutVariants.map((variant) => (
                              <option key={variant.sku} value={variant.sku}>
                                {getVariantLabel(variant)}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel>{t('productDetail.waitlistEmail')}</FormLabel>
                          <Input
                            type="email"
                            value={waitlistEmail}
                            onChange={(event) => setWaitlistEmail(event.target.value)}
                            placeholder="you@example.com"
                          />
                        </FormControl>
                      </SimpleGrid>
                      <Flex align={{ base: 'stretch', sm: 'center' }} gap={3} wrap="wrap">
                        <Button type="submit" colorScheme="brand">
                          {t('productDetail.joinWaitlist')}
                        </Button>
                        {joinedWaitlistLabel ? (
                          <Text color="green.700" fontSize="sm" fontWeight="bold">
                            {t('productDetail.waitlistInline', { variant: joinedWaitlistLabel })}
                          </Text>
                        ) : null}
                      </Flex>
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            ) : null}

            <Stack spacing={4}>
              <Text color="neutral.900" fontWeight="black">
                {t('productDetail.fitFabric')}
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {fitProfile
                  ? [
                      [
                        t('productDetail.model'),
                        t('productDetail.modelWearing', {
                          height: fitProfile.modelHeight,
                          size: fitProfile.modelSize,
                        }),
                      ],
                      [t('productDetail.fit'), t(fitProfile.fitKey)],
                      [t('productDetail.material'), t(fitProfile.materialKey)],
                      [t('productDetail.care'), t(fitProfile.careKey)],
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

            {fitFeedback.length > 0 ? (
              <Box
                border="1px solid"
                borderColor="neutral.200"
                borderRadius="lg"
                bg="neutral.50"
                p={4}
              >
                <Text color="accent.600" fontSize="xs" fontWeight="black" textTransform="uppercase">
                  {t('productDetail.fitFeedbackEyebrow')}
                </Text>
                <Text color="neutral.900" fontWeight="black" mt={1} mb={3}>
                  {t('productDetail.fitFeedbackTitle')}
                </Text>
                <SimpleGrid columns={{ base: 1, sm: fitFeedback.length > 1 ? 2 : 1 }} spacing={3}>
                  {fitFeedback.map((item) => (
                    <Box
                      key={item.labelKey}
                      border="1px solid"
                      borderColor="neutral.200"
                      borderRadius="lg"
                      bg="white"
                      p={3}
                    >
                      <Text color="neutral.900" fontWeight="black">
                        {t(item.labelKey)}
                      </Text>
                      <Text color="neutral.600" fontSize="sm">
                        {t('productDetail.fitFeedbackCount', { count: item.count })}
                      </Text>
                      <Text color="neutral.600" fontSize="sm" mt={1}>
                        {t(item.helperKey)}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            ) : null}

            <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
              <Button colorScheme="brand" size="lg" onClick={handleAddToCart}>
                {t('cart.addToCart')}
              </Button>
              <Button
                leftIcon={<StarIcon />}
                variant={isWishlisted ? 'solid' : 'outline'}
                colorScheme={isWishlisted ? 'yellow' : 'gray'}
                size="lg"
                onClick={handleToggleWishlist}
              >
                {isWishlisted ? t('common.saved') : t('common.save')}
              </Button>
              <Button as={RouterLink} to="/checkout" variant="outline" size="lg">
                {t('common.checkout')}
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
              {[
                [t('productDetail.delivery'), t('productDetail.deliveryCopy')],
                [t('cart.returnsClarity'), t('productDetail.returnsCopy')],
                [t('common.checkout'), t('productDetail.checkoutCopy')],
                [t('common.support'), t('productDetail.supportCopy')],
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
              {t('productDetail.productNotes')}
            </Text>
            <Heading as="h2" size="lg" color="neutral.900" mt={1} mb={4}>
              {t('productDetail.whyThisPiece')}
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
                    {t(reason)}
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
              {t('productDetail.quickAnswers')}
            </Text>
            <Heading as="h2" size="lg" color="neutral.900" mt={1} mb={4}>
              {t('productDetail.questionsAsk')}
            </Heading>
            <Stack spacing={4} divider={<Divider />}>
              {productQuestions.map((item) => (
                <Box key={item.questionKey}>
                  <Text color="neutral.900" fontWeight="black">
                    {t(item.questionKey)}
                  </Text>
                  <Text color="neutral.600" fontSize="sm" mt={1}>
                    {t(item.answerKey)}
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
                {t('productDetail.communityRating')}
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                {t('productDetail.reviewsTitle')}
              </Heading>
              <Text color="neutral.600" mt={2}>
                {t('productDetail.averageReviews', {
                  average: ratingSummary.averageRating.toFixed(1),
                  count: ratingSummary.reviewCount,
                })}
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
                {t('productDetail.outfitBuilder')}
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                {t('productDetail.completeFit')}
              </Heading>
              <Text color="neutral.600" mt={2}>
                {t('productDetail.completeFitCopy')}
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
                {t('productDetail.keepBrowsing')}
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                {t('productDetail.recommendedPieces')}
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
            <HStack spacing={2}>
              <Text fontWeight="black">${priceDetails?.price.toFixed(2)}</Text>
              {priceDetails?.compareAtPrice ? (
                <Text color="neutral.500" fontSize="sm" textDecoration="line-through">
                  ${priceDetails.compareAtPrice.toFixed(2)}
                </Text>
              ) : null}
            </HStack>
            <Text color="neutral.500" fontSize="sm" noOfLines={1}>
              {selectedVariantLabel ??
                (variants.length > 0 ? t('productDetail.chooseSizeColor') : product.name)}
            </Text>
          </Box>
          <Button
            aria-label={t('productDetail.stickyAddAria')}
            colorScheme="brand"
            onClick={handleAddToCart}
            minW="136px"
          >
            {t('cart.addToCart')}
          </Button>
        </HStack>
      </Box>

      <Modal isOpen={sizeGuide.isOpen} onClose={sizeGuide.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('productDetail.sizeGuide')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text color="neutral.600" mb={4}>
              {t('productDetail.sizeGuideCopy')}
            </Text>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>{t('common.size')}</Th>
                    <Th>{t('productDetail.chest')}</Th>
                    <Th>{t('productDetail.length')}</Th>
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
              {t('productDetail.needHelp')}{' '}
              <Link as={RouterLink} to="/cart" fontWeight="bold">
                {t('productDetail.reviewBag')}
              </Link>{' '}
              {t('productDetail.beforeCheckout')}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
