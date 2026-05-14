import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useGetProductsQuery } from '../api/productsApi'
import ProductList from '../components/ProductList'

const collections = ['New drops', 'Street layers', 'Everyday tees', 'Weekend fits']

export default function HomePage() {
  const { data, isLoading, error, refetch } = useGetProductsQuery()

  if (isLoading) {
    return (
      <Container maxW="7xl" py={10}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} h="420px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      </Container>
    )
  }

  if (error) {
    return (
      <VStack spacing={4} py={20}>
        <Text color="error.500" fontSize="lg" fontWeight="semibold">
          We could not load the collection.
        </Text>
        <Text color="neutral.600">Check the API connection and try again.</Text>
        <Button onClick={() => refetch()}>Retry</Button>
      </VStack>
    )
  }

  const products = data ?? []

  return (
    <Box>
      <Box
        bgImage="linear-gradient(90deg, rgb(0 0 0 / 0.78), rgb(0 0 0 / 0.18)), url('https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=80')"
        bgSize="cover"
        bgPosition="center"
        color="white"
      >
        <Container maxW="7xl" py={{ base: 16, md: 24 }}>
          <Stack spacing={6} maxW="2xl">
            <Badge alignSelf="flex-start" bg="accent.500" color="white" px={3} py={1}>
              New season essentials
            </Badge>
            <Heading as="h1" size="4xl" lineHeight="0.95">
              Clothes made for fast days and late nights.
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="whiteAlpha.900">
              OSAI brings clean streetwear pieces with sharp silhouettes, easy layering, and a
              checkout flow built to stay out of your way.
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Button as="a" href="#collection" colorScheme="accent" size="lg">
                Shop collection
              </Button>
              <Button as="a" href="#collections" variant="outline" size="lg" borderColor="white">
                Browse edits
              </Button>
            </HStack>
          </Stack>
        </Container>
      </Box>

      <Container maxW="7xl" py={{ base: 8, md: 12 }}>
        <VStack id="collections" align="stretch" spacing={8}>
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap">
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Curated edits
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Shop by mood
              </Heading>
            </Box>
            <Text color="neutral.600" maxW="lg">
              Start with the fit you need today, then build the rest of the cart around it.
            </Text>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {collections.map((collection) => (
              <Box
                key={collection}
                bg="white"
                border="1px solid"
                borderColor="neutral.200"
                borderRadius="lg"
                p={5}
              >
                <Text fontWeight="black" color="neutral.900">
                  {collection}
                </Text>
                <Text color="neutral.500" fontSize="sm">
                  Explore now
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>

        <VStack id="collection" spacing={8} align="stretch" mt={{ base: 12, md: 16 }}>
          <Flex justify="space-between" align={{ base: 'start', md: 'end' }} gap={4} wrap="wrap">
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Featured collection
              </Text>
              <Heading as="h2" size="2xl" color="neutral.900">
                Built for repeat wear
              </Heading>
            </Box>
            <Text color="neutral.600" maxW="xl">
              Premium-feeling pieces with simple styling, practical prices, and easy cart actions.
            </Text>
          </Flex>

          {products.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
              <ProductList products={products} />
            </SimpleGrid>
          ) : (
            <VStack py={16} border="1px solid" borderColor="neutral.200" borderRadius="lg">
              <Text fontWeight="bold">No products available yet.</Text>
              <Text color="neutral.600">Add products in the API to fill the storefront.</Text>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
