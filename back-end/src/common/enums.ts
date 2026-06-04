/** Delivery channels. EMAIL + IN_APP are live; SMS is reserved for future use. */
export enum Channel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
}

/** Lifecycle status of a single notification log entry. */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DLQ = 'DLQ',
}
