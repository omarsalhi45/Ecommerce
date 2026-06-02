import {
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
  Image,
  Stack,
  Text,
  VStack,
  useToast,
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
import { closeMiniCart, selectIsMiniCartOpen } from '../slices/cartUiSlice'
import { addWishlistItem } from '../slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function MiniCartDrawer() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const isOpen = useAppSelector(selectIsMiniCartOpen)
  const cartItems = useAppSelector(selectCartItems)
  const { data: products = [] } = useGetProductsQuery()
  const summary = calculateCartSummary(cartItems, products)
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - summary.subtotal)
  const freeShippingProgress =
    summary.subtotal > 0 ? Math.min((summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100) : 0
  const enrichedItems = cartItems.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }))

  const handleClose = () => dispatch(closeMiniCart())
  const saveForLater = (item: (typeof enrichedItems)[number]) => {
    dispatch(addWishlistItem({ productId: item.productId }))
    dispatch(removeItem({ productId: item.productId, variantSku: item.variantSku }))
    toast({
      title: `${item.product?.name ?? 'Item'} saved for later`,
      status: 'success',
      duration: 1800,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">Added to your cart</DrawerHeader>
        <DrawerBody>
          <Stack spacing={5} py={2}>
            {summary.subtotal > 0 ? (
              <Box
                border="1px solid"
                borderColor={freeShippingRemaining > 0 ? 'neutral.200' : 'green.200'}
                bg={freeShippingRemaining > 0 ? 'neutral.50' : 'green.50'}
                borderRadius="lg"
                p={4}
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

            <VStack align="stretch" spacing={4}>
              {enrichedItems.map((item) => (
                <Stack
                  key={getCartLineKey(item)}
                  border="1px solid"
                  borderColor="neutral.200"
                  borderRadius="lg"
                  p={3}
                  spacing={3}
                >
                  <HStack align="center" spacing={3}>
                    {item.product ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        boxSize="72px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    ) : null}
                    <Box flex={1} minW={0}>
                      <Text color="neutral.900" fontWeight="black" noOfLines={1}>
                        {item.product?.name ?? item.productId}
                      </Text>
                      {[item.size, item.color].filter(Boolean).length > 0 ? (
                        <Text color="neutral.500" fontSize="sm" fontWeight="semibold">
                          {[item.size, item.color].filter(Boolean).join(' / ')}
                        </Text>
                      ) : null}
                      <Text color="neutral.600" fontSize="sm">
                        Qty {item.quantity}
                      </Text>
                    </Box>
                    <Text color="neutral.900" fontWeight="black">
                      ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack flexWrap="wrap" spacing={2}>
                    <Button
                      size="xs"
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
                    <Button
                      size="xs"
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
                      size="xs"
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
                    <Button size="xs" variant="outline" onClick={() => saveForLater(item)}>
                      Save for later
                    </Button>
                  </HStack>
                </Stack>
              ))}
            </VStack>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" display="block">
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="black">Estimated total</Text>
            <Text fontWeight="black">${summary.total.toFixed(2)}</Text>
          </HStack>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
            <Button as={RouterLink} to="/cart" variant="outline" flex={1} onClick={handleClose}>
              View cart
            </Button>
            <Button
              as={RouterLink}
              to="/checkout"
              colorScheme="brand"
              flex={1}
              onClick={handleClose}
            >
              Checkout
            </Button>
          </Stack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
