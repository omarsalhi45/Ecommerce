import { Box, Button, Container, Divider, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useGetOrderQuery } from '../api/ordersApi'

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') ?? ''
  const { data: order, isError, isLoading } = useGetOrderQuery(orderId, { skip: !orderId })

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
            <Text color="neutral.600">Status: {order.status}</Text>
            <Divider />
            <Text fontWeight="black">Total: ${order.totals.total.toFixed(2)}</Text>
          </Stack>
        )}
        <Button as={RouterLink} to="/" colorScheme="brand">
          Back to shop
        </Button>
      </Box>
    </Container>
  )
}
