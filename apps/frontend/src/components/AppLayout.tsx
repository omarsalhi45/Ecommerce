import { Badge, Box, Button, Container, Flex, HStack, Link, Select, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { type Language, useTranslation } from '../i18n'
import { selectCurrentUser } from '../slices/authSlice'
import { selectCartItemCount, selectCartItems } from '../slices/cartSlice'
import { selectWishlistProductIds } from '../slices/wishlistSlice'
import { useAppSelector } from '../store/hooks'
import MiniCartDrawer from './MiniCartDrawer'

const navItems = [
  { labelKey: 'nav.track', to: '/track-order' },
  { labelKey: 'nav.checkout', to: '/checkout' },
] as const

export default function AppLayout({ children }: { children: ReactNode }) {
  const { language, setLanguage, t } = useTranslation()
  const location = useLocation()
  const cartItemCount = useAppSelector(selectCartItemCount)
  const cartProductIds = useAppSelector(selectCartItems).map((item) => item.productId)
  const savedProductIds = useAppSelector(selectWishlistProductIds).filter(
    (productId) => !cartProductIds.includes(productId)
  )
  const currentUser = useAppSelector(selectCurrentUser)
  const isNavItemActive = (to: string) => location.pathname === to

  return (
    <Box minH="100vh">
      <Box
        as="header"
        bg="white"
        borderBottom="1px solid"
        borderColor="neutral.200"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Box bg="neutral.900" color="white">
          <Container maxW="7xl">
            <HStack
              minH={8}
              spacing={{ base: 3, md: 6 }}
              justify="center"
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="bold"
              color="whiteAlpha.900"
              overflowX="auto"
              whiteSpace="nowrap"
            >
              <Text>{t('header.offerShipping')}</Text>
              <Text color="whiteAlpha.500">/</Text>
              <Text>{t('header.offerReturns')}</Text>
              <Text color="whiteAlpha.500" display={{ base: 'none', sm: 'block' }}>
                /
              </Text>
              <Text display={{ base: 'none', sm: 'block' }}>{t('header.offerPayment')}</Text>
            </HStack>
          </Container>
        </Box>

        <Container maxW="7xl">
          <Flex
            minH={{ base: 16, md: 20 }}
            align="center"
            justify="space-between"
            gap={{ base: 3, md: 6 }}
          >
            <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }} aria-label="OSAI home">
              <HStack spacing={4}>
                <Box
                  bg="black"
                  color="white"
                  px={4}
                  py={3}
                  fontWeight="black"
                  letterSpacing="wide"
                  lineHeight="1"
                >
                  OSAI
                </Box>
                <Box display={{ base: 'none', lg: 'block' }}>
                  <Text color="neutral.900" fontSize="sm" fontWeight="black" lineHeight="1.1">
                    OSAI
                  </Text>
                  <Text color="neutral.500" fontSize="sm" fontWeight="semibold">
                    {t('brand.tagline')}
                  </Text>
                </Box>
              </HStack>
            </Link>

            <Box flex="1" />

            <HStack
              as="nav"
              aria-label={t('header.actions')}
              spacing={{ base: 2, md: 3 }}
              flexShrink={0}
            >
              <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    as={RouterLink}
                    to={item.to}
                    color={isNavItemActive(item.to) ? 'accent.600' : 'neutral.700'}
                    fontSize="sm"
                    fontWeight="black"
                    whiteSpace="nowrap"
                    borderRadius="full"
                    px={4}
                    py={2}
                    bg={isNavItemActive(item.to) ? 'accent.50' : 'transparent'}
                    _hover={{
                      color: 'accent.600',
                      bg: 'neutral.50',
                      textDecoration: 'none',
                    }}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
              </HStack>

              <Select
                aria-label="Language"
                size="sm"
                value={language}
                w={{ base: 16, md: 20 }}
                bg="white"
                borderColor="neutral.200"
                fontWeight="bold"
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </Select>

              <Button
                as={RouterLink}
                to="/wishlist"
                variant="outline"
                size="sm"
                borderRadius="full"
                display={{ base: 'none', lg: 'inline-flex' }}
                data-testid="saved-count-link"
                px={4}
              >
                {savedProductIds.length > 0
                  ? t('header.savedCount', {
                      label: t('nav.wishlist'),
                      count: savedProductIds.length,
                    })
                  : t('nav.wishlist')}
              </Button>

              <Button
                as={RouterLink}
                to={currentUser ? '/profile' : '/login'}
                variant="outline"
                size="sm"
                borderRadius="full"
                display={{ base: 'none', md: 'inline-flex' }}
                px={4}
              >
                {currentUser ? t('nav.profile') : t('nav.login')}
              </Button>

              <Button
                as={RouterLink}
                to="/cart"
                colorScheme="brand"
                size="sm"
                borderRadius="full"
                position="relative"
                px={{ base: 4, md: 5 }}
              >
                {t('nav.cart')}
                {cartItemCount > 0 ? (
                  <Badge
                    ml={2}
                    bg="accent.500"
                    color="white"
                    borderRadius="full"
                    minW={5}
                    textAlign="center"
                  >
                    {cartItemCount}
                  </Badge>
                ) : null}
              </Button>
            </HStack>
          </Flex>
        </Container>

        <Box
          display={{ base: 'block', md: 'none' }}
          borderTop="1px solid"
          borderColor="neutral.100"
        >
          <Container maxW="7xl">
            <HStack
              as="nav"
              aria-label={t('header.mainNavigation')}
              minH={11}
              spacing={1}
              overflowX="auto"
            >
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  as={RouterLink}
                  to={item.to}
                  color={isNavItemActive(item.to) ? 'accent.600' : 'neutral.700'}
                  fontSize="sm"
                  fontWeight="black"
                  whiteSpace="nowrap"
                  borderRadius="full"
                  px={4}
                  py={2}
                  bg={isNavItemActive(item.to) ? 'accent.50' : 'transparent'}
                  _hover={{ color: 'accent.600', bg: 'neutral.50', textDecoration: 'none' }}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              <Link
                as={RouterLink}
                to="/wishlist"
                color="neutral.700"
                fontSize="sm"
                fontWeight="black"
                whiteSpace="nowrap"
                borderRadius="full"
                px={4}
                py={2}
                _hover={{ color: 'accent.600', bg: 'neutral.50', textDecoration: 'none' }}
              >
                {savedProductIds.length > 0
                  ? t('header.savedCount', {
                      label: t('nav.wishlist'),
                      count: savedProductIds.length,
                    })
                  : t('nav.wishlist')}
              </Link>
            </HStack>
          </Container>
        </Box>
      </Box>

      <Box as="main">{children}</Box>
      <MiniCartDrawer />
    </Box>
  )
}
