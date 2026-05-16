import { Box, Button, Container, Flex, HStack, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { logout, selectCurrentUser } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)

  return (
    <Box minH="100vh" bg="neutral.50">
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
          <Flex minH={16} align="center" justify="space-between" gap={4}>
            <HStack spacing={3}>
              <Box bg="black" color="white" px={3} py={2} fontWeight="black" letterSpacing="wide">
                OSAI
              </Box>
              <Box>
                <Heading as="p" size="sm">
                  Admin
                </Heading>
                <Text color="neutral.600" fontSize="xs">
                  Orders, products, inventory
                </Text>
              </Box>
            </HStack>
            <HStack spacing={3}>
              <Button as={RouterLink} to="/" variant="ghost" size="sm">
                Dashboard
              </Button>
              {currentUser ? (
                <Button variant="outline" size="sm" onClick={() => dispatch(logout())}>
                  Sign out
                </Button>
              ) : null}
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box as="main">{children}</Box>
    </Box>
  )
}
