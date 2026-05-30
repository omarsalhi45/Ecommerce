import type { Order } from '@osai/shared'
import { apiConfig } from '../config'

export interface EmailNotification {
  readonly to: string
  readonly subject: string
  readonly body: string
}

const sentNotifications: EmailNotification[] = []

const getEmailSender = () => apiConfig.emailFrom ?? 'no-reply@osai.local'

const sendWithResend = async (notification: EmailNotification) => {
  if (!apiConfig.resendApiKey || apiConfig.nodeEnv === 'test') {
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiConfig.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailSender(),
      to: notification.to,
      subject: notification.subject,
      text: notification.body,
    }),
  })

  if (!response.ok) {
    const responseBody = await response.text()
    throw new Error(`Resend email failed with ${response.status}: ${responseBody}`)
  }
}

export const sendEmailNotification = async (notification: EmailNotification) => {
  sentNotifications.push(notification)

  try {
    await sendWithResend(notification)
  } catch (error) {
    console.error('[email] delivery failed', error)
  }

  if (apiConfig.nodeEnv !== 'test' && !apiConfig.resendApiKey) {
    console.info('[email] resend disabled', {
      from: getEmailSender(),
      subject: notification.subject,
      to: notification.to,
    })
  }
}

export const sendOrderConfirmationEmail = async (order: Order) => {
  await sendEmailNotification({
    to: order.customer.email,
    subject: `OSAI order ${order.id} confirmed`,
    body: `Thanks ${order.customer.firstName}. Your order total is $${order.totals.total.toFixed(
      2
    )}.`,
  })
}

export const sendOrderStatusEmail = async (order: Order) => {
  await sendEmailNotification({
    to: order.customer.email,
    subject: `OSAI order ${order.id} is ${order.status}`,
    body: `Your order status changed to ${order.status}.`,
  })
}

export const getSentEmailNotificationsForTests = () => [...sentNotifications]

export const resetEmailNotificationsForTests = () => {
  sentNotifications.splice(0, sentNotifications.length)
}
