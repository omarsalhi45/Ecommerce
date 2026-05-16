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
  Stack,
  Text,
} from '@chakra-ui/react'
import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../api/authApi'
import { selectCurrentUser, setCredentials } from '../slices/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function AdminLoginPage() {
  const currentUser = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  if (currentUser?.role === 'admin') {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(undefined)

    try {
      const authResponse = await login({ email, password }).unwrap()

      if (authResponse.user.role !== 'admin') {
        setErrorMessage('This account does not have admin access.')
        return
      }

      dispatch(setCredentials(authResponse))
      navigate('/')
    } catch {
      setErrorMessage('Admin login failed. Check your email and password.')
    }
  }

  return (
    <Container maxW="lg" py={{ base: 10, md: 16 }}>
      <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="lg" p={8}>
        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={5}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                OSAI Admin
              </Text>
              <Heading>Back office login</Heading>
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
              Log in to admin
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
