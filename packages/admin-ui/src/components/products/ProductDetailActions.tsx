import { type ReactNode, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogDestructiveAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { IconButton } from "@/components/ui/IconButton"
import { useToast } from "@/components/ui/Toast"
import { extractMessageFromMedusaError } from "@/lib/products/productUnifiedPersistence"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

type ProductDetailActionsProps = {
  productId: string
  productTitle: string
}

/** TopBar overflow actions for a product (delete, with confirm). */
export function ProductDetailActions({ productId, productTitle }: ProductDetailActionsProps): ReactNode {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured.")
      }
      await sdk.admin.product.delete(productId)
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
      })
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Product deleted" })
      navigate("/products")
    },
    onError: (error: unknown) => {
      toast({ variant: "error", title: "Delete failed", description: extractMessageFromMedusaError(error) })
    },
  })

  if (sdk === null) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton variant="ghost" label="More actions">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="5" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
            Delete product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              “{productTitle}” and its variants will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogDestructiveAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                void deleteMutation.mutateAsync()
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
