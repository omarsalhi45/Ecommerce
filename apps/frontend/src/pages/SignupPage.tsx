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
import { setCredentials } from '../slices/authSlice'
import { useAppDispatch } from '../store/hooks'

export default function SignupPage() {
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
      setErrorMessage('Signup failed. Use a valid email and a password with at least 8 characters.')
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
              <Heading>Create account</Heading>
            </Box>
            {errorMessage ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            ) : null}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </FormControl>
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
              <FormHelperText>Use at least 8 characters.</FormHelperText>
            </FormControl>
            <Button type="submit" colorScheme="brand" isLoading={isLoading}>
              Create account
            </Button>
            <Text color="neutral.600">
              Already have one?{' '}
              <Link as={RouterLink} to="/login" color="accent.600" fontWeight="bold">
                Log in
              </Link>
            </Text>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
