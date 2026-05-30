import type { Order } from '@osai/shared'
import { apiConfig } from '../config'

export interface EmailNotification {
  readonly to: string
  readonly subject: string
  readonly body: string
}

const sentNotifications: EmailNotification[] = []

export const sendEmailNotification = async (notification: EmailNotification) => {
  sentNotifications.push(notification)

  if (apiConfig.nodeEnv !== 'test') {
    console.info('[email]', {
      from: apiConfig.emailFrom ?? 'no-reply@osai.local',
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
