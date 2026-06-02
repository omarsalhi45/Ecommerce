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
import type { Order } from '../types'

const paymentStatusColorSchemes: Record<Order['paymentStatus'], string> = {
  mock_paid: 'green',
  paid: 'green',
  payment_failed: 'red',
  payment_required: 'yellow',
}
const paymentStatusLabels: Record<Order['paymentStatus'], string> = {
  mock_paid: 'mock paid',
  paid: 'paid',
  payment_failed: 'failed',
  payment_required: 'awaiting payment',
}

export default function OrderConfirmationPage() {
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
          Order placed
        </Text>
        <Heading mb={3}>Thanks for your order.</Heading>
        {isLoading ? (
          <Stack spacing={3} mb={6}>
            <Skeleton h={5} />
            <Skeleton h={5} />
            <Skeleton h={5} />
          </Stack>
        ) : isError || !order ? (
          <Text color="neutral.600" mb={6}>
            Your order was created, but the confirmation details could not be loaded.
          </Text>
        ) : (
          <Stack spacing={3} mb={6}>
            <Text color="neutral.600">Order ID: {order.id}</Text>
            <Text color="neutral.600">Fulfillment status: {order.status}</Text>
            <HStack>
              <Text color="neutral.600">Payment:</Text>
              <Badge colorScheme={paymentStatusColorSchemes[order.paymentStatus]}>
                {paymentStatusLabels[order.paymentStatus]}
              </Badge>
            </HStack>
            <Divider />
            <Text fontWeight="black">Total: ${order.totals.total.toFixed(2)}</Text>
          </Stack>
        )}
        <HStack spacing={3}>
          <Button as={RouterLink} to="/" colorScheme="brand">
            Back to shop
          </Button>
          {order ? (
            <Button as={RouterLink} to={`/track-order?orderId=${order.id}`} variant="outline">
              Track order
            </Button>
          ) : null}
        </HStack>
      </Box>
    </Container>
  )
}
