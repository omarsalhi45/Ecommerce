import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { type FormEvent, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useCreateCheckoutPaymentIntentMutation, useCreateOrderMutation } from '../api/ordersApi'
import { useGetProductsQuery } from '../api/productsApi'
import StripePaymentForm from '../components/StripePaymentForm'
import { frontendConfig } from '../config'
import { calculateCartSummary, clearCart, selectCartItems } from '../slices/cartSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { CreateCheckoutPaymentIntentResponse, CreateOrderRequest } from '../types'

const initialFormState = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

type CheckoutFormState = typeof initialFormState

const stripePromise = frontendConfig.stripePublishableKey
  ? loadStripe(frontendConfig.stripePublishableKey)
  : null

export default function CheckoutPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const cartItems = useAppSelector(selectCartItems)
  const { data: products = [] } = useGetProductsQuery()
  const [createOrder, { isLoading: isMockOrderLoading }] = useCreateOrderMutation()
  const [createCheckoutPaymentIntent, { isLoading: isPaymentIntentLoading }] =
    useCreateCheckoutPaymentIntentMutation()
  const [formState, setFormState] = useState<CheckoutFormState>(initialFormState)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [paymentIntentResponse, setPaymentIntentResponse] =
    useState<CreateCheckoutPaymentIntentResponse>()
  const summary = useMemo(() => calculateCartSummary(cartItems, products), [cartItems, products])
  const isStripeConfigured = Boolean(stripePromise)
  const isSubmitting = isMockOrderLoading || isPaymentIntentLoading

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }))
    setPaymentIntentResponse(undefined)
  }

  const buildCheckoutPayload = (): CreateOrderRequest => {
    return {
      customer: {
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName,
        phone: formState.phone || undefined,
      },
      shippingAddress: {
        line1: formState.line1,
        line2: formState.line2 || undefined,
        city: formState.city,
        state: formState.state,
        postalCode: formState.postalCode,
        country: formState.country,
      },
      items: cartItems,
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(undefined)
    setPaymentIntentResponse(undefined)

    if (cartItems.length === 0) {
      setErrorMessage('Add at least one item to your cart before checking out.')
      return
    }

    try {
      const checkoutPayload = buildCheckoutPayload()

      if (isStripeConfigured) {
        const paymentIntent = await createCheckoutPaymentIntent(checkoutPayload).unwrap()
        setPaymentIntentResponse(paymentIntent)
        return
      }

      const order = await createOrder(checkoutPayload).unwrap()

      dispatch(clearCart())
      navigate(`/order-confirmation?orderId=${order.id}`)
    } catch {
      setErrorMessage('Checkout could not be completed. Check your details and try again.')
    }
  }

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={8} align="start">
        <Box
          as="form"
          onSubmit={handleSubmit}
          flex={1}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={{ base: 6, md: 8 }}
        >
          <Stack spacing={6}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Checkout
              </Text>
              <Heading>Finish your order</Heading>
            </Box>

            {errorMessage ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            ) : null}

            <VStack align="stretch" spacing={4}>
              <Heading as="h2" size="md">
                Contact
              </Heading>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>First name</FormLabel>
                  <Input
                    value={formState.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last name</FormLabel>
                  <Input
                    value={formState.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formState.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={formState.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </FormControl>
              </Grid>
            </VStack>

            <VStack align="stretch" spacing={4}>
              <Heading as="h2" size="md">
                Shipping
              </Heading>
              <FormControl isRequired>
                <FormLabel>Address line 1</FormLabel>
                <Input
                  value={formState.line1}
                  onChange={(event) => updateField('line1', event.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Address line 2</FormLabel>
                <Input
                  value={formState.line2}
                  onChange={(event) => updateField('line2', event.target.value)}
                />
              </FormControl>
              <Grid templateColumns={{ base: '1fr', md: '1.4fr 0.8fr 0.8fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>City</FormLabel>
                  <Input
                    value={formState.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>State</FormLabel>
                  <Input
                    value={formState.state}
                    onChange={(event) => updateField('state', event.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Postal code</FormLabel>
                  <Input
                    value={formState.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                  />
                </FormControl>
              </Grid>
              <FormControl isRequired>
                <FormLabel>Country</FormLabel>
                <Input
                  value={formState.country}
                  onChange={(event) => updateField('country', event.target.value)}
                />
              </FormControl>
            </VStack>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isSubmitting}
              isDisabled={cartItems.length === 0}
            >
              {isStripeConfigured ? 'Continue to payment' : 'Place mocked order'}
            </Button>
          </Stack>
        </Box>

        <Box
          w={{ base: 'full', lg: '360px' }}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={6}
        >
          <Heading as="h2" size="md" mb={4}>
            Order summary
          </Heading>
          {cartItems.length === 0 ? (
            <VStack align="stretch" spacing={4}>
              <Text color="neutral.600">Your cart is empty.</Text>
              <Button as={RouterLink} to="/" variant="outline">
                Continue shopping
              </Button>
            </VStack>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Text color="neutral.600">Subtotal ${summary.subtotal.toFixed(2)}</Text>
                <Text color="neutral.600">Shipping ${summary.shipping.toFixed(2)}</Text>
                <Text color="neutral.600">Tax ${summary.tax.toFixed(2)}</Text>
              </Stack>
              <Divider />
              <Text fontWeight="black">Estimated total ${summary.total.toFixed(2)}</Text>
              <Text color="neutral.500" fontSize="sm">
                {isStripeConfigured
                  ? 'The API will recalculate the trusted total before creating payment.'
                  : 'Stripe is not configured locally, so checkout will create a mocked paid order.'}
              </Text>
            </Stack>
          )}
        </Box>
      </Stack>

      {paymentIntentResponse && stripePromise ? (
        <Box
          mt={8}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={{ base: 6, md: 8 }}
          maxW="3xl"
        >
          <Stack spacing={5}>
            <Box>
              <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
                Payment
              </Text>
              <Heading as="h2" size="lg">
                Secure payment
              </Heading>
              <Text color="neutral.600" mt={2}>
                Order {paymentIntentResponse.order.id} is ready for payment.
              </Text>
            </Box>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: paymentIntentResponse.paymentIntent.clientSecret }}
            >
              <StripePaymentForm
                orderId={paymentIntentResponse.order.id}
                onPaymentReady={() => {
                  dispatch(clearCart())
                  navigate(`/order-confirmation?orderId=${paymentIntentResponse.order.id}`)
                }}
              />
            </Elements>
          </Stack>
        </Box>
      ) : null}
    </Container>
  )
}
