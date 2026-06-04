// Insert after the `customers` route block when resolving PR #23 router conflicts:
      {
        path: "subscriptions",
        handle: { title: "Subscriptions" } satisfies AppRouteHandle,
        lazy: async () => {
          const { SubscriptionsListPage } = await import("@/pages/SubscriptionsListPage")
          return { Component: SubscriptionsListPage }
        },
      },
