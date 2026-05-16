import { Alert, AlertIcon, Button, Stack, Text } from '@chakra-ui/react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'

interface StripePaymentFormProps {
  readonly orderId: string
  readonly onPaymentReady: () => void
}

export default function StripePaymentForm({ orderId, onPaymentReady }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)

  const handlePayment = async () => {
    setErrorMessage(undefined)

    if (!stripe || !elements) {
      setErrorMessage('Payment form is still loading. Try again in a moment.')
      return
    }

    setIsConfirming(true)
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
      },
      redirect: 'if_required',
    })
    setIsConfirming(false)

    if (result.error) {
      setErrorMessage(result.error.message ?? 'Payment could not be confirmed.')
      return
    }

    onPaymentReady()
  }

  return (
    <Stack spacing={4}>
      <PaymentElement />
      {errorMessage ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {errorMessage}
        </Alert>
      ) : null}
      <Button
        colorScheme="brand"
        size="lg"
        onClick={handlePayment}
        isLoading={isConfirming}
        isDisabled={!stripe || !elements}
      >
        Pay securely
      </Button>
      <Text color="neutral.500" fontSize="sm">
        OSAI never stores card details. Stripe handles the payment form and confirmation.
      </Text>
    </Stack>
  )
}
