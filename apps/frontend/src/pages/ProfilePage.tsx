import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import { useTranslation } from '../i18n'
import { logout, selectCurrentUser, selectIsAuthenticated } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Container maxW="3xl" py={{ base: 10, md: 16 }}>
      <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={8}>
        <Stack spacing={4}>
          <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
            {t('profile.title')}
          </Text>
          <Heading>{user?.name}</Heading>
          <Text color="neutral.600">{user?.email}</Text>
          <Text color="neutral.600">{t('profile.role', { role: user?.role })}</Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
            <Button as={RouterLink} to="/checkout" colorScheme="brand">
              {t('profile.goToCheckout')}
            </Button>
            <Button variant="outline" onClick={() => dispatch(logout())}>
              {t('profile.logout')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
