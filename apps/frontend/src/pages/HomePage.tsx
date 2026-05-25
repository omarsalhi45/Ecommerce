import { SearchIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useGetProductsQuery } from '../api/productsApi'
import {
  ALL_CATEGORIES,
  type ProductSort,
  applyProductDiscovery,
  formatCategoryLabel,
  getProductCategories,
} from '../catalog/catalogFilters'
import ProductList from '../components/ProductList'

const sortOptions: { label: string; value: ProductSort }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Latest drops', value: 'newest' },
  { label: 'Most popular', value: 'popular' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Name', value: 'name' },
]

export default function HomePage() {
  const { data, isLoading, error, refetch } = useGetProductsQuery()
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<ProductSort>('featured')
  const products = data ?? []
  const categories = useMemo(() => getProductCategories(products), [products])
  const visibleProducts = useMemo(
    () =>
      applyProductDiscovery(products, {
        category: activeCategory,
        searchTerm,
        sort,
      }),
    [activeCategory, products, searchTerm, sort]
  )

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
            {[ALL_CATEGORIES, ...categories].map((category) => (
              <Button
                key={category}
                minH={24}
                h="auto"
                justifyContent="flex-start"
                alignItems="flex-start"
                flexDirection="column"
                bg={activeCategory === category ? 'black' : 'white'}
                color={activeCategory === category ? 'white' : 'neutral.900'}
                border="1px solid"
                borderColor={activeCategory === category ? 'black' : 'neutral.200'}
                borderRadius="lg"
                p={5}
                onClick={() => setActiveCategory(category)}
                _hover={{
                  bg: activeCategory === category ? 'black' : 'neutral.50',
                  borderColor: 'accent.400',
                }}
              >
                <Text
                  fontWeight="black"
                  color={activeCategory === category ? 'white' : 'neutral.900'}
                >
                  {category === ALL_CATEGORIES ? 'All pieces' : formatCategoryLabel(category)}
                </Text>
                <Text
                  color={activeCategory === category ? 'whiteAlpha.800' : 'neutral.500'}
                  fontSize="sm"
                >
                  {category === ALL_CATEGORIES
                    ? `${products.length} products`
                    : 'Filter collection'}
                </Text>
              </Button>
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

          <Flex
            gap={3}
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <InputGroup maxW={{ base: 'full', md: 'md' }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="neutral.500" />
              </InputLeftElement>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tees, jackets, hoodies"
                aria-label="Search products"
                bg="white"
              />
            </InputGroup>

            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              maxW={{ base: 'full', md: '64' }}
              bg="white"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Flex>

          {products.length > 0 && visibleProducts.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
              <ProductList products={visibleProducts} />
            </SimpleGrid>
          ) : products.length > 0 ? (
            <VStack py={16} border="1px solid" borderColor="neutral.200" borderRadius="lg">
              <Text fontWeight="bold">No products match those filters.</Text>
              <Text color="neutral.600">Try a different search or category.</Text>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory(ALL_CATEGORIES)
                  setSearchTerm('')
                  setSort('featured')
                }}
              >
                Clear filters
              </Button>
            </VStack>
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
