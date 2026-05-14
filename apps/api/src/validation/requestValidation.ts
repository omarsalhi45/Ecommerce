import { ApiError } from '../middleware/errorMiddleware'

interface CheckoutLineItemInput {
  readonly productId?: unknown
  readonly quantity?: unknown
}

export interface CheckoutCustomerInput {
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly phone?: string
}

export interface CheckoutAddressInput {
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
  readonly country: string
}

export interface CheckoutRequestInput {
  readonly customer: CheckoutCustomerInput
  readonly shippingAddress: CheckoutAddressInput
  readonly items: Array<{
    readonly productId: string
    readonly quantity: number
  }>
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const readRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${fieldName} is required`, 'VALIDATION_ERROR')
  }

  return value.trim()
}

const readOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, 'Optional text fields must be strings', 'VALIDATION_ERROR')
  }

  return value.trim()
}

export const validateCheckoutRequest = (body: unknown): CheckoutRequestInput => {
  if (!isRecord(body)) {
    throw new ApiError(400, 'Checkout payload is required', 'VALIDATION_ERROR')
  }

  if (!isRecord(body.customer)) {
    throw new ApiError(400, 'Customer information is required', 'VALIDATION_ERROR')
  }

  if (!isRecord(body.shippingAddress)) {
    throw new ApiError(400, 'Shipping address is required', 'VALIDATION_ERROR')
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ApiError(400, 'Cart items are required', 'VALIDATION_ERROR')
  }

  const items = body.items.map((item) => {
    const lineItem = item as CheckoutLineItemInput
    const productId = readRequiredString(lineItem.productId, 'Product id')

    if (!Number.isInteger(lineItem.quantity) || Number(lineItem.quantity) <= 0) {
      throw new ApiError(400, 'Item quantity must be a positive integer', 'VALIDATION_ERROR')
    }

    return {
      productId,
      quantity: Number(lineItem.quantity),
    }
  })

  return {
    customer: {
      email: readRequiredString(body.customer.email, 'Email').toLowerCase(),
      firstName: readRequiredString(body.customer.firstName, 'First name'),
      lastName: readRequiredString(body.customer.lastName, 'Last name'),
      phone: readOptionalString(body.customer.phone),
    },
    shippingAddress: {
      line1: readRequiredString(body.shippingAddress.line1, 'Address line 1'),
      line2: readOptionalString(body.shippingAddress.line2),
      city: readRequiredString(body.shippingAddress.city, 'City'),
      state: readRequiredString(body.shippingAddress.state, 'State'),
      postalCode: readRequiredString(body.shippingAddress.postalCode, 'Postal code'),
      country: readRequiredString(body.shippingAddress.country, 'Country'),
    },
    items,
  }
}

export interface AuthCredentialsInput {
  readonly email: string
  readonly password: string
}

export interface RegisterRequestInput extends AuthCredentialsInput {
  readonly name: string
}

const validateEmail = (email: string): string => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Valid email is required', 'VALIDATION_ERROR')
  }

  return email.toLowerCase()
}

const validatePassword = (password: string): string => {
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters', 'VALIDATION_ERROR')
  }

  return password
}

export const validateRegisterRequest = (body: unknown): RegisterRequestInput => {
  if (!isRecord(body)) {
    throw new ApiError(400, 'Registration payload is required', 'VALIDATION_ERROR')
  }

  return {
    name: readRequiredString(body.name, 'Name'),
    email: validateEmail(readRequiredString(body.email, 'Email')),
    password: validatePassword(readRequiredString(body.password, 'Password')),
  }
}

export const validateLoginRequest = (body: unknown): AuthCredentialsInput => {
  if (!isRecord(body)) {
    throw new ApiError(400, 'Login payload is required', 'VALIDATION_ERROR')
  }

  return {
    email: validateEmail(readRequiredString(body.email, 'Email')),
    password: readRequiredString(body.password, 'Password'),
  }
}
