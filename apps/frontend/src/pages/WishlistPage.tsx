import { ArrowBackIcon } from '@chakra-ui/icons'
import { Box, Button, Container, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useGetProductsQuery } from '../api/productsApi'
import ProductList from '../components/ProductList'
import { useTranslation } from '../i18n'
import { selectCartItems } from '../slices/cartSlice'
import { selectWishlistProductIds } from '../slices/wishlistSlice'
import { useAppSelector } from '../store/hooks'

export default function WishlistPage() {
  const { t } = useTranslation()
  const { data: products = [], isLoading } = useGetProductsQuery()
  const wishlistProductIds = useAppSelector(selectWishlistProductIds)
  const cartProductIds = useAppSelector(selectCartItems).map((item) => item.productId)
  const wishlistProducts = products.filter(
    (product) => wishlistProductIds.includes(product.id) && !cartProductIds.includes(product.id)
  )

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
            {t('wishlist.eyebrow')}
          </Text>
          <Heading as="h1" size="2xl" color="neutral.900">
            {t('wishlist.title')}
          </Heading>
        </Box>

        {isLoading ? (
          <Text color="neutral.600">{t('wishlist.loading')}</Text>
        ) : wishlistProducts.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <ProductList products={wishlistProducts} />
          </SimpleGrid>
        ) : (
          <VStack
            align="center"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            bg="white"
            py={16}
            px={6}
            spacing={4}
          >
            <Heading as="h2" size="md">
              {t('wishlist.emptyTitle')}
            </Heading>
            <Text color="neutral.600" textAlign="center">
              {t('wishlist.emptyCopy')}
            </Text>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} colorScheme="brand">
              {t('common.backToShop')}
            </Button>
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
