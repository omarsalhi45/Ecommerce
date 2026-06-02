import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useCreateCheckoutPaymentIntentMutation, useCreateOrderMutation } from '../api/ordersApi'
import { useGetProductsQuery } from '../api/productsApi'
import StripePaymentForm from '../components/StripePaymentForm'
import { frontendConfig } from '../config'
import { useTranslation } from '../i18n'
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
type ShippingMethodId = 'standard' | 'priority'
type CheckoutStepId = 'contact' | 'shipping' | 'review' | 'payment'
type TranslationKey = Parameters<ReturnType<typeof useTranslation>['t']>[0]
type CheckoutFieldKey =
  | 'checkout.firstName'
  | 'checkout.lastName'
  | 'common.email'
  | 'checkout.address1'
  | 'checkout.city'
  | 'checkout.postalCode'
  | 'checkout.country'

interface CheckoutDraft {
  readonly formState: CheckoutFormState
  readonly shippingMethod: ShippingMethodId
  readonly promoCode?: string
}

const checkoutDraftStorageKey = 'osai.checkoutDraft'
const promoCodeDetails: Record<
  string,
  { readonly label: string; readonly percentOff: number; readonly minimumSubtotal?: number }
> = {
  OSAI10: { label: '10% off', percentOff: 0.1 },
  WELCOME15: { label: '15% off', percentOff: 0.15, minimumSubtotal: 50 },
}

const shippingMethods: Array<{
  readonly id: ShippingMethodId
  readonly labelKey: TranslationKey
  readonly estimateKey: TranslationKey
  readonly noteKey: TranslationKey
}> = [
  {
    id: 'standard',
    labelKey: 'checkout.standardShipping',
    estimateKey: 'checkout.standardEstimate',
    noteKey: 'checkout.standardNote',
  },
  {
    id: 'priority',
    labelKey: 'checkout.priorityShipping',
    estimateKey: 'checkout.priorityEstimate',
    noteKey: 'checkout.priorityNote',
  },
]

const checkoutSteps: Array<{ readonly id: CheckoutStepId; readonly labelKey: TranslationKey }> = [
  { id: 'contact', labelKey: 'checkout.contact' },
  { id: 'shipping', labelKey: 'checkout.shipping' },
  { id: 'review', labelKey: 'checkout.review' },
  { id: 'payment', labelKey: 'checkout.payment' },
]

const stripePromise = frontendConfig.stripePublishableKey
  ? loadStripe(frontendConfig.stripePublishableKey)
  : null

const getFieldPreview = (value: string, fallback: string) => value.trim() || fallback
const roundMoney = (value: number): number => Math.round(value * 100) / 100

const normalizePromoCode = (promoCode: string): string => promoCode.trim().toUpperCase()

const calculatePromoPreview = (subtotal: number, promoCode: string | undefined): number => {
  if (!promoCode) {
    return 0
  }

  const details = promoCodeDetails[promoCode]
  if (details?.minimumSubtotal && subtotal < details.minimumSubtotal) {
    return 0
  }

  return details ? roundMoney(subtotal * details.percentOff) : 0
}

const getCheckoutPath = (step: CheckoutStepId) =>
  step === 'contact' ? '/checkout' : `/checkout/${step}`

const getCheckoutStep = (value: string | undefined): CheckoutStepId =>
  checkoutSteps.some((step) => step.id === value) ? (value as CheckoutStepId) : 'contact'

const getMissingContactField = (formState: CheckoutFormState): CheckoutFieldKey | undefined => {
  if (!formState.firstName.trim()) {
    return 'checkout.firstName'
  }

  if (!formState.lastName.trim()) {
    return 'checkout.lastName'
  }

  if (!formState.email.trim()) {
    return 'common.email'
  }

  return undefined
}

const getMissingShippingField = (formState: CheckoutFormState): CheckoutFieldKey | undefined => {
  if (!formState.line1.trim()) {
    return 'checkout.address1'
  }

  if (!formState.city.trim()) {
    return 'checkout.city'
  }

  if (!formState.postalCode.trim()) {
    return 'checkout.postalCode'
  }

  if (!formState.country.trim()) {
    return 'checkout.country'
  }

  return undefined
}

const getMissingCheckoutField = (formState: CheckoutFormState): CheckoutFieldKey | undefined =>
  getMissingContactField(formState) ?? getMissingShippingField(formState)

const getCheckoutStepForMissingField = (fieldName: CheckoutFieldKey): CheckoutStepId =>
  ['checkout.firstName', 'checkout.lastName', 'common.email'].includes(fieldName)
    ? 'contact'
    : 'shipping'

const readCheckoutDraft = (): CheckoutDraft => {
  if (typeof window === 'undefined') {
    return { formState: initialFormState, shippingMethod: 'standard' }
  }

  try {
    const rawDraft = window.sessionStorage.getItem(checkoutDraftStorageKey)
    if (!rawDraft) {
      return { formState: initialFormState, shippingMethod: 'standard' }
    }

    const parsedDraft = JSON.parse(rawDraft) as {
      formState?: Partial<CheckoutFormState>
      shippingMethod?: ShippingMethodId
      promoCode?: string
    }

    return {
      formState: { ...initialFormState, ...parsedDraft.formState },
      shippingMethod: parsedDraft.shippingMethod === 'priority' ? 'priority' : 'standard',
      promoCode: typeof parsedDraft.promoCode === 'string' ? parsedDraft.promoCode : undefined,
    }
  } catch {
    return { formState: initialFormState, shippingMethod: 'standard' }
  }
}

export default function CheckoutPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { checkoutStep } = useParams()
  const currentStep = getCheckoutStep(checkoutStep)
  const currentStepIndex = checkoutSteps.findIndex((step) => step.id === currentStep)
  const cartItems = useAppSelector(selectCartItems)
  const { data: products = [] } = useGetProductsQuery()
  const [createOrder, { isLoading: isMockOrderLoading }] = useCreateOrderMutation()
  const [createCheckoutPaymentIntent, { isLoading: isPaymentIntentLoading }] =
    useCreateCheckoutPaymentIntentMutation()
  const draft = useMemo(readCheckoutDraft, [])
  const [formState, setFormState] = useState<CheckoutFormState>(draft.formState)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>(draft.shippingMethod)
  const [promoInput, setPromoInput] = useState(draft.promoCode ?? '')
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>(draft.promoCode)
  const [promoMessage, setPromoMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [paymentIntentResponse, setPaymentIntentResponse] =
    useState<CreateCheckoutPaymentIntentResponse>()
  const paymentSectionRef = useRef<HTMLDivElement>(null)
  const summary = useMemo(() => calculateCartSummary(cartItems, products), [cartItems, products])
  const enrichedCartItems = cartItems.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }))
  const isStripeConfigured = Boolean(stripePromise)
  const isSubmitting = isMockOrderLoading || isPaymentIntentLoading
  const selectedShippingMethod = shippingMethods.find((method) => method.id === shippingMethod)
  const promoDiscount = calculatePromoPreview(summary.subtotal, appliedPromoCode)
  const discountedSubtotal = roundMoney(summary.subtotal - promoDiscount)
  const estimatedTax = promoDiscount > 0 ? roundMoney(discountedSubtotal * 0.08) : summary.tax
  const estimatedTotal =
    promoDiscount > 0
      ? roundMoney(discountedSubtotal + summary.shipping + estimatedTax)
      : summary.total

  useEffect(() => {
    window.sessionStorage.setItem(
      checkoutDraftStorageKey,
      JSON.stringify({ formState, shippingMethod, promoCode: appliedPromoCode })
    )
  }, [appliedPromoCode, formState, shippingMethod])

  useEffect(() => {
    if (checkoutStep && currentStep === 'contact') {
      navigate('/checkout', { replace: true })
    }
  }, [checkoutStep, currentStep, navigate])

  useEffect(() => {
    if (currentStep !== 'payment' || !paymentIntentResponse) {
      return
    }

    window.requestAnimationFrame(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      paymentSectionRef.current?.focus({ preventScroll: true })
    })
  }, [currentStep, paymentIntentResponse])

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }))
    setPaymentIntentResponse(undefined)
  }

  const handleApplyPromoCode = () => {
    const normalizedCode = normalizePromoCode(promoInput)

    if (!normalizedCode) {
      setPromoMessage(t('checkout.enterPromoFirst'))
      return
    }

    const promoDetails = promoCodeDetails[normalizedCode]

    if (!promoDetails) {
      setPromoMessage(t('checkout.promoUnavailable'))
      setAppliedPromoCode(undefined)
      setPaymentIntentResponse(undefined)
      return
    }

    if (promoDetails.minimumSubtotal && summary.subtotal < promoDetails.minimumSubtotal) {
      setPromoMessage(
        t('checkout.promoNeedsMinimum', {
          code: normalizedCode,
          amount: promoDetails.minimumSubtotal.toFixed(2),
        })
      )
      setAppliedPromoCode(undefined)
      setPaymentIntentResponse(undefined)
      return
    }

    setAppliedPromoCode(normalizedCode)
    setPromoInput(normalizedCode)
    setPromoMessage(t('checkout.promoApplied', { code: normalizedCode }))
    setPaymentIntentResponse(undefined)
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(undefined)
    setPromoInput('')
    setPromoMessage(undefined)
    setPaymentIntentResponse(undefined)
  }

  const navigateToStep = (step: CheckoutStepId) => {
    setErrorMessage(undefined)
    navigate(getCheckoutPath(step))
  }

  const showMissingFieldError = (fieldName: CheckoutFieldKey) => {
    setErrorMessage(t('checkout.requiredError', { field: t(fieldName) }))
    navigate(getCheckoutPath(getCheckoutStepForMissingField(fieldName)))
  }

  const continueToShipping = () => {
    const missingField = getMissingContactField(formState)

    if (missingField) {
      showMissingFieldError(missingField)
      return
    }

    navigateToStep('shipping')
  }

  const continueToReview = () => {
    const missingField = getMissingShippingField(formState)

    if (missingField) {
      showMissingFieldError(missingField)
      return
    }

    navigateToStep('review')
  }

  const buildCheckoutPayload = (): CreateOrderRequest => {
    const checkoutPayload: CreateOrderRequest = {
      customer: {
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName,
        ...(formState.phone ? { phone: formState.phone } : {}),
      },
      shippingAddress: {
        line1: formState.line1,
        city: formState.city,
        postalCode: formState.postalCode,
        country: formState.country,
        ...(formState.line2 ? { line2: formState.line2 } : {}),
        ...(formState.state ? { state: formState.state } : {}),
      },
      items: cartItems,
    }

    return appliedPromoCode ? { ...checkoutPayload, promoCode: appliedPromoCode } : checkoutPayload
  }

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(undefined)
    setPaymentIntentResponse(undefined)

    if (cartItems.length === 0) {
      setErrorMessage(t('checkout.emptyCartError'))
      return
    }

    const missingField = getMissingCheckoutField(formState)

    if (missingField) {
      showMissingFieldError(missingField)
      return
    }

    try {
      const checkoutPayload = buildCheckoutPayload()

      if (isStripeConfigured) {
        const paymentIntent = await createCheckoutPaymentIntent(checkoutPayload).unwrap()
        setPaymentIntentResponse(paymentIntent)
        navigateToStep('payment')
        return
      }

      const order = await createOrder(checkoutPayload).unwrap()

      window.sessionStorage.removeItem(checkoutDraftStorageKey)
      dispatch(clearCart())
      navigate(`/order-confirmation?orderId=${order.id}`)
    } catch {
      setErrorMessage(t('checkout.failedError'))
    }
  }

  const renderContactStep = () => (
    <Stack spacing={6}>
      <Box>
        <Badge borderRadius="full" colorScheme="gray" mb={3}>
          {t('checkout.step', { step: 1 })}
        </Badge>
        <Heading as="h1" size="xl">
          {t('checkout.contactTitle')}
        </Heading>
        <Text color="neutral.600" mt={2}>
          {t('checkout.contactCopy')}
        </Text>
      </Box>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
        <FormControl isRequired>
          <FormLabel>{t('checkout.firstName')}</FormLabel>
          <Input
            value={formState.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>{t('checkout.lastName')}</FormLabel>
          <Input
            value={formState.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>{t('common.email')}</FormLabel>
          <Input
            type="email"
            value={formState.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('common.phone')}</FormLabel>
          <Input
            value={formState.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
        </FormControl>
      </Grid>
      <HStack justify="flex-end">
        <Button colorScheme="brand" onClick={continueToShipping}>
          {t('checkout.continueToShipping')}
        </Button>
      </HStack>
    </Stack>
  )

  const renderShippingStep = () => (
    <Stack spacing={6}>
      <Box>
        <Badge borderRadius="full" colorScheme="gray" mb={3}>
          {t('checkout.step', { step: 2 })}
        </Badge>
        <Heading as="h1" size="xl">
          {t('checkout.shippingTitle')}
        </Heading>
        <Text color="neutral.600" mt={2}>
          {t('checkout.shippingCopy')}
        </Text>
      </Box>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>{t('checkout.address1')}</FormLabel>
          <Input
            value={formState.line1}
            onChange={(event) => updateField('line1', event.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('checkout.address2')}</FormLabel>
          <Input
            value={formState.line2}
            onChange={(event) => updateField('line2', event.target.value)}
          />
        </FormControl>
        <Grid templateColumns={{ base: '1fr', md: '1.4fr 0.8fr 0.8fr' }} gap={4}>
          <FormControl isRequired>
            <FormLabel>{t('checkout.city')}</FormLabel>
            <Input
              value={formState.city}
              onChange={(event) => updateField('city', event.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('checkout.state')}</FormLabel>
            <Input
              value={formState.state}
              onChange={(event) => updateField('state', event.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('checkout.postalCode')}</FormLabel>
            <Input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
            />
          </FormControl>
        </Grid>
        <FormControl isRequired>
          <FormLabel>{t('checkout.country')}</FormLabel>
          <Input
            value={formState.country}
            onChange={(event) => updateField('country', event.target.value)}
          />
        </FormControl>
        <FormControl as="fieldset">
          <FormLabel as="legend">{t('checkout.shippingMethod')}</FormLabel>
          <RadioGroup
            value={shippingMethod}
            onChange={(value) => setShippingMethod(value as ShippingMethodId)}
          >
            <Stack spacing={3}>
              {shippingMethods.map((method) => (
                <Box
                  key={method.id}
                  border="1px solid"
                  borderColor={shippingMethod === method.id ? 'neutral.900' : 'neutral.200'}
                  borderRadius="lg"
                  p={4}
                  bg={shippingMethod === method.id ? 'neutral.50' : 'white'}
                >
                  <Radio value={method.id} colorScheme="brand">
                    <Text as="span" fontWeight="black">
                      {t(method.labelKey)}
                    </Text>
                    <Text color="neutral.600" fontSize="sm">
                      {t(method.estimateKey)}. {t(method.noteKey)}.
                    </Text>
                  </Radio>
                </Box>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>
      </Stack>
      <HStack justify="space-between">
        <Button variant="outline" onClick={() => navigateToStep('contact')}>
          {t('common.back')}
        </Button>
        <Button colorScheme="brand" onClick={continueToReview}>
          {t('checkout.continueToReview')}
        </Button>
      </HStack>
    </Stack>
  )

  const renderReviewStep = () => (
    <Box as="form" onSubmit={handleReviewSubmit}>
      <Stack spacing={6}>
        <Box>
          <Badge borderRadius="full" colorScheme="gray" mb={3}>
            {t('checkout.step', { step: 3 })}
          </Badge>
          <Heading as="h1" size="xl">
            {t('checkout.reviewTitle')}
          </Heading>
          <Text color="neutral.600" mt={2}>
            {t('checkout.reviewCopy')}
          </Text>
        </Box>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Box border="1px solid" borderColor="neutral.200" borderRadius="lg" p={4}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text color="neutral.900" fontWeight="black">
                  {t('checkout.contact')}
                </Text>
                <Text color="neutral.600" fontSize="sm">
                  {getFieldPreview(
                    `${formState.firstName} ${formState.lastName}`.trim(),
                    t('checkout.notEntered')
                  )}
                </Text>
                <Text color="neutral.600" fontSize="sm">
                  {getFieldPreview(formState.email, t('checkout.notEntered'))}
                </Text>
              </Box>
              <Button size="sm" variant="ghost" onClick={() => navigateToStep('contact')}>
                {t('common.edit')}
              </Button>
            </HStack>
          </Box>
          <Box border="1px solid" borderColor="neutral.200" borderRadius="lg" p={4}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text color="neutral.900" fontWeight="black">
                  {t('checkout.delivery')}
                </Text>
                <Text color="neutral.600" fontSize="sm">
                  {selectedShippingMethod
                    ? `${t(selectedShippingMethod.labelKey)} - ${t(selectedShippingMethod.estimateKey)}`
                    : ''}
                </Text>
                <Text color="neutral.600" fontSize="sm">
                  {getFieldPreview(
                    [formState.line1, formState.city, formState.state, formState.postalCode]
                      .filter(Boolean)
                      .join(', '),
                    t('checkout.notEntered')
                  )}
                </Text>
              </Box>
              <Button size="sm" variant="ghost" onClick={() => navigateToStep('shipping')}>
                {t('common.edit')}
              </Button>
            </HStack>
          </Box>
        </Grid>
        <Box border="1px solid" borderColor="neutral.200" borderRadius="lg" p={4}>
          <HStack justify="space-between" align="start" mb={4}>
            <Box>
              <Text color="neutral.900" fontWeight="black">
                {t('checkout.items')}
              </Text>
              <Text color="neutral.600" fontSize="sm">
                {t('checkout.itemsInCart', {
                  count: cartItems.length,
                  unit:
                    cartItems.length === 1 ? t('checkout.itemSingular') : t('checkout.itemPlural'),
                })}
              </Text>
            </Box>
            <Button as={RouterLink} to="/cart" size="sm" variant="ghost">
              {t('checkout.editCart')}
            </Button>
          </HStack>
          <Stack spacing={3}>
            {enrichedCartItems.map((item) => {
              const unitPrice = item.product?.price ?? 0
              const lineTotal = unitPrice * item.quantity

              return (
                <HStack
                  key={item.variantSku ? `${item.productId}:${item.variantSku}` : item.productId}
                  justify="space-between"
                  align="start"
                  borderTop="1px solid"
                  borderColor="neutral.100"
                  pt={3}
                >
                  <Box>
                    <Text color="neutral.900" fontWeight="black">
                      {item.product?.name ?? item.productId}
                    </Text>
                    {[item.size, item.color].filter(Boolean).length > 0 ? (
                      <Text color="neutral.500" fontSize="sm" fontWeight="semibold">
                        {[item.size, item.color].filter(Boolean).join(' / ')}
                      </Text>
                    ) : null}
                    <Text color="neutral.600" fontSize="sm">
                      {t('checkout.qtyLine', {
                        quantity: item.quantity,
                        price: unitPrice.toFixed(2),
                      })}
                    </Text>
                  </Box>
                  <Text color="neutral.900" fontWeight="black">
                    ${lineTotal.toFixed(2)}
                  </Text>
                </HStack>
              )
            })}
          </Stack>
        </Box>
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          {t('checkout.paymentInfo')}
        </Alert>
        <HStack justify="space-between">
          <Button variant="outline" onClick={() => navigateToStep('shipping')}>
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            isDisabled={cartItems.length === 0}
          >
            {isStripeConfigured ? t('checkout.continueToPayment') : t('checkout.placeMockOrder')}
          </Button>
        </HStack>
      </Stack>
    </Box>
  )

  const renderPaymentStep = () => (
    <Stack spacing={6}>
      <Box ref={paymentSectionRef} tabIndex={-1} outline="none">
        <Badge borderRadius="full" colorScheme="gray" mb={3}>
          {t('checkout.step', { step: 4 })}
        </Badge>
        <Heading as="h1" size="xl">
          {t('checkout.securePaymentTitle')}
        </Heading>
        <Text color="neutral.600" mt={2}>
          {paymentIntentResponse
            ? t('checkout.readyForPayment', { orderId: paymentIntentResponse.order.id })
            : t('checkout.paymentWaiting')}
        </Text>
      </Box>
      {paymentIntentResponse && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: paymentIntentResponse.paymentIntent.clientSecret }}
        >
          <StripePaymentForm
            orderId={paymentIntentResponse.order.id}
            onPaymentReady={() => {
              window.sessionStorage.removeItem(checkoutDraftStorageKey)
              dispatch(clearCart())
              navigate(`/order-confirmation?orderId=${paymentIntentResponse.order.id}`)
            }}
          />
        </Elements>
      ) : (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          {t('checkout.createPaymentWarning')}
        </Alert>
      )}
      <HStack justify="space-between">
        <Button variant="outline" onClick={() => navigateToStep('review')}>
          {t('checkout.backToReview')}
        </Button>
      </HStack>
    </Stack>
  )

  const renderStepContent = () => {
    if (currentStep === 'shipping') {
      return renderShippingStep()
    }

    if (currentStep === 'review') {
      return renderReviewStep()
    }

    if (currentStep === 'payment') {
      return renderPaymentStep()
    }

    return renderContactStep()
  }

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={8} align="start">
        <Box
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
                {t('checkout.eyebrow')}
              </Text>
              <Heading>{t('checkout.title')}</Heading>
            </Box>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={3}
              aria-label={t('checkout.stepsAria')}
            >
              {checkoutSteps.map((step, index) => {
                const isActive = step.id === currentStep
                const isComplete = index < currentStepIndex

                return (
                  <Button
                    key={step.id}
                    type="button"
                    variant="outline"
                    h="auto"
                    justifyContent="flex-start"
                    px={4}
                    py={3}
                    borderColor={isActive ? 'neutral.900' : 'neutral.200'}
                    bg={isActive ? 'neutral.50' : 'white'}
                    onClick={() => navigateToStep(step.id)}
                  >
                    <Box textAlign="left">
                      <Text color="neutral.500" fontSize="xs" fontWeight="black">
                        {t('checkout.step', { step: index + 1 })}
                      </Text>
                      <Text color="neutral.900" fontWeight="black">
                        {t(step.labelKey)}
                      </Text>
                      {isComplete ? (
                        <Text color="green.600" fontSize="xs">
                          {t('common.complete')}
                        </Text>
                      ) : null}
                    </Box>
                  </Button>
                )
              })}
            </Stack>
            {errorMessage ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            ) : null}
            {renderStepContent()}
          </Stack>
        </Box>

        <Box
          w={{ base: 'full', lg: '360px' }}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={6}
          position={{ lg: 'sticky' }}
          top={{ lg: 24 }}
        >
          <Heading as="h2" size="md" mb={4}>
            {t('checkout.orderSummary')}
          </Heading>
          {cartItems.length === 0 ? (
            <VStack align="stretch" spacing={4}>
              <Text color="neutral.600">{t('checkout.cartEmpty')}</Text>
              <Button as={RouterLink} to="/" variant="outline">
                {t('common.continueShopping')}
              </Button>
            </VStack>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Text color="neutral.600">
                  {t('checkout.subtotalLine', { amount: summary.subtotal.toFixed(2) })}
                </Text>
                {promoDiscount > 0 ? (
                  <Text color="green.700" fontWeight="bold">
                    {t('checkout.promoLine', {
                      code: appliedPromoCode,
                      amount: promoDiscount.toFixed(2),
                    })}
                  </Text>
                ) : null}
                <Text color="neutral.600">
                  {t('checkout.shippingLine', { amount: summary.shipping.toFixed(2) })}
                </Text>
                <Text color="neutral.600">
                  {t('checkout.taxLine', { amount: estimatedTax.toFixed(2) })}
                </Text>
              </Stack>
              <Divider />
              <Stack spacing={2}>
                <Text fontWeight="black">
                  {t('checkout.totalLine', { amount: estimatedTotal.toFixed(2) })}
                </Text>
                <Box>
                  <FormLabel color="neutral.900" fontSize="sm" fontWeight="black">
                    {t('checkout.promoCode')}
                  </FormLabel>
                  <HStack align="start">
                    <Input
                      value={promoInput}
                      onChange={(event) => {
                        setPromoInput(event.target.value)
                        setPromoMessage(undefined)
                      }}
                      placeholder="OSAI10"
                      aria-label={t('checkout.promoCode')}
                    />
                    <Button onClick={handleApplyPromoCode}>{t('common.apply')}</Button>
                  </HStack>
                  {promoMessage ? (
                    <Text
                      color={appliedPromoCode ? 'green.700' : 'orange.600'}
                      fontSize="sm"
                      fontWeight="bold"
                      mt={2}
                    >
                      {promoMessage}
                    </Text>
                  ) : null}
                  {appliedPromoCode ? (
                    <Button mt={2} size="sm" variant="link" onClick={handleRemovePromoCode}>
                      {t('checkout.removePromo')}
                    </Button>
                  ) : null}
                </Box>
              </Stack>
              <Text color="neutral.500" fontSize="sm">
                {isStripeConfigured ? t('checkout.trustedTotalCopy') : t('checkout.mockStripeCopy')}
              </Text>
              <Divider />
              <Stack spacing={3}>
                {[
                  [t('common.securePayment'), t('cart.securePaymentCopy')],
                  [t('cart.returnsClarity'), t('cart.returnsClarityCopy')],
                  [t('common.support'), t('checkout.supportCopy')],
                ].map(([title, body]) => (
                  <Box key={title}>
                    <Text color="neutral.900" fontSize="sm" fontWeight="black">
                      {title}
                    </Text>
                    <Text color="neutral.600" fontSize="sm">
                      {body}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  )
}
