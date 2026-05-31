import { SearchIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
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
  useDisclosure,
} from '@chakra-ui/react'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { useGetProductsQuery, useGetRecommendationsQuery } from '../api/productsApi'
import {
  ALL_CATEGORIES,
  ALL_PRICES,
  type ProductPriceRange,
  type ProductSort,
  applyProductDiscovery,
  formatCategoryLabel,
  getProductCategories,
  getProductColors,
  getProductSizes,
} from '../catalog/catalogFilters'
import ProductList from '../components/ProductList'
import { useTranslation } from '../i18n'

const sortOptions: { label: string; value: ProductSort }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Latest drops', value: 'newest' },
  { label: 'Most popular', value: 'popular' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Name', value: 'name' },
]

const priceOptions: { label: string; value: ProductPriceRange }[] = [
  { label: 'All prices', value: ALL_PRICES },
  { label: 'Under $30', value: 'under-30' },
  { label: '$30 to $60', value: '30-60' },
  { label: '$60 to $90', value: '60-90' },
  { label: '$90+', value: '90-plus' },
]

const ratingOptions = [
  { label: 'Any rating', value: 0 },
  { label: '4+ stars', value: 4 },
  { label: '4.5+ stars', value: 4.5 },
]

interface AppliedFilter {
  readonly key: string
  readonly label: string
  readonly onRemove: () => void
}

export default function HomePage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useGetProductsQuery()
  const { data: recommendations = [] } = useGetRecommendationsQuery(undefined)
  const filterDrawer = useDisclosure()
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<ProductSort>('featured')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<ProductPriceRange>(ALL_PRICES)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const products = data ?? []
  const categories = useMemo(() => getProductCategories(products), [products])
  const sizes = useMemo(() => getProductSizes(products), [products])
  const colors = useMemo(() => getProductColors(products), [products])
  const visibleProducts = useMemo(
    () =>
      applyProductDiscovery(products, {
        category: activeCategory,
        colors: selectedColors,
        inStockOnly,
        minRating,
        priceRange,
        searchTerm,
        sizes: selectedSizes,
        sort,
      }),
    [
      activeCategory,
      inStockOnly,
      minRating,
      priceRange,
      products,
      searchTerm,
      selectedColors,
      selectedSizes,
      sort,
    ]
  )
  const appliedFilters: AppliedFilter[] = [
    activeCategory !== ALL_CATEGORIES
      ? {
          key: 'category',
          label: formatCategoryLabel(activeCategory),
          onRemove: () => setActiveCategory(ALL_CATEGORIES),
        }
      : undefined,
    searchTerm.trim()
      ? { key: 'search', label: `Search: ${searchTerm.trim()}`, onRemove: () => setSearchTerm('') }
      : undefined,
    ...selectedSizes.map((size) => ({
      key: `size-${size}`,
      label: `Size ${size}`,
      onRemove: () => setSelectedSizes((current) => current.filter((item) => item !== size)),
    })),
    ...selectedColors.map((color) => ({
      key: `color-${color}`,
      label: color,
      onRemove: () => setSelectedColors((current) => current.filter((item) => item !== color)),
    })),
    priceRange !== ALL_PRICES
      ? {
          key: 'price',
          label: priceOptions.find((option) => option.value === priceRange)?.label ?? 'Price',
          onRemove: () => setPriceRange(ALL_PRICES),
        }
      : undefined,
    inStockOnly
      ? { key: 'stock', label: 'In stock', onRemove: () => setInStockOnly(false) }
      : undefined,
    minRating > 0
      ? { key: 'rating', label: `${minRating}+ stars`, onRemove: () => setMinRating(0) }
      : undefined,
  ].filter((filter): filter is AppliedFilter => Boolean(filter))
  const appliedFilterCount = appliedFilters.length
  const clearFilters = () => {
    setActiveCategory(ALL_CATEGORIES)
    setSearchTerm('')
    setSelectedSizes([])
    setSelectedColors([])
    setPriceRange(ALL_PRICES)
    setInStockOnly(false)
    setMinRating(0)
    setSort('featured')
  }
  const toggleSelection = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

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
            <Badge alignSelf="flex-start" bg="accent.600" color="white" px={3} py={1}>
              {t('home.badge')}
            </Badge>
            <Heading as="h1" size={{ base: '2xl', md: '4xl' }} lineHeight="0.95">
              {t('home.heroTitle')}
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="whiteAlpha.900">
              {t('home.heroCopy')}
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Button as="a" href="#collection" colorScheme="accent" size="lg">
                {t('home.shopCollection')}
              </Button>
              <Button as="a" href="#collections" variant="outline" size="lg" borderColor="white">
                {t('home.browseEdits')}
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
            wrap="wrap"
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

            <Button variant="outline" onClick={filterDrawer.onOpen}>
              Filters{appliedFilterCount > 0 ? ` ${appliedFilterCount}` : ''}
            </Button>
          </Flex>

          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap">
            <Text color="neutral.600" fontWeight="semibold">
              Showing {visibleProducts.length} of {products.length} products
            </Text>
            {appliedFilterCount > 0 ? (
              <HStack spacing={2} flexWrap="wrap">
                {appliedFilters.map((filter) => (
                  <Button key={filter.key} size="sm" variant="outline" onClick={filter.onRemove}>
                    {filter.label} x
                  </Button>
                ))}
                <Button size="sm" colorScheme="brand" onClick={clearFilters}>
                  Clear all
                </Button>
              </HStack>
            ) : null}
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
                  clearFilters()
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

        {recommendations.length > 0 ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Recommended
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                Popular right now
              </Heading>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
              <ProductList products={recommendations} />
            </SimpleGrid>
          </VStack>
        ) : null}
      </Container>

      <Drawer isOpen={filterDrawer.isOpen} placement="right" onClose={filterDrawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter collection</DrawerHeader>
          <DrawerBody>
            <Stack spacing={6}>
              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  Size
                </Text>
                <SimpleGrid columns={4} spacing={2}>
                  {sizes.map((size) => {
                    const isSelected = selectedSizes.includes(size)

                    return (
                      <Button
                        key={size}
                        size="sm"
                        variant={isSelected ? 'solid' : 'outline'}
                        colorScheme={isSelected ? 'brand' : 'gray'}
                        aria-label={`Filter size ${size}`}
                        onClick={() => toggleSelection(size, setSelectedSizes)}
                      >
                        {size}
                      </Button>
                    )
                  })}
                </SimpleGrid>
              </Box>

              <Divider />

              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  Color
                </Text>
                <Stack spacing={2}>
                  {colors.map((color) => (
                    <Checkbox
                      key={color}
                      isChecked={selectedColors.includes(color)}
                      onChange={() => toggleSelection(color, setSelectedColors)}
                    >
                      {color}
                    </Checkbox>
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  Price
                </Text>
                <Select
                  value={priceRange}
                  onChange={(event) => setPriceRange(event.target.value as ProductPriceRange)}
                  bg="white"
                  aria-label="Filter by price"
                >
                  {priceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  Rating
                </Text>
                <Select
                  value={minRating}
                  onChange={(event) => setMinRating(Number(event.target.value))}
                  bg="white"
                  aria-label="Filter by rating"
                >
                  {ratingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>

              <Checkbox isChecked={inStockOnly} onChange={() => setInStockOnly((value) => !value)}>
                In stock only
              </Checkbox>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={clearFilters}>
              Clear
            </Button>
            <Button colorScheme="brand" onClick={filterDrawer.onClose}>
              Show {visibleProducts.length} products
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
