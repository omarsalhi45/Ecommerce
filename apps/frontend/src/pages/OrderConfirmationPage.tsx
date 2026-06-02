import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  HStack,
  Heading,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useGetOrderQuery } from '../api/ordersApi'
import { useTranslation } from '../i18n'
import type { Order } from '../types'

const paymentStatusColorSchemes: Record<Order['paymentStatus'], string> = {
  mock_paid: 'green',
  paid: 'green',
  payment_failed: 'red',
  payment_required: 'yellow',
}
const paymentStatusLabelKeys: Record<
  Order['paymentStatus'],
  | 'order.paymentStatus.mockPaid'
  | 'order.paymentStatus.paid'
  | 'order.paymentStatus.failed'
  | 'order.paymentStatus.required'
> = {
  mock_paid: 'order.paymentStatus.mockPaid',
  paid: 'order.paymentStatus.paid',
  payment_failed: 'order.paymentStatus.failed',
  payment_required: 'order.paymentStatus.required',
}

export default function OrderConfirmationPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') ?? ''
  const {
    data: order,
    isError,
    isLoading,
  } = useGetOrderQuery(orderId, {
    pollingInterval: 3000,
    skip: !orderId,
  })

  return (
    <Container maxW="3xl" py={{ base: 10, md: 16 }}>
      <Box
        bg="white"
        border="1px solid"
        borderColor="neutral.200"
        borderRadius="lg"
        p={{ base: 6, md: 8 }}
      >
        <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
          {t('order.placed')}
        </Text>
        <Heading mb={3}>{t('order.thanks')}</Heading>
        {isLoading ? (
          <Stack spacing={3} mb={6}>
            <Skeleton h={5} />
            <Skeleton h={5} />
            <Skeleton h={5} />
          </Stack>
        ) : isError || !order ? (
          <Text color="neutral.600" mb={6}>
            {t('order.loadError')}
          </Text>
        ) : (
          <Stack spacing={3} mb={6}>
            <Text color="neutral.600">{t('order.id', { id: order.id })}</Text>
            <Text color="neutral.600">
              {t('order.fulfillmentStatus', { status: order.status })}
            </Text>
            <HStack>
              <Text color="neutral.600">{t('order.payment')}</Text>
              <Badge colorScheme={paymentStatusColorSchemes[order.paymentStatus]}>
                {t(paymentStatusLabelKeys[order.paymentStatus])}
              </Badge>
            </HStack>
            <Divider />
            <Text fontWeight="black">
              {t('order.total', { total: order.totals.total.toFixed(2) })}
            </Text>
          </Stack>
        )}
        <HStack spacing={3}>
          <Button as={RouterLink} to="/" colorScheme="brand">
            {t('common.backToShop')}
          </Button>
          {order ? (
            <Button as={RouterLink} to={`/track-order?orderId=${order.id}`} variant="outline">
              {t('order.trackOrder')}
            </Button>
          ) : null}
        </HStack>
      </Box>
    </Container>
  )
}
