import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { type FormEvent, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../api/authApi'
import { setCredentials } from '../slices/authSlice'
import { useAppDispatch } from '../store/hooks'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(undefined)

    try {
      const authResponse = await login({ email, password }).unwrap()
      dispatch(setCredentials(authResponse))
      navigate('/profile')
    } catch {
      setErrorMessage('Login failed. Check your email and password.')
    }
  }

  return (
    <Container maxW="lg" py={{ base: 10, md: 16 }}>
      <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={8}>
        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={5}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Account
              </Text>
              <Heading>Log in</Heading>
            </Box>
            {errorMessage ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            ) : null}
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormControl>
            <Button type="submit" colorScheme="brand" isLoading={isLoading}>
              Log in
            </Button>
            <Text color="neutral.600">
              New here?{' '}
              <Link as={RouterLink} to="/signup" color="accent.600" fontWeight="bold">
                Create an account
              </Link>
            </Text>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
