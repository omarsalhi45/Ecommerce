import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { type FormEvent, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useGetOrderQuery } from '../api/ordersApi'
import { useTranslation } from '../i18n'
import type { Order } from '../types'

const orderStatusLabelKeys: Record<
  Order['status'],
  | 'tracking.status.received'
  | 'tracking.status.shipped'
  | 'tracking.status.delivered'
  | 'tracking.status.cancelled'
> = {
  pending: 'tracking.status.received',
  shipped: 'tracking.status.shipped',
  delivered: 'tracking.status.delivered',
  cancelled: 'tracking.status.cancelled',
}

const paymentStatusLabelKeys: Record<
  Order['paymentStatus'],
  'order.paymentStatus.paid' | 'order.paymentStatus.failed' | 'order.paymentStatus.required'
> = {
  mock_paid: 'order.paymentStatus.paid',
  paid: 'order.paymentStatus.paid',
  payment_failed: 'order.paymentStatus.failed',
  payment_required: 'order.paymentStatus.required',
}

const orderMilestones: Array<{
  readonly status: Order['status']
  readonly labelKey:
    | 'tracking.status.received'
    | 'tracking.milestone.onTheWay'
    | 'tracking.status.delivered'
}> = [
  { status: 'pending', labelKey: 'tracking.status.received' },
  { status: 'shipped', labelKey: 'tracking.milestone.onTheWay' },
  { status: 'delivered', labelKey: 'tracking.status.delivered' },
]

const getMilestoneIndex = (status: Order['status']) => {
  if (status === 'cancelled') {
    return -1
  }

  return orderMilestones.findIndex((milestone) => milestone.status === status)
}

export default function OrderTrackingPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const trackedOrderId = searchParams.get('orderId')?.trim() ?? ''
  const [orderIdInput, setOrderIdInput] = useState(trackedOrderId)
  const {
    data: order,
    isError,
    isFetching,
    isLoading,
  } = useGetOrderQuery(trackedOrderId, {
    pollingInterval: 3000,
    skip: !trackedOrderId,
  })
  const milestoneIndex = order ? getMilestoneIndex(order.status) : -1

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextOrderId = orderIdInput.trim()

    if (nextOrderId) {
      setSearchParams({ orderId: nextOrderId })
    }
  }

  return (
    <Container maxW="4xl" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text color="accent.600" fontSize="sm" fontWeight="black" textTransform="uppercase">
            {t('tracking.eyebrow')}
          </Text>
          <Heading as="h1" size="2xl" color="neutral.900">
            {t('tracking.title')}
          </Heading>
          <Text color="neutral.600" mt={2}>
            {t('tracking.copy')}
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          borderRadius="lg"
          p={{ base: 4, md: 5 }}
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={3} align="end">
            <FormControl>
              <FormLabel>{t('tracking.orderIdLabel')}</FormLabel>
              <Input
                value={orderIdInput}
                onChange={(event) => setOrderIdInput(event.target.value)}
                placeholder="order_..."
              />
            </FormControl>
            <Button type="submit" colorScheme="brand" minW="140px">
              {t('order.trackOrder')}
            </Button>
          </Stack>
        </Box>

        {!trackedOrderId ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            p={{ base: 5, md: 6 }}
          >
            <Text color="neutral.700" fontWeight="semibold">
              {t('tracking.emptyHint')}
            </Text>
          </Box>
        ) : isLoading ? (
          <Stack bg="white" borderRadius="lg" p={{ base: 5, md: 6 }} spacing={3}>
            <Skeleton h={5} />
            <Skeleton h={5} />
            <Skeleton h={5} />
          </Stack>
        ) : isError || !order ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="red.200"
            borderRadius="lg"
            p={{ base: 5, md: 6 }}
          >
            <Heading as="h2" size="md" mb={2}>
              {t('tracking.notFoundTitle')}
            </Heading>
            <Text color="neutral.600">{t('tracking.notFoundCopy')}</Text>
          </Box>
        ) : (
          <Box
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            borderRadius="lg"
            p={{ base: 5, md: 6 }}
          >
            <HStack justify="space-between" align="start" mb={5}>
              <Box>
                <Text color="neutral.500" fontSize="sm">
                  {t('tracking.orderIdLabel')}
                </Text>
                <Text fontWeight="black">{order.id}</Text>
              </Box>
              <Badge colorScheme={order.status === 'cancelled' ? 'red' : 'green'}>
                {t(orderStatusLabelKeys[order.status])}
              </Badge>
            </HStack>

            <Stack spacing={4}>
              {order.status === 'cancelled' ? (
                <Box border="1px solid" borderColor="red.200" borderRadius="lg" p={4}>
                  <Text color="red.700" fontWeight="black">
                    {t('tracking.cancelledCopy')}
                  </Text>
                </Box>
              ) : (
                orderMilestones.map((milestone, index) => {
                  const isComplete = index <= milestoneIndex

                  return (
                    <HStack key={milestone.status} spacing={3} align="start">
                      <Box
                        mt={1}
                        boxSize={4}
                        borderRadius="full"
                        bg={isComplete ? 'black' : 'neutral.200'}
                      />
                      <Box>
                        <Text color="neutral.900" fontWeight="black">
                          {t(milestone.labelKey)}
                        </Text>
                        <Text color="neutral.600" fontSize="sm">
                          {isComplete ? t('tracking.completed') : t('tracking.comingNext')}
                        </Text>
                      </Box>
                    </HStack>
                  )
                })
              )}
            </Stack>

            <Stack mt={6} spacing={2}>
              <Text color="neutral.600">
                {t('order.payment')} {t(paymentStatusLabelKeys[order.paymentStatus])}
              </Text>
              <Text color="neutral.600">
                {t('order.total', { total: order.totals.total.toFixed(2) })}
              </Text>
              <Text color="neutral.600">
                {isFetching ? t('tracking.refreshing') : t('tracking.autoRefresh')}
              </Text>
            </Stack>
          </Box>
        )}

        <Button as={RouterLink} to="/" variant="outline" alignSelf="start">
          {t('common.backToShop')}
        </Button>
      </VStack>
    </Container>
  )
}
