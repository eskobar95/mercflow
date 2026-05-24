import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdminProduct } from "@medusajs/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import { hydrateEditorModelsFromAdminProduct } from "@/lib/products/productFormHydration"
import {
  buildVariantRowsFromOptionMatrix,
  type ProductOptionRowModel,
  type VariantRowModel,
} from "@/lib/products/productOptionMatrix"
import {
  extractMessageFromMedusaError,
  fetchProductFormPrerequisites,
  persistUnifiedProductCreate,
  persistUnifiedProductUpdate,
  type PersistVariantEconomics,
} from "@/lib/products/productUnifiedPersistence"
import type { ProductFormPrerequisites } from "@/lib/products/productUnifiedPersistence"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

export type UnifiedCatalogProductFormErrors = Record<string, string>

export type UnifiedCatalogPriceParse =
  | { ok: true; minorUnits: number }
  | { ok: false; message: string }

export function parseDkkMajorToMinorUnits(rawInput: string): UnifiedCatalogPriceParse {
  const normalized = rawInput.trim().replace(",", ".")
  if (normalized === "") {
    return { ok: false, message: "Price is required." }
  }

  const major = Number.parseFloat(normalized)
  if (!Number.isFinite(major) || major < 0) {
    return { ok: false, message: "Enter a valid non‑negative amount in DKK." }
  }

  return { ok: true, minorUnits: Math.round(major * 100) }
}

export type UnifiedCatalogStockParse =
  | { ok: true; quantity: number }
  | { ok: false; message: string }

export function parsePositiveIntegerQty(rawInput: string): UnifiedCatalogStockParse {
  const normalized = rawInput.trim()
  if (normalized === "") {
    return { ok: false, message: "Quantity is required." }
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, message: "Enter a whole number (0 or more)." }
  }

  return { ok: true, quantity: parsed }
}

export type ProductFormMode = "create" | "edit"

export class UnifiedFormValidationError extends Error {
  readonly fieldErrors: UnifiedCatalogProductFormErrors

  constructor(fieldErrors: UnifiedCatalogProductFormErrors) {
    super("Validation failed.")
    this.name = "UnifiedFormValidationError"
    this.fieldErrors = fieldErrors
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

type ComboSnapshot = Pick<VariantRowModel, "comboKey" | "selections">

type VariantEconomics = {
  priceDkk: string
  stock: string
  medusaVariantId?: string | null
}

function emptyEconomicsSnapshot(): VariantEconomics {
  return { priceDkk: "", stock: "", medusaVariantId: null }
}

export function useUnifiedCatalogProductForm(params: {
  mode: ProductFormMode
  productId?: string
  onSuccessfulCreateNavigate?: (productId: string) => void
}): {
  sdkReturned: ReturnType<typeof createMercflowMedusaSdk>
  prerequisites: ProductFormPrerequisites | undefined
  categories: Array<{ id: string; label: string }>
  prerequisitesError: unknown
  categoriesError: unknown
  hydratedProduct?: AdminProduct
  productHydrationError: unknown
  isLoadingProductDetail: boolean
  title: string
  description: string
  isPublished: boolean
  optionRows: ProductOptionRowModel[]
  derivedCombos: ComboSnapshot[]
  variantRowsPreview: VariantRowModel[]
  selectedCategoryIds: Set<string>
  fieldErrors: UnifiedCatalogProductFormErrors
  formError: string | null
  isSubmitting: boolean
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setIsPublished: (value: boolean) => void
  toggleCategory: (categoryId: string, enabled: boolean) => void
  addOptionRow: () => void
  updateOptionRow: (index: number, updater: Partial<ProductOptionRowModel>) => void
  removeOptionRow: (index: number) => void
  updateEconomicsRow: (
    comboKey: string,
    patch: Partial<Pick<VariantRowModel, "priceDkk" | "stock">>,
  ) => void
  submit: () => Promise<void>
} {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])

  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublished, setIsPublished] = useState(false)

  const [optionRows, setOptionRows] = useState<ProductOptionRowModel[]>(() => [
    { title: "", values: [] },
  ])

  const [economicsMap, setEconomicsMap] = useState<
    Partial<Record<string, VariantEconomics>>
  >(() => ({}))

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(() => new Set())

  const [fieldErrors, setFieldErrors] = useState<UnifiedCatalogProductFormErrors>(() => ({}))
  const [formError, setFormError] = useState<string | null>(null)

  const createBootstrapped = useRef(params.mode !== "create")

  const prereqQuery = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-form-prereq"],
    queryFn: async (): Promise<ProductFormPrerequisites> => fetchProductFormPrerequisites(sdk!),
  })

  const categoriesQuery = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-form-categories"],
    queryFn: async (): Promise<unknown> =>
      sdk!.admin.productCategory.list({
        fields: "+id,+name",
        limit: 200,
        offset: 0,
      }),
  })

  const productQuery = useQuery({
    enabled: sdk !== null && params.mode === "edit" && params.productId !== undefined,
    queryKey: ["catalog-product-detail-editor", params.productId],
    queryFn: async (): Promise<{ product: AdminProduct }> =>
      sdk!.admin.product.retrieve(params.productId!, { fields: ADMIN_PRODUCT_EDITOR_FIELDS }),
  })

  const categories = useMemo(() => {
    type Payload = {
      product_categories?: Array<{ id?: string; name?: string }>
    }

    const resolved = categoriesQuery.data as Payload | undefined
    const rows = resolved?.product_categories ?? []

    return rows
      .filter(
        (row): row is { id: string; name: string } =>
          typeof row.id === "string" && typeof row.name === "string",
      )
      .map((row) => ({ id: row.id, label: row.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [categoriesQuery.data])

  const derivedCombos = useMemo(() => buildVariantRowsFromOptionMatrix(optionRows), [optionRows])

  useEffect(() => {
    const keysNext = derivedCombos.map((combo) => combo.comboKey)

    setEconomicsMap((previous) => {
      const cloned: Partial<Record<string, VariantEconomics>> = {}

      for (const key of keysNext) {
        const existing = previous[key] ?? emptyEconomicsSnapshot()

        cloned[key] = {
          priceDkk: existing.priceDkk,
          stock: existing.stock,
          medusaVariantId: existing.medusaVariantId,
        }
      }

      return cloned
    })
  }, [derivedCombos])

  useEffect(() => {
    const productEntity = productQuery.data?.product
    if (
      params.mode !== "edit" ||
      params.productId === undefined ||
      productEntity === undefined
    ) {
      return
    }

    const hydrated = hydrateEditorModelsFromAdminProduct(productEntity)

    setTitle(productEntity.title?.trim() ?? "")
    setDescription(
      typeof productEntity.description === "string" && productEntity.description.trim() !== ""
        ? productEntity.description
        : "",
    )
    setIsPublished(productEntity.status === "published")

    setSelectedCategoryIds(
      new Set(
        Array.isArray(productEntity.categories)
          ? productEntity.categories
              .map((category) => category?.id ?? "")
              .filter((candidate) => candidate !== "")
          : [],
      ),
    )

    if (hydrated.optionRows.length > 0) {
      setOptionRows(hydrated.optionRows)
    } else {
      setOptionRows([{ title: "", values: [] }])
    }

    const economicsHydrated: Partial<Record<string, VariantEconomics>> = {}
    for (const rowVariant of hydrated.variantRows) {
      economicsHydrated[rowVariant.comboKey] = {
        priceDkk: rowVariant.priceDkk,
        stock: rowVariant.stock,
        medusaVariantId: rowVariant.medusaVariantId ?? null,
      }
    }

    setEconomicsMap(economicsHydrated)
  }, [params.mode, params.productId, productQuery.data])

  useEffect(() => {
    if (params.mode !== "create") {
      return
    }

    if (createBootstrapped.current) {
      return
    }

    createBootstrapped.current = true
    const combosBootstrap = buildVariantRowsFromOptionMatrix([{ title: "", values: [] }])
    const initialEconomics: Partial<Record<string, VariantEconomics>> = {}
    for (const combo of combosBootstrap) {
      initialEconomics[combo.comboKey] = emptyEconomicsSnapshot()
    }

    setEconomicsMap(initialEconomics)
    setOptionRows([{ title: "", values: [] }])
  }, [params.mode])

  const variantRowsPreview = useMemo((): VariantRowModel[] => {
    return derivedCombos.map((combo) => ({
      comboKey: combo.comboKey,
      selections: combo.selections,
      priceDkk: economicsMap[combo.comboKey]?.priceDkk ?? "",
      stock: economicsMap[combo.comboKey]?.stock ?? "",
      medusaVariantId: economicsMap[combo.comboKey]?.medusaVariantId ?? undefined,
    }))
  }, [derivedCombos, economicsMap])

  const toggleCategory = useCallback((categoryId: string, enabled: boolean): void => {
    setSelectedCategoryIds((previous) => {
      const next = new Set(previous)
      if (enabled) {
        next.add(categoryId)
      } else {
        next.delete(categoryId)
      }
      return next
    })
  }, [])

  const addOptionRow = useCallback((): void => {
    setOptionRows((rows) => [...rows, { title: "", values: [] }])
  }, [])

  const updateOptionRow = useCallback(
    (index: number, updater: Partial<ProductOptionRowModel>): void => {
      setOptionRows((rows) =>
        rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updater } : row)),
      )
    },
    [],
  )

  const removeOptionRow = useCallback((index: number): void => {
    setOptionRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
  }, [])

  const updateEconomicsRow = useCallback(
    (comboKey: string, patch: Partial<Pick<VariantRowModel, "priceDkk" | "stock">>): void => {
      setEconomicsMap((previous) => {
        const existing = previous[comboKey] ?? emptyEconomicsSnapshot()
        return {
          ...previous,
          [comboKey]: {
            ...existing,
            ...patch,
          },
        }
      })
    },
    [],
  )

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured for this build.")
      }

      const prerequisitesEntity = prereqQuery.data
      if (prerequisitesEntity === undefined) {
        throw new Error("Medusa prerequisites are still loading.")
      }

      setFormError(null)
      setFieldErrors({})

      const validationErrors: UnifiedCatalogProductFormErrors = {}
      const titleTrimmed = title.trim()
      if (titleTrimmed === "") {
        validationErrors.title = "Title is required."
      }

      if (derivedCombos.length === 0) {
        validationErrors.variants = "Add at least one variant row."
      }

      for (const combo of derivedCombos) {
        const economicsSnapshot = economicsMap[combo.comboKey]
        const priceParsed = parseDkkMajorToMinorUnits(economicsSnapshot?.priceDkk ?? "")
        if (!priceParsed.ok) {
          validationErrors[`price_${combo.comboKey}`] = priceParsed.message
        }

        const stockParsed = parsePositiveIntegerQty(economicsSnapshot?.stock ?? "")
        if (!stockParsed.ok) {
          validationErrors[`stock_${combo.comboKey}`] = stockParsed.message
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors)
        throw new UnifiedFormValidationError(validationErrors)
      }

      const cleanPayload = derivedCombos.map((combo): PersistVariantEconomics => {
        const econ = economicsMap[combo.comboKey]
        const priceResolved = parseDkkMajorToMinorUnits(econ?.priceDkk ?? "")
        const stockResolved = parsePositiveIntegerQty(econ?.stock ?? "")

        if (!priceResolved.ok || !stockResolved.ok) {
          throw new Error("Unexpected validation drift while building the catalogue payload.")
        }

        return {
          comboKey: combo.comboKey,
          selections: combo.selections,
          priceMinorUnits: priceResolved.minorUnits,
          stockQuantity: stockResolved.quantity,
          existingVariantId: econ?.medusaVariantId,
        }
      })

      const categoryIds = [...selectedCategoryIds.values()]

      const trimmedOptionRows = optionRows
        .map((rowOption) => ({
          ...rowOption,
          title: rowOption.title.trim(),
          values: rowOption.values.map((value) => value.trim()).filter((value) => value !== ""),
        }))
        .filter((rowClean) => rowClean.title !== "" && rowClean.values.length > 0)

      if (params.mode === "create") {
        const { productId } = await persistUnifiedProductCreate({
          sdk,
          prerequisites: prerequisitesEntity,
          title: titleTrimmed,
          description,
          status: isPublished ? "published" : "draft",
          categoryIds,
          optionRows: trimmedOptionRows,
          variants: cleanPayload,
        })

        await queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
        })
        await queryClient.invalidateQueries({ queryKey: ["catalog-product-detail-editor", productId] })

        if (typeof params.onSuccessfulCreateNavigate === "function") {
          params.onSuccessfulCreateNavigate(productId)
        }
      } else if (typeof params.productId === "string" && params.productId.trim() !== "") {
        await persistUnifiedProductUpdate({
          sdk,
          prerequisites: prerequisitesEntity,
          productId: params.productId,
          title: titleTrimmed,
          description,
          status: isPublished ? "published" : "draft",
          categoryIds,
          optionRows,
          variants: cleanPayload,
        })

        await queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
        })
        await queryClient.invalidateQueries({
          queryKey: ["catalog-product-detail-editor", params.productId],
        })
        await queryClient.invalidateQueries({
          queryKey: ["admin-product-detail", params.productId],
        })
      } else {
        throw new Error("Missing product id for edit flows.")
      }
    },
    onError: (errorCandidate: unknown) => {
      if (errorCandidate instanceof UnifiedFormValidationError) {
        setFormError(null)
        return
      }

      const messageCandidate = extractMessageFromMedusaError(errorCandidate)

      if (/validation failed/iu.test(messageCandidate)) {
        setFormError(`${messageCandidate} — check SKU overlap or duplicated option picks.`)
        return
      }

      setFormError(messageCandidate)
    },
  })

  const submit = useCallback(async (): Promise<void> => {
    await saveMutation.mutateAsync()
  }, [saveMutation])

  return {
    sdkReturned: sdk,
    prerequisites: prereqQuery.data ?? undefined,
    categories,
    prerequisitesError: prereqQuery.error,
    categoriesError: categoriesQuery.error,
    hydratedProduct: productQuery.data?.product ?? undefined,
    productHydrationError: productQuery.error,
    isLoadingProductDetail:
      params.mode === "edit" && (productQuery.isLoading || productQuery.isFetching),

    title,
    description,
    isPublished,
    optionRows,
    derivedCombos,
    variantRowsPreview,
    selectedCategoryIds,
    fieldErrors,
    formError,
    isSubmitting: saveMutation.isPending,

    setTitle,
    setDescription,
    setIsPublished,
    toggleCategory,
    addOptionRow,
    updateOptionRow,
    removeOptionRow,
    updateEconomicsRow,
    submit,
  }
}
