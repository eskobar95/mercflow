import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { startNotificationDomainStatusWorker } from "../workers/notification-domain-status-worker"
import { APPLICATION_BOOTSTRAP_EVENT } from "./tenant-bootstrap"

async function notificationDomainPollerBootstrap({
  container,
}: SubscriberArgs): Promise<void> {
  await startNotificationDomainStatusWorker(container)
}

export default notificationDomainPollerBootstrap

export const config: SubscriberConfig = {
  event: APPLICATION_BOOTSTRAP_EVENT,
}
