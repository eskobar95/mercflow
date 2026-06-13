import { useCallback, useEffect, useState } from "react"

import {
  fetchPlatformInvites,
  type PlatformInvite,
} from "@/lib/platformInvitesApi"

type InvitesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; invites: PlatformInvite[] }

export function usePlatformInvites(
  getToken: () => Promise<string | null>,
): {
  state: InvitesState
  reload: () => void
} {
  const [state, setState] = useState<InvitesState>({ status: "loading" })

  const loadInvites = useCallback(async (): Promise<void> => {
    setState({ status: "loading" })

    try {
      const invites = await fetchPlatformInvites(getToken)
      setState({ status: "ok", invites })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load invites",
      })
    }
  }, [getToken])

  useEffect(() => {
    void loadInvites()
  }, [loadInvites])

  return {
    state,
    reload: () => {
      void loadInvites()
    },
  }
}
