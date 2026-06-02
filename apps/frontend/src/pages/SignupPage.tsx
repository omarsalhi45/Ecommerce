import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { type FormEvent, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useRegisterMutation } from '../api/authApi'
import { useTranslation } from '../i18n'
import { setCredentials } from '../slices/authSlice'
import { useAppDispatch } from '../store/hooks'

export default function SignupPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(undefined)

    try {
      const authResponse = await register({ name, email, password }).unwrap()
      dispatch(setCredentials(authResponse))
      navigate('/profile')
    } catch {
      setErrorMessage(t('auth.signupError'))
    }
  }

  return (
    <Container maxW="lg" py={{ base: 10, md: 16 }}>
      <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={8}>
        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={5}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                {t('auth.account')}
              </Text>
              <Heading>{t('auth.signupTitle')}</Heading>
            </Box>
            {errorMessage ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            ) : null}
            <FormControl isRequired>
              <FormLabel>{t('common.name')}</FormLabel>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>{t('common.email')}</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>{t('common.password')}</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FormHelperText>{t('auth.passwordHelp')}</FormHelperText>
            </FormControl>
            <Button type="submit" colorScheme="brand" isLoading={isLoading}>
              {t('auth.signupTitle')}
            </Button>
            <Text color="neutral.600">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link as={RouterLink} to="/login" color="accent.600" fontWeight="bold">
                {t('auth.loginTitle')}
              </Link>
            </Text>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
