import { MedusaService, Modules } from "@medusajs/framework/utils"

/** Emitted at application start so backend subscribers can register tenant isolation. */
export const APPLICATION_BOOTSTRAP_EVENT = "application.bootstrap"

type EventBusEmitter = {
  emit: (payload: { name: string; data: Record<string, never> }) => Promise<void>
}

class TenancyCoreModuleService extends MedusaService({}) {
  declare readonly __container__: Record<string, unknown>

  __hooks = {
    onApplicationStart: async (): Promise<void> => {
      const eventBus = this.__container__[Modules.EVENT_BUS] as EventBusEmitter | undefined
      if (!eventBus?.emit) {
        return
      }
      await eventBus.emit({ name: APPLICATION_BOOTSTRAP_EVENT, data: {} })
    },
  }
}

export default TenancyCoreModuleService
