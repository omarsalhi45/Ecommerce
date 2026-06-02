import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  HStack,
  Heading,
  Image,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useGetProductsQuery } from '../api/productsApi'
import { useTranslation } from '../i18n'
import {
  FREE_SHIPPING_THRESHOLD,
  addItem,
  calculateCartSummary,
  decrementItem,
  getCartLineKey,
  removeItem,
  selectCartItems,
} from '../slices/cartSlice'
import {
  addWishlistItem,
  removeWishlistItem,
  selectWishlistProductIds,
} from '../slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Product } from '../types'

const getRecommendedCartProducts = (excludedProductIds: string[], products: Product[]) =>
  products
    .filter((product) => !excludedProductIds.includes(product.id))
    .sort((first, second) => (second.popularityScore ?? 0) - (first.popularityScore ?? 0))
    .slice(0, 3)

const getDefaultVariant = (product: Product) =>
  product.variants?.find((variant) => variant.stockQuantity > 0)

export default function CartPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const cartItems = useAppSelector(selectCartItems)
  const wishlistProductIds = useAppSelector(selectWishlistProductIds)
  const { data: products = [] } = useGetProductsQuery()
  const cartProductIds = cartItems.map((item) => item.productId)
  const savedForLaterProducts = products.filter(
    (product) => wishlistProductIds.includes(product.id) && !cartProductIds.includes(product.id)
  )
  const recommendedProducts = getRecommendedCartProducts(
    [...cartProductIds, ...wishlistProductIds],
    products
  )

  const enrichedItems = cartItems.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }))

  const summary = calculateCartSummary(cartItems, products)
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - summary.subtotal)
  const freeShippingProgress =
    summary.subtotal > 0 ? Math.min((summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100) : 0
  const saveForLater = (item: (typeof enrichedItems)[number]) => {
    dispatch(addWishlistItem({ productId: item.productId }))
    dispatch(removeItem({ productId: item.productId, variantSku: item.variantSku }))
    toast({
      title: t('cart.itemSavedForLater', { product: item.product?.name ?? t('common.item') }),
      status: 'success',
      duration: 1800,
      isClosable: true,
    })
  }
  const moveSavedProductToCart = (product: Product) => {
    const variant = getDefaultVariant(product)

    dispatch(
      addItem({
        productId: product.id,
        variantSku: variant?.sku,
        size: variant?.size,
        color: variant?.color,
      })
    )
    dispatch(removeWishlistItem({ productId: product.id }))
    toast({
      title: t('cart.movedToCart', { product: product.name }),
      status: 'success',
      duration: 1800,
      isClosable: true,
    })
  }

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={8} align="start">
        <VStack flex={1} align="stretch" spacing={5}>
          <Box>
            <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
              {t('cart.eyebrow')}
            </Text>
            <Heading>{t('cart.title')}</Heading>
          </Box>

          {enrichedItems.length === 0 ? (
            <VStack
              py={16}
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              bg="white"
            >
              <Text fontWeight="bold">{t('cart.emptyTitle')}</Text>
              <Text color="neutral.600">{t('cart.emptyCopy')}</Text>
              <Button as={RouterLink} to="/" colorScheme="brand">
                {t('common.continueShopping')}
              </Button>
            </VStack>
          ) : (
            enrichedItems.map((item) => (
              <HStack
                key={getCartLineKey(item)}
                bg="white"
                border="1px solid"
                borderColor="neutral.200"
                borderRadius="lg"
                p={4}
                align="center"
                spacing={4}
              >
                {item.product ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    boxSize={{ base: '86px', md: '112px' }}
                    objectFit="cover"
                    borderRadius="md"
                  />
                ) : null}
                <Box flex={1}>
                  <Text fontWeight="black">{item.product?.name ?? item.productId}</Text>
                  {[item.size, item.color].filter(Boolean).length > 0 ? (
                    <Text color="neutral.500" fontSize="sm" fontWeight="semibold">
                      {[item.size, item.color].filter(Boolean).join(' / ')}
                    </Text>
                  ) : null}
                  <Text color="neutral.600">${(item.product?.price ?? 0).toFixed(2)}</Text>
                  <HStack mt={3}>
                    <Button
                      size="sm"
                      onClick={() =>
                        dispatch(
                          decrementItem({
                            productId: item.productId,
                            variantSku: item.variantSku,
                          })
                        )
                      }
                    >
                      -
                    </Button>
                    <Text minW={8} textAlign="center" fontWeight="bold">
                      {item.quantity}
                    </Text>
                    <Button
                      size="sm"
                      onClick={() =>
                        dispatch(
                          addItem({
                            productId: item.productId,
                            variantSku: item.variantSku,
                            size: item.size,
                            color: item.color,
                          })
                        )
                      }
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        dispatch(
                          removeItem({
                            productId: item.productId,
                            variantSku: item.variantSku,
                          })
                        )
                      }
                    >
                      {t('common.remove')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => saveForLater(item)}>
                      {t('cart.saveForLater')}
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            ))
          )}

          {savedForLaterProducts.length > 0 ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              p={{ base: 4, md: 5 }}
            >
              <HStack justify="space-between" align="start" mb={4}>
                <Box>
                  <Text
                    color="accent.600"
                    fontSize="sm"
                    fontWeight="black"
                    textTransform="uppercase"
                  >
                    {t('cart.savedForLater')}
                  </Text>
                  <Heading as="h2" size="md">
                    {t('cart.notReady')}
                  </Heading>
                </Box>
                <Badge colorScheme="yellow" borderRadius="full" px={3} py={1}>
                  {t('cart.savedCount', { count: savedForLaterProducts.length })}
                </Badge>
              </HStack>
              <Stack spacing={3}>
                {savedForLaterProducts.map((product) => (
                  <HStack
                    key={product.id}
                    border="1px solid"
                    borderColor="neutral.200"
                    borderRadius="lg"
                    p={3}
                    spacing={3}
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      boxSize="72px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <Box flex={1}>
                      <Text fontWeight="black">{product.name}</Text>
                      <Text color="neutral.600" fontSize="sm">
                        ${product.price.toFixed(2)}
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveSavedProductToCart(product)}
                    >
                      {t('cart.moveToCart')}
                    </Button>
                  </HStack>
                ))}
              </Stack>
            </Box>
          ) : null}

          {enrichedItems.length > 0 && recommendedProducts.length > 0 ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              p={{ base: 4, md: 5 }}
            >
              <HStack justify="space-between" align="start" mb={4}>
                <Box>
                  <Text
                    color="accent.600"
                    fontSize="sm"
                    fontWeight="black"
                    textTransform="uppercase"
                  >
                    {t('cart.addOnPicks')}
                  </Text>
                  <Heading as="h2" size="md">
                    {t('cart.completeCart')}
                  </Heading>
                </Box>
                <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                  {t('cart.shipsTogether')}
                </Badge>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                {recommendedProducts.map((product) => {
                  const variant = getDefaultVariant(product)

                  return (
                    <Box
                      key={product.id}
                      border="1px solid"
                      borderColor="neutral.200"
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        aspectRatio="4 / 3"
                        objectFit="cover"
                        w="full"
                      />
                      <Stack spacing={2} p={3}>
                        <Text fontWeight="black" noOfLines={1}>
                          {product.name}
                        </Text>
                        <Text color="neutral.600" fontSize="sm">
                          ${product.price.toFixed(2)}
                        </Text>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            dispatch(
                              addItem({
                                productId: product.id,
                                variantSku: variant?.sku,
                                size: variant?.size,
                                color: variant?.color,
                              })
                            )
                          }
                        >
                          {t('cart.addToCart')}
                        </Button>
                      </Stack>
                    </Box>
                  )
                })}
              </SimpleGrid>
            </Box>
          ) : null}
        </VStack>

        <Box
          w={{ base: 'full', lg: '360px' }}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={6}
        >
          <Heading as="h2" size="md" mb={4}>
            {t('cart.summary')}
          </Heading>
          {summary.subtotal > 0 ? (
            <Box
              border="1px solid"
              borderColor={freeShippingRemaining > 0 ? 'neutral.200' : 'green.200'}
              bg={freeShippingRemaining > 0 ? 'neutral.50' : 'green.50'}
              borderRadius="lg"
              p={4}
              mb={4}
            >
              <Text color="neutral.800" fontWeight="black" fontSize="sm">
                {freeShippingRemaining > 0
                  ? t('cart.awayFromFreeShipping', { amount: freeShippingRemaining.toFixed(2) })
                  : t('cart.freeShippingUnlocked')}
              </Text>
              <Box bg="white" borderRadius="full" h="8px" mt={3} overflow="hidden">
                <Box bg="black" h="full" w={`${freeShippingProgress}%`} />
              </Box>
            </Box>
          ) : null}
          <HStack justify="space-between">
            <Text color="neutral.600">{t('cart.subtotal')}</Text>
            <Text fontWeight="black">${summary.subtotal.toFixed(2)}</Text>
          </HStack>
          <HStack justify="space-between" mt={2}>
            <Text color="neutral.600">{t('cart.shipping')}</Text>
            <Text fontWeight="semibold">${summary.shipping.toFixed(2)}</Text>
          </HStack>
          <HStack justify="space-between" mt={2}>
            <Text color="neutral.600">{t('cart.tax')}</Text>
            <Text fontWeight="semibold">${summary.tax.toFixed(2)}</Text>
          </HStack>
          <Divider my={4} />
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="black">{t('cart.estimatedTotal')}</Text>
            <Text fontWeight="black">${summary.total.toFixed(2)}</Text>
          </HStack>
          <Text color="neutral.500" fontSize="sm" mb={4}>
            {t('cart.recalculatedCopy')}
          </Text>
          <SimpleGrid columns={1} spacing={3} mb={5}>
            {[
              [t('cart.deliveryEstimate'), t('cart.deliveryEstimateCopy')],
              [t('common.securePayment'), t('cart.securePaymentCopy')],
              [t('cart.returnsClarity'), t('cart.returnsClarityCopy')],
            ].map(([title, body]) => (
              <Box
                key={title}
                border="1px solid"
                borderColor="neutral.200"
                borderRadius="lg"
                bg="neutral.50"
                p={3}
              >
                <Text color="neutral.900" fontWeight="black" fontSize="sm">
                  {title}
                </Text>
                <Text color="neutral.600" fontSize="sm">
                  {body}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
          {cartItems.length === 0 ? (
            <Button colorScheme="brand" w="full" isDisabled>
              {t('common.checkout')}
            </Button>
          ) : (
            <Button as={RouterLink} to="/checkout" colorScheme="brand" w="full">
              {t('common.checkout')}
            </Button>
          )}
        </Box>
      </Stack>
    </Container>
  )
}
