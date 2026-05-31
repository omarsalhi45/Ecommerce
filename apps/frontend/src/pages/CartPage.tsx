import {
  Box,
  Button,
  Container,
  Divider,
  HStack,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useGetProductsQuery } from '../api/productsApi'
import {
  FREE_SHIPPING_THRESHOLD,
  addItem,
  calculateCartSummary,
  decrementItem,
  getCartLineKey,
  removeItem,
  selectCartItems,
} from '../slices/cartSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(selectCartItems)
  const { data: products = [] } = useGetProductsQuery()

  const enrichedItems = cartItems.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }))

  const summary = calculateCartSummary(cartItems, products)
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - summary.subtotal)
  const freeShippingProgress =
    summary.subtotal > 0 ? Math.min((summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100) : 0

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={8} align="start">
        <VStack flex={1} align="stretch" spacing={5}>
          <Box>
            <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
              Your bag
            </Text>
            <Heading>Cart</Heading>
          </Box>

          {enrichedItems.length === 0 ? (
            <VStack
              py={16}
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              bg="white"
            >
              <Text fontWeight="bold">Your cart is empty.</Text>
              <Text color="neutral.600">
                Pick a few pieces and come back when the fit is ready.
              </Text>
              <Button as={RouterLink} to="/" colorScheme="brand">
                Continue shopping
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
                      Remove
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            ))
          )}
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
            Summary
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
                  ? `$${freeShippingRemaining.toFixed(2)} away from free shipping`
                  : 'Free shipping unlocked'}
              </Text>
              <Box bg="white" borderRadius="full" h="8px" mt={3} overflow="hidden">
                <Box bg="black" h="full" w={`${freeShippingProgress}%`} />
              </Box>
            </Box>
          ) : null}
          <HStack justify="space-between">
            <Text color="neutral.600">Subtotal</Text>
            <Text fontWeight="black">${summary.subtotal.toFixed(2)}</Text>
          </HStack>
          <HStack justify="space-between" mt={2}>
            <Text color="neutral.600">Shipping</Text>
            <Text fontWeight="semibold">${summary.shipping.toFixed(2)}</Text>
          </HStack>
          <HStack justify="space-between" mt={2}>
            <Text color="neutral.600">Tax</Text>
            <Text fontWeight="semibold">${summary.tax.toFixed(2)}</Text>
          </HStack>
          <Divider my={4} />
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="black">Estimated total</Text>
            <Text fontWeight="black">${summary.total.toFixed(2)}</Text>
          </HStack>
          <Text color="neutral.500" fontSize="sm" mb={4}>
            Final totals are recalculated by the API when the order is created.
          </Text>
          {cartItems.length === 0 ? (
            <Button colorScheme="brand" w="full" isDisabled>
              Checkout
            </Button>
          ) : (
            <Button as={RouterLink} to="/checkout" colorScheme="brand" w="full">
              Checkout
            </Button>
          )}
        </Box>
      </Stack>
    </Container>
  )
}
