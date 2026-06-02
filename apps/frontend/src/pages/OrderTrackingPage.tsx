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
import type { Order } from '../types'

const orderStatusLabels: Record<Order['status'], string> = {
  pending: 'Order received',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const paymentStatusLabels: Record<Order['paymentStatus'], string> = {
  mock_paid: 'Paid',
  paid: 'Paid',
  payment_failed: 'Payment failed',
  payment_required: 'Awaiting payment',
}

const orderMilestones: Array<{ readonly status: Order['status']; readonly label: string }> = [
  { status: 'pending', label: 'Order received' },
  { status: 'shipped', label: 'On the way' },
  { status: 'delivered', label: 'Delivered' },
]

const getMilestoneIndex = (status: Order['status']) => {
  if (status === 'cancelled') {
    return -1
  }

  return orderMilestones.findIndex((milestone) => milestone.status === status)
}

export default function OrderTrackingPage() {
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
            Order tracking
          </Text>
          <Heading as="h1" size="2xl" color="neutral.900">
            Track your OSAI order
          </Heading>
          <Text color="neutral.600" mt={2}>
            Enter the order ID from your confirmation email to see the latest fulfillment status.
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
              <FormLabel>Order ID</FormLabel>
              <Input
                value={orderIdInput}
                onChange={(event) => setOrderIdInput(event.target.value)}
                placeholder="order_..."
              />
            </FormControl>
            <Button type="submit" colorScheme="brand" minW="140px">
              Track order
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
              Your order ID appears on the confirmation page and in your order email.
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
              We could not find that order.
            </Heading>
            <Text color="neutral.600">
              Check the order ID and try again, or reply to your confirmation email for help.
            </Text>
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
                  Order ID
                </Text>
                <Text fontWeight="black">{order.id}</Text>
              </Box>
              <Badge colorScheme={order.status === 'cancelled' ? 'red' : 'green'}>
                {orderStatusLabels[order.status]}
              </Badge>
            </HStack>

            <Stack spacing={4}>
              {order.status === 'cancelled' ? (
                <Box border="1px solid" borderColor="red.200" borderRadius="lg" p={4}>
                  <Text color="red.700" fontWeight="black">
                    This order was cancelled.
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
                          {milestone.label}
                        </Text>
                        <Text color="neutral.600" fontSize="sm">
                          {isComplete ? 'Completed' : 'Coming next'}
                        </Text>
                      </Box>
                    </HStack>
                  )
                })
              )}
            </Stack>

            <Stack mt={6} spacing={2}>
              <Text color="neutral.600">Payment: {paymentStatusLabels[order.paymentStatus]}</Text>
              <Text color="neutral.600">Total: ${order.totals.total.toFixed(2)}</Text>
              <Text color="neutral.600">
                {isFetching
                  ? 'Refreshing status...'
                  : 'Status refreshes automatically while this page is open.'}
              </Text>
            </Stack>
          </Box>
        )}

        <Button as={RouterLink} to="/" variant="outline" alignSelf="start">
          Back to shop
        </Button>
      </VStack>
    </Container>
  )
}
