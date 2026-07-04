import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdminProduct } from "@medusajs/types"
import { useCallback, useMemo, useRef, useState, type MutableRefObject } from "react"

import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import { hydrateEditorModelsFromAdminProduct, type CatalogEditFormBootstrap } from "@/lib/products/productFormHydration"
import {
  buildVariantRowsFromOptionMatrix,
  hasDefinedProductOptions,
  type ProductOptionRowModel,
  type VariantRowModel,
} from "@/lib/products/productOptionMatrix"
import {
  extractMessageFromMedusaError,
  fetchProductFormPrerequisites,
  fetchVariantStockQuantitiesAtLocation,
  persistUnifiedProductCreate,
  persistUnifiedProductUpdate,
  resolvePersistVariantShipping,
  type PersistVariantEconomics,
  type PersistVariantShipping,
} from "@/lib/products/productUnifiedPersistence"
import {
  applyStockQuantitiesToEconomicsMap,
  economicsMapFromVariantRows,
  mergeEconomicsMapForComboKeys,
  type VariantEconomicsDraft,
} from "@/lib/products/productFormEconomics"
import type { ProductFormPrerequisites } from "@/lib/products/productUnifiedPersistence"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"
import {
  captureUnifiedCatalogFormSnapshot,
  type UnifiedCatalogFormSnapshot,
  unifiedCatalogFormSnapshotsEqual,
} from "@/lib/products/unifiedProductFormSnapshot"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

export type UnifiedCatalogProductShippingContext = {
  requiresShipping: boolean
  resolveShippingForCombo: (comboKey: string) => PersistVariantShipping
}

export type UnifiedCatalogProductFormErrors = Record<string, string>

type UnifiedCatalogPriceParse =
  | { ok: true; minorUnits: number }
  | { ok: false; message: string }

function parseDkkMajorToMinorUnits(rawInput: string): UnifiedCatalogPriceParse {
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

type UnifiedCatalogStockParse =
  | { ok: true; quantity: number }
  | { ok: false; message: string }

function parsePositiveIntegerQty(rawInput: string): UnifiedCatalogStockParse {
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

type ProductFormMode = "create" | "edit"

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

type VariantEconomics = VariantEconomicsDraft

function emptyEconomicsSnapshot(): VariantEconomics {
  return { priceDkk: "", stock: "", medusaVariantId: null }
}

export function useUnifiedCatalogProductForm(params: {
  mode: ProductFormMode
  productId?: string
  /** When set (keyed edit surface), product data is pre-loaded and form state initializes from this snapshot. */
  editBootstrap?: CatalogEditFormBootstrap
  /** Pre-fetched product for edit saves and stock enrichment; skips the editor retrieve query. */
  hydratedProduct?: AdminProduct
  onSuccessfulCreateNavigate?: (productId: string) => void
  shippingContextRef?: MutableRefObject<UnifiedCatalogProductShippingContext | null>
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
  hasDefinedOptions: boolean
  derivedCombos: ComboSnapshot[]
  variantRowsPreview: VariantRowModel[]
  selectedCategoryIds: Set<string>
  fieldErrors: UnifiedCatalogProductFormErrors
  formError: string | null
  isSubmitting: boolean
  isDirty: boolean
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
  submit: () => Promise<string | undefined>
} {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])

  const queryClient = useQueryClient()

  const bootstrap = params.editBootstrap

  const [title, setTitle] = useState(() => bootstrap?.title ?? "")
  const [description, setDescription] = useState(() => bootstrap?.description ?? "")
  const [isPublished, setIsPublished] = useState(() => bootstrap?.isPublished ?? false)

  const [optionRows, setOptionRows] = useState<ProductOptionRowModel[]>(
    () => bootstrap?.optionRows ?? [],
  )

  const [economicsMap, setEconomicsMap] = useState<
    Partial<Record<string, VariantEconomics>>
  >(() => bootstrap?.economicsMap ?? {})

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    () => bootstrap?.selectedCategoryIds ?? new Set(),
  )

  const [fieldErrors, setFieldErrors] = useState<UnifiedCatalogProductFormErrors>(() => ({}))
  const [formError, setFormError] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<UnifiedCatalogFormSnapshot | null>(() => {
    if (bootstrap !== undefined) {
      return bootstrap.savedSnapshot
    }
    if (params.mode !== "create") {
      return null
    }
    return captureUnifiedCatalogFormSnapshot({
      title: "",
      description: "",
      isPublished: false,
      optionRows: [],
      economicsMap: {},
      selectedCategoryIds: new Set(),
    })
  })

  const createBootstrapped = useRef(params.mode !== "create")
  const hydratedEconomicsRef = useRef<Partial<Record<string, VariantEconomics>>>(
    bootstrap?.economicsMap ?? {},
  )

  const {
    data: prerequisites,
    error: prerequisitesError,
  } = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-form-prereq"],
    queryFn: async (): Promise<ProductFormPrerequisites> => fetchProductFormPrerequisites(sdk!),
  })

  const {
    data: categoriesPayload,
    error: categoriesError,
  } = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-form-categories"],
    queryFn: async (): Promise<unknown> =>
      sdk!.admin.productCategory.list({
        fields: "+id,+name",
        limit: 200,
        offset: 0,
      }),
  })

  const {
    data: productPayload,
    error: productHydrationError,
    isLoading: isProductQueryLoading,
    isFetching: isProductQueryFetching,
  } = useQuery({
    enabled:
      sdk !== null &&
      params.mode === "edit" &&
      params.productId !== undefined &&
      params.hydratedProduct === undefined,
    queryKey: ["catalog-product-detail-editor", params.productId],
    queryFn: async (): Promise<{ product: AdminProduct }> =>
      sdk!.admin.product.retrieve(params.productId!, { fields: ADMIN_PRODUCT_EDITOR_FIELDS }),
  })

  const categories = useMemo(() => {
    type Payload = {
      product_categories?: Array<{ id?: string; name?: string }>
    }

    const resolved = categoriesPayload as Payload | undefined
    const rows = resolved?.product_categories ?? []

    return rows
      .filter(
        (row): row is { id: string; name: string } =>
          typeof row.id === "string" && typeof row.name === "string",
      )
      .map((row) => ({ id: row.id, label: row.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [categoriesPayload])

  const derivedCombos = useMemo(() => buildVariantRowsFromOptionMatrix(optionRows), [optionRows])
  const hasDefinedOptions = useMemo(() => hasDefinedProductOptions(optionRows), [optionRows])

  const derivedComboKeys = derivedCombos.map((combo) => combo.comboKey).join("\u0000")

  useAdjustStateWhenKeyChanges(derivedComboKeys === "" ? null : derivedComboKeys, () => {
    const keysNext = derivedCombos.map((combo) => combo.comboKey)

    setEconomicsMap((previous) =>
      mergeEconomicsMapForComboKeys(keysNext, previous, hydratedEconomicsRef.current),
    )
  })

  const productEntity = params.hydratedProduct ?? productPayload?.product
  const productEntityKey =
    params.mode === "edit" && productEntity !== undefined
      ? `${productEntity.id}:${productEntity.updated_at ?? ""}`
      : null

  const productHydrationKey =
    params.editBootstrap === undefined ? productEntityKey : null

  const {
    data: stockByVariantId,
  } = useQuery({
    enabled:
      sdk !== null &&
      params.mode === "edit" &&
      params.productId !== undefined &&
      productEntity !== undefined &&
      prerequisites !== undefined &&
      (productEntity.variants?.length ?? 0) > 0,
    queryKey: [
      "catalog-product-editor-stock",
      params.productId,
      productEntity?.updated_at ?? "",
      prerequisites?.primaryStockLocationId ?? "",
    ],
    queryFn: async (): Promise<Map<string, number>> =>
      fetchVariantStockQuantitiesAtLocation({
        sdk: sdk!,
        variants: productEntity!.variants ?? [],
        locationId: prerequisites!.primaryStockLocationId,
      }),
  })

  const stockHydrationKey =
    stockByVariantId !== undefined && productEntityKey !== null
      ? `${productEntityKey}:stock:${[...stockByVariantId.entries()]
          .map(([variantId, quantity]) => `${variantId}=${quantity}`)
          .join("\u0000")}`
      : null

  useAdjustStateWhenKeyChanges(stockHydrationKey, () => {
    if (stockByVariantId === undefined) {
      return
    }

    setEconomicsMap((previous) => {
      const next = applyStockQuantitiesToEconomicsMap(previous, stockByVariantId)
      if (next !== previous) {
        hydratedEconomicsRef.current = next
      }
      return next
    })
  })

  useAdjustStateWhenKeyChanges(productHydrationKey, () => {
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

    setSelectedCategoryIds(() => {
      const categoryIds = new Set<string>()
      if (Array.isArray(productEntity.categories)) {
        for (const category of productEntity.categories) {
          const candidate = category?.id ?? ""
          if (candidate !== "") {
            categoryIds.add(candidate)
          }
        }
      }
      return categoryIds
    })

    if (hydrated.optionRows.length > 0) {
      setOptionRows(hydrated.optionRows)
    } else {
      setOptionRows([])
    }

    const economicsHydrated = economicsMapFromVariantRows(hydrated.variantRows)

    hydratedEconomicsRef.current = economicsHydrated
    setEconomicsMap(economicsHydrated)

    setSavedSnapshot(
      captureUnifiedCatalogFormSnapshot({
        title: productEntity.title?.trim() ?? "",
        description:
          typeof productEntity.description === "string" &&
          productEntity.description.trim() !== ""
            ? productEntity.description
            : "",
        isPublished: productEntity.status === "published",
        optionRows:
          hydrated.optionRows.length > 0
            ? hydrated.optionRows
            : [{ title: "", values: [] }],
        economicsMap: economicsHydrated,
        selectedCategoryIds: (() => {
          const categoryIds = new Set<string>()
          if (Array.isArray(productEntity.categories)) {
            for (const category of productEntity.categories) {
              const candidate = category?.id ?? ""
              if (candidate !== "") {
                categoryIds.add(candidate)
              }
            }
          }
          return categoryIds
        })(),
      }),
    )
  })

  if (params.mode === "create" && !createBootstrapped.current) {
    createBootstrapped.current = true
    setEconomicsMap({})
    setOptionRows([])
  }

  const variantRowsPreview = useMemo((): VariantRowModel[] => {
    if (!hasDefinedOptions) {
      return []
    }

    return derivedCombos.map((combo) => ({
      comboKey: combo.comboKey,
      selections: combo.selections,
      priceDkk: economicsMap[combo.comboKey]?.priceDkk ?? "",
      stock: economicsMap[combo.comboKey]?.stock ?? "",
      medusaVariantId: economicsMap[combo.comboKey]?.medusaVariantId ?? undefined,
    }))
  }, [derivedCombos, economicsMap, hasDefinedOptions])

  const currentSnapshot = useMemo(
    () =>
      captureUnifiedCatalogFormSnapshot({
        title,
        description,
        isPublished,
        optionRows,
        economicsMap,
        selectedCategoryIds,
      }),
    [description, economicsMap, isPublished, optionRows, selectedCategoryIds, title],
  )

  const currentSnapshotRef = useRef(currentSnapshot)
  currentSnapshotRef.current = currentSnapshot

  const isLoadingProductDetail =
    params.mode === "edit" &&
    params.hydratedProduct === undefined &&
    (isProductQueryLoading || isProductQueryFetching)

  const isDirty = useMemo((): boolean => {
    if (savedSnapshot === null || isLoadingProductDetail) {
      return false
    }
    return !unifiedCatalogFormSnapshotsEqual(currentSnapshot, savedSnapshot)
  }, [currentSnapshot, isLoadingProductDetail, savedSnapshot])

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
    mutationFn: async (): Promise<string | undefined> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured for this build.")
      }

      const prerequisitesEntity = prerequisites
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

      const optionsDefined = hasDefinedProductOptions(optionRows)
      const combosToValidate = optionsDefined
        ? derivedCombos
        : buildVariantRowsFromOptionMatrix([])

      if (derivedCombos.length === 0 && optionsDefined) {
        validationErrors.variants = "Add at least one variant row."
      }

      if (!optionsDefined && params.mode === "create") {
        validationErrors.variants =
          "Add product options to configure variant pricing and inventory."
      }

      for (const combo of combosToValidate) {
        if (!optionsDefined && params.mode === "create") {
          continue
        }

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

      const cleanPayload = (optionsDefined ? derivedCombos : combosToValidate).map(
        (combo): PersistVariantEconomics => {
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
            shipping:
              params.shippingContextRef?.current?.resolveShippingForCombo(combo.comboKey) ??
              resolvePersistVariantShipping(undefined),
          }
        },
      )

      const categoryIds = [...selectedCategoryIds.values()]

      const trimmedOptionRows: ProductOptionRowModel[] = []
      for (const rowOption of optionRows) {
        const title = rowOption.title.trim()
        const values: string[] = []
        for (const value of rowOption.values) {
          const trimmed = value.trim()
          if (trimmed !== "") {
            values.push(trimmed)
          }
        }
        if (title !== "" && values.length > 0) {
          trimmedOptionRows.push({
            medusaOptionId: rowOption.medusaOptionId,
            title,
            values,
          })
        }
      }

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
          requiresShipping: params.shippingContextRef?.current?.requiresShipping ?? true,
        })

        await Promise.all([
          queryClient.invalidateQueries({
            predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
          }),
          queryClient.invalidateQueries({ queryKey: ["catalog-product-detail-editor", productId] }),
        ])

        if (typeof params.onSuccessfulCreateNavigate === "function") {
          params.onSuccessfulCreateNavigate(productId)
        }

        return productId
      } else if (typeof params.productId === "string" && params.productId.trim() !== "") {
        await persistUnifiedProductUpdate({
          sdk,
          prerequisites: prerequisitesEntity,
          productId: params.productId,
          title: titleTrimmed,
          description,
          status: isPublished ? "published" : "draft",
          categoryIds,
          optionRows: trimmedOptionRows,
          variants: cleanPayload,
          requiresShipping: params.shippingContextRef?.current?.requiresShipping ?? true,
        })

        await Promise.all([
          queryClient.invalidateQueries({
            predicate: ({ queryKey }) => queryKey[0] === "products-catalog-list",
          }),
          queryClient.invalidateQueries({
            queryKey: ["catalog-product-detail-editor", params.productId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["catalog-product-editor-stock", params.productId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["admin-product-detail", params.productId],
          }),
        ])

        return params.productId
      } else {
        throw new Error("Missing product id for edit flows.")
      }
    },
    onSuccess: () => {
      setSavedSnapshot(currentSnapshotRef.current)
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

  const submit = useCallback(async (): Promise<string | undefined> => {
    return saveMutation.mutateAsync()
  }, [saveMutation])

  return {
    sdkReturned: sdk,
    prerequisites: prerequisites ?? undefined,
    categories,
    prerequisitesError,
    categoriesError,
    hydratedProduct: productEntity ?? undefined,
    productHydrationError,
    isLoadingProductDetail,

    title,
    description,
    isPublished,
    optionRows,
    hasDefinedOptions,
    derivedCombos,
    variantRowsPreview,
    selectedCategoryIds,
    fieldErrors,
    formError,
    isSubmitting: saveMutation.isPending,
    isDirty,

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
