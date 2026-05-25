import { ArrowBackIcon } from '@chakra-ui/icons'
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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetProductsQuery,
} from '../api/productsApi'
import { formatCategoryLabel, getRelatedProducts } from '../catalog/catalogFilters'
import ProductList from '../components/ProductList'
import { addItem } from '../slices/cartSlice'
import { useAppDispatch } from '../store/hooks'

export default function ProductDetailPage() {
  const { productId = '' } = useParams()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProductQuery(productId, {
    skip: !productId,
  })
  const { data: products = [] } = useGetProductsQuery()
  const { data: reviewsData } = useGetProductReviewsQuery(productId, {
    skip: !productId,
  })

  const relatedProducts = product ? getRelatedProducts(products, product) : []
  const ratingSummary = reviewsData?.summary ?? product?.ratingSummary
  const reviews = reviewsData?.reviews ?? []

  const handleAddToCart = () => {
    if (!product) {
      return
    }

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
      <Container maxW="7xl" py={{ base: 6, md: 10 }}>
        <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="ghost" mb={6}>
          Back to shop
        </Button>

        <Grid templateColumns={{ base: '1fr', lg: '1.05fr 0.95fr' }} gap={{ base: 8, lg: 12 }}>
          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            overflow="hidden"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              objectFit="cover"
              w="full"
              aspectRatio="4 / 5"
            />
          </Box>

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
              <Stack spacing={3}>
                <Text color="neutral.900" fontWeight="black">
                  Available options
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {product.variants.map((variant) => (
                    <Box
                      key={variant.sku}
                      border="1px solid"
                      borderColor="neutral.200"
                      borderRadius="lg"
                      bg="white"
                      px={4}
                      py={3}
                    >
                      <HStack justify="space-between" align="start">
                        <Box>
                          <Text fontWeight="bold">{variant.sku}</Text>
                          <Text color="neutral.600" fontSize="sm">
                            {[variant.size, variant.color].filter(Boolean).join(' / ') ||
                              'Standard'}
                          </Text>
                        </Box>
                        <Badge colorScheme={variant.stockQuantity > 0 ? 'green' : 'red'}>
                          {variant.stockQuantity > 0
                            ? `${variant.stockQuantity} in stock`
                            : 'Sold out'}
                        </Badge>
                      </HStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            ) : null}

            <Stack spacing={4}>
              <Text color="neutral.900" fontWeight="black">
                Fit notes
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                {['Relaxed shape', 'Layer-ready weight', 'Easy returns'].map((note) => (
                  <Box
                    key={note}
                    border="1px solid"
                    borderColor="neutral.200"
                    borderRadius="lg"
                    bg="white"
                    px={4}
                    py={3}
                    fontWeight="semibold"
                  >
                    {note}
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>

            <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
              <Button colorScheme="brand" size="lg" onClick={handleAddToCart}>
                Add to cart
              </Button>
              <Button as={RouterLink} to="/checkout" variant="outline" size="lg">
                Checkout
              </Button>
            </Flex>
          </Stack>
        </Grid>

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

        {relatedProducts.length > 0 ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Keep browsing
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Related pieces
              </Heading>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <ProductList products={relatedProducts} />
            </SimpleGrid>
          </VStack>
        ) : null}
      </Container>
    </Box>
  )
}
