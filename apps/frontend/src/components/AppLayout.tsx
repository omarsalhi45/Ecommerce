import { Badge, Box, Button, Container, Flex, HStack, Link, Select, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { type Language, useTranslation } from '../i18n'
import { selectCurrentUser } from '../slices/authSlice'
import { selectCartItemCount } from '../slices/cartSlice'
import { selectWishlistCount } from '../slices/wishlistSlice'
import { useAppSelector } from '../store/hooks'
import MiniCartDrawer from './MiniCartDrawer'

const navItems = [
  { labelKey: 'nav.shop', to: '/' },
  { labelKey: 'nav.wishlist', to: '/wishlist' },
  { labelKey: 'nav.cart', to: '/cart' },
  { labelKey: 'nav.checkout', to: '/checkout' },
] as const

export default function AppLayout({ children }: { children: ReactNode }) {
  const { language, setLanguage, t } = useTranslation()
  const cartItemCount = useAppSelector(selectCartItemCount)
  const wishlistCount = useAppSelector(selectWishlistCount)
  const currentUser = useAppSelector(selectCurrentUser)

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
        <Container maxW="7xl">
          <Flex minH={16} align="center" justify="space-between" gap={{ base: 3, md: 6 }}>
            <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }} aria-label="OSAI home">
              <HStack spacing={3}>
                <Box bg="black" color="white" px={3} py={2} fontWeight="black" letterSpacing="wide">
                  OSAI
                </Box>
                <Text
                  display={{ base: 'none', md: 'block' }}
                  color="neutral.600"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  {t('brand.tagline')}
                </Text>
              </HStack>
            </Link>

            <HStack
              as="nav"
              spacing={{ base: 2, md: 5 }}
              aria-label="Main navigation"
              overflowX="auto"
              flex="1"
              justify="center"
            >
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  as={RouterLink}
                  to={item.to}
                  color="neutral.800"
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="bold"
                  whiteSpace="nowrap"
                  _hover={{ color: 'accent.600', textDecoration: 'none' }}
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
            >
              {t('nav.wishlist')}
              {wishlistCount > 0 ? ` ${wishlistCount}` : ''}
            </Button>

            <Button
              as={RouterLink}
              to={currentUser ? '/profile' : '/login'}
              variant="outline"
              size="sm"
              borderRadius="full"
              display={{ base: 'none', md: 'inline-flex' }}
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
          </Flex>
        </Container>
      </Box>

      <Box as="main">{children}</Box>
      <MiniCartDrawer />
    </Box>
  )
}
