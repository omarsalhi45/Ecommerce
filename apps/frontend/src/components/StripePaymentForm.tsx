import { Alert, AlertIcon, Button, Stack, Text } from '@chakra-ui/react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { useTranslation } from '../i18n'

interface StripePaymentFormProps {
  readonly orderId: string
  readonly onPaymentReady: () => void
}

export default function StripePaymentForm({ orderId, onPaymentReady }: StripePaymentFormProps) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)

  const handlePayment = async () => {
    setErrorMessage(undefined)

    if (!stripe || !elements) {
      setErrorMessage(t('payment.loadingError'))
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
      setErrorMessage(result.error.message ?? t('payment.confirmError'))
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
        {t('payment.paySecurely')}
      </Button>
      <Text color="neutral.500" fontSize="sm">
        {t('payment.copy')}
      </Text>
    </Stack>
  )
}
