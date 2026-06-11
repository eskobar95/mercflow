import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ConfigModule } from "@medusajs/framework/types"

import { startWorkers } from "../workers"
import { APPLICATION_BOOTSTRAP_EVENT } from "./tenant-bootstrap"

let workersStarted = false

async function workerBootstrapSubscriber({ container }: SubscriberArgs): Promise<void> {
  const configModule = container.resolve<ConfigModule>(
    ContainerRegistrationKeys.CONFIG_MODULE
  )
  const workerMode = configModule.projectConfig.workerMode ?? "shared"

  if (workerMode === "server") {
    return
  }

  if (workersStarted) {
    return
  }

  await startWorkers(container)
  workersStarted = true
}

export default workerBootstrapSubscriber

export const config: SubscriberConfig = {
  event: APPLICATION_BOOTSTRAP_EVENT,
}
