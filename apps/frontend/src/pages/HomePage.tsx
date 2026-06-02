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
  getNoResultsRecommendations,
  getProductCategories,
  getProductColors,
  getProductSizes,
  getSearchSuggestions,
} from '../catalog/catalogFilters'
import ProductList from '../components/ProductList'
import { useTranslation } from '../i18n'

const sortOptions: { labelKey: TranslationKey; value: ProductSort }[] = [
  { labelKey: 'home.sort.featured', value: 'featured' },
  { labelKey: 'home.sort.newest', value: 'newest' },
  { labelKey: 'home.sort.popular', value: 'popular' },
  { labelKey: 'home.sort.priceAsc', value: 'price-asc' },
  { labelKey: 'home.sort.priceDesc', value: 'price-desc' },
  { labelKey: 'home.sort.name', value: 'name' },
]

const priceOptions: { labelKey: TranslationKey; value: ProductPriceRange }[] = [
  { labelKey: 'home.price.all', value: ALL_PRICES },
  { labelKey: 'home.price.under30', value: 'under-30' },
  { labelKey: 'home.price.30to60', value: '30-60' },
  { labelKey: 'home.price.60to90', value: '60-90' },
  { labelKey: 'home.price.90plus', value: '90-plus' },
]

const ratingOptions: { labelKey: TranslationKey; value: number }[] = [
  { labelKey: 'home.rating.any', value: 0 },
  { labelKey: 'home.rating.4plus', value: 4 },
  { labelKey: 'home.rating.45plus', value: 4.5 },
]

type TranslationKey = Parameters<ReturnType<typeof useTranslation>['t']>[0]

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
  const [isSearchFocused, setIsSearchFocused] = useState(false)
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
  const searchSuggestions = useMemo(
    () => getSearchSuggestions(products, searchTerm),
    [products, searchTerm]
  )
  const noResultsRecommendations = useMemo(
    () =>
      getNoResultsRecommendations(products, {
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
      ? {
          key: 'search',
          label: t('home.searchChip', { term: searchTerm.trim() }),
          onRemove: () => setSearchTerm(''),
        }
      : undefined,
    ...selectedSizes.map((size) => ({
      key: `size-${size}`,
      label: t('home.sizeChip', { size }),
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
          label: t(
            priceOptions.find((option) => option.value === priceRange)?.labelKey ??
              'home.priceChipFallback'
          ),
          onRemove: () => setPriceRange(ALL_PRICES),
        }
      : undefined,
    inStockOnly
      ? { key: 'stock', label: t('home.inStock'), onRemove: () => setInStockOnly(false) }
      : undefined,
    minRating > 0
      ? {
          key: 'rating',
          label: t('home.starsPlus', { rating: minRating }),
          onRemove: () => setMinRating(0),
        }
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
          {t('home.loadErrorTitle')}
        </Text>
        <Text color="neutral.600">{t('home.loadErrorCopy')}</Text>
        <Button onClick={() => refetch()}>{t('common.retry')}</Button>
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
                {t('home.curatedEyebrow')}
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                {t('home.shopByMood')}
              </Heading>
            </Box>
            <Text color="neutral.600" maxW="lg">
              {t('home.shopByMoodCopy')}
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
                  {category === ALL_CATEGORIES
                    ? t('home.allPieces')
                    : formatCategoryLabel(category)}
                </Text>
                <Text
                  color={activeCategory === category ? 'whiteAlpha.800' : 'neutral.500'}
                  fontSize="sm"
                >
                  {category === ALL_CATEGORIES
                    ? t('home.productCount', { count: products.length })
                    : t('home.filterCollection')}
                </Text>
              </Button>
            ))}
          </SimpleGrid>
        </VStack>

        <VStack id="collection" spacing={8} align="stretch" mt={{ base: 12, md: 16 }}>
          <Flex justify="space-between" align={{ base: 'start', md: 'end' }} gap={4} wrap="wrap">
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                {t('home.featuredEyebrow')}
              </Text>
              <Heading as="h2" size="2xl" color="neutral.900">
                {t('home.featuredTitle')}
              </Heading>
            </Box>
            <Text color="neutral.600" maxW="xl">
              {t('home.featuredCopy')}
            </Text>
          </Flex>

          <Flex
            gap={3}
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            wrap="wrap"
          >
            <Box position="relative" w="full" maxW={{ base: 'full', md: 'md' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="neutral.500" />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={t('home.searchPlaceholder')}
                  aria-label={t('home.searchAria')}
                  bg="white"
                />
              </InputGroup>

              {isSearchFocused && searchSuggestions.length > 0 ? (
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor="neutral.200"
                  borderRadius="lg"
                  boxShadow="lg"
                  left={0}
                  mt={2}
                  p={2}
                  position="absolute"
                  right={0}
                  zIndex={5}
                >
                  <Stack spacing={1}>
                    {searchSuggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        justifyContent="flex-start"
                        size="sm"
                        variant="ghost"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          setSearchTerm(suggestion)
                          setIsSearchFocused(false)
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Box>

            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              maxW={{ base: 'full', md: '64' }}
              bg="white"
              aria-label={t('home.sortAria')}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>

            <Button variant="outline" onClick={filterDrawer.onOpen}>
              {appliedFilterCount > 0
                ? t('home.filtersWithCount', { count: appliedFilterCount })
                : t('home.filters')}
            </Button>
          </Flex>

          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap">
            <Text color="neutral.600" fontWeight="semibold">
              {t('home.showingProducts', {
                visible: visibleProducts.length,
                total: products.length,
              })}
            </Text>
            {appliedFilterCount > 0 ? (
              <HStack spacing={2} flexWrap="wrap">
                {appliedFilters.map((filter) => (
                  <Button key={filter.key} size="sm" variant="outline" onClick={filter.onRemove}>
                    {filter.label} x
                  </Button>
                ))}
                <Button size="sm" colorScheme="brand" onClick={clearFilters}>
                  {t('common.clearAll')}
                </Button>
              </HStack>
            ) : null}
          </Flex>

          {products.length > 0 && visibleProducts.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
              <ProductList products={visibleProducts} />
            </SimpleGrid>
          ) : products.length > 0 ? (
            <VStack
              align="stretch"
              py={10}
              px={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="lg"
              bg="white"
            >
              <VStack spacing={3}>
                <Text fontWeight="bold">{t('home.noFilterMatch')}</Text>
                <Text color="neutral.600" textAlign="center">
                  {t('home.noFilterMatchCopy')}
                </Text>
              </VStack>
              <Button
                alignSelf="center"
                variant="outline"
                onClick={() => {
                  clearFilters()
                }}
              >
                {t('common.clearAll')}
              </Button>
              {noResultsRecommendations.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} pt={4}>
                  <ProductList products={noResultsRecommendations} />
                </SimpleGrid>
              ) : null}
            </VStack>
          ) : (
            <VStack py={16} border="1px solid" borderColor="neutral.200" borderRadius="lg">
              <Text fontWeight="bold">{t('home.noProducts')}</Text>
              <Text color="neutral.600">{t('home.noProductsCopy')}</Text>
            </VStack>
          )}
        </VStack>

        {recommendations.length > 0 ? (
          <VStack align="stretch" spacing={6} mt={{ base: 12, md: 16 }}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                {t('home.recommendedEyebrow')}
              </Text>
              <Heading as="h2" size="xl" color="neutral.900">
                {t('home.popularNow')}
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
          <DrawerHeader>{t('home.filterDrawerTitle')}</DrawerHeader>
          <DrawerBody>
            <Stack spacing={6}>
              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  {t('common.size')}
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
                        aria-label={t('home.filterSizeAria', { size })}
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
                  {t('home.color')}
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
                  {t('home.price')}
                </Text>
                <Select
                  value={priceRange}
                  onChange={(event) => setPriceRange(event.target.value as ProductPriceRange)}
                  bg="white"
                  aria-label={t('home.filterByPrice')}
                >
                  {priceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text color="neutral.900" fontWeight="black" mb={3}>
                  {t('home.rating')}
                </Text>
                <Select
                  value={minRating}
                  onChange={(event) => setMinRating(Number(event.target.value))}
                  bg="white"
                  aria-label={t('home.filterByRating')}
                >
                  {ratingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </Box>

              <Checkbox isChecked={inStockOnly} onChange={() => setInStockOnly((value) => !value)}>
                {t('home.inStockOnly')}
              </Checkbox>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={clearFilters}>
              {t('common.clear')}
            </Button>
            <Button colorScheme="brand" onClick={filterDrawer.onClose}>
              {t('home.showProducts', { count: visibleProducts.length })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
