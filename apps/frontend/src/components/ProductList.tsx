import { Badge, Box, Button, HStack, Image, Text, VStack, useToast } from '@chakra-ui/react'
import { addItem } from '../slices/cartSlice'
import { useAppDispatch } from '../store/hooks'
import type { Product } from '../types'

export default function ProductList({ products }: { products: Product[] }) {
  const dispatch = useAppDispatch()
  const toast = useToast()

  const handleAddToCart = (product: Product) => {
    dispatch(addItem({ productId: product.id }))
    toast({
      title: `${product.name} added to cart`,
      description: 'Your cart is ready when you are.',
      status: 'success',
      duration: 2200,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  return (
    <>
      {products.map((product) => (
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
            <Badge
              position="absolute"
              top={3}
              right={3}
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
            </VStack>

            <HStack justify="space-between" w="full" align="center" gap={3}>
              <Text fontSize="2xl" fontWeight="black" color="neutral.900" letterSpacing="tight">
                ${product.price.toFixed(2)}
              </Text>
              <Button
                colorScheme="brand"
                size="md"
                borderRadius="full"
                fontWeight="semibold"
                px={5}
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'md',
                }}
                onClick={() => handleAddToCart(product)}
              >
                Add
              </Button>
            </HStack>
          </VStack>
        </Box>
      ))}
    </>
  )
}
