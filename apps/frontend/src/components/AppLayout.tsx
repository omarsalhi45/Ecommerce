import { Badge, Box, Button, Container, Flex, HStack, Link, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { selectCurrentUser } from '../slices/authSlice'
import { selectCartItemCount } from '../slices/cartSlice'
import { useAppSelector } from '../store/hooks'

const navItems = [
  { label: 'Shop', to: '/' },
  { label: 'Cart', to: '/cart' },
  { label: 'Checkout', to: '/checkout' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const cartItemCount = useAppSelector(selectCartItemCount)
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
          <Flex minH={16} align="center" justify="space-between" gap={6}>
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
                  Street-ready essentials
                </Text>
              </HStack>
            </Link>

            <HStack as="nav" spacing={{ base: 2, md: 5 }} aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  as={RouterLink}
                  to={item.to}
                  color="neutral.800"
                  fontSize="sm"
                  fontWeight="bold"
                  _hover={{ color: 'accent.600', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
              {currentUser?.role === 'admin' ? (
                <Link
                  as={RouterLink}
                  to="/admin"
                  color="neutral.800"
                  fontSize="sm"
                  fontWeight="bold"
                  _hover={{ color: 'accent.600', textDecoration: 'none' }}
                >
                  Admin
                </Link>
              ) : null}
            </HStack>

            <Button
              as={RouterLink}
              to={currentUser ? '/profile' : '/login'}
              variant="outline"
              size="sm"
              borderRadius="full"
            >
              {currentUser ? 'Profile' : 'Login'}
            </Button>

            <Button
              as={RouterLink}
              to="/cart"
              colorScheme="brand"
              size="sm"
              borderRadius="full"
              position="relative"
            >
              Cart
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
    </Box>
  )
}
