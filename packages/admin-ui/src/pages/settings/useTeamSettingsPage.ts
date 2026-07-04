import { useCallback, useEffect, useMemo, useReducer } from "react"
import { useUser } from "@clerk/react"

import { useAdminAuthReady } from "@/components/auth/AdminAuthReadyContext"
import { useToast } from "@/components/ui/Toast"
import {
  inviteTeamMember,
  listTeamMembers,
  revokeTeamInvitation,
  revokeTeamMember,
  updateTeamMemberRole,
} from "@/features/team/teamApi"
import type { TeamInvitationDto, TeamMemberDto, TeamMemberRole } from "@/features/team/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type TeamSettingsPhase = "idle" | "loading" | "ready" | "error"

type TeamSettingsState = {
  phase: TeamSettingsPhase
  members: TeamMemberDto[]
  invitations: TeamInvitationDto[]
  errorMessage: string | null
  inviteEmail: string
  inviteRole: TeamMemberRole
  inviteSubmitting: boolean
  inviteError: string | null
  revokeTarget: TeamMemberDto | null
  revokeSubmitting: boolean
  roleTarget: TeamMemberDto | null
  roleSelection: TeamMemberRole
  roleSubmitting: boolean
}

export type TeamSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; members: TeamMemberDto[]; invitations: TeamInvitationDto[] }
  | { type: "loadError"; message: string }
  | { type: "setInviteEmail"; email: string }
  | { type: "setInviteRole"; role: TeamMemberRole }
  | { type: "inviteStart" }
  | { type: "inviteError"; message: string }
  | { type: "inviteSuccess" }
  | { type: "openRevoke"; member: TeamMemberDto }
  | { type: "closeRevoke" }
  | { type: "revokeStart" }
  | { type: "revokeFinish" }
  | { type: "openRoleDialog"; member: TeamMemberDto }
  | { type: "closeRoleDialog" }
  | { type: "setRoleSelection"; role: TeamMemberRole }
  | { type: "roleStart" }
  | { type: "roleFinish" }

const INITIAL_STATE: TeamSettingsState = {
  phase: "idle",
  members: [],
  invitations: [],
  errorMessage: null,
  inviteEmail: "",
  inviteRole: "staff",
  inviteSubmitting: false,
  inviteError: null,
  revokeTarget: null,
  revokeSubmitting: false,
  roleTarget: null,
  roleSelection: "staff",
  roleSubmitting: false,
}

function teamSettingsReducer(
  state: TeamSettingsState,
  action: TeamSettingsAction,
): TeamSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", errorMessage: null }
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        members: action.members,
        invitations: action.invitations,
        errorMessage: null,
      }
    case "loadError":
      return { ...state, phase: "error", errorMessage: action.message }
    case "setInviteEmail":
      return { ...state, inviteEmail: action.email, inviteError: null }
    case "setInviteRole":
      return { ...state, inviteRole: action.role, inviteError: null }
    case "inviteStart":
      return { ...state, inviteSubmitting: true, inviteError: null }
    case "inviteError":
      return { ...state, inviteSubmitting: false, inviteError: action.message }
    case "inviteSuccess":
      return {
        ...state,
        inviteSubmitting: false,
        inviteEmail: "",
        inviteRole: "staff",
        inviteError: null,
      }
    case "openRevoke":
      return { ...state, revokeTarget: action.member }
    case "closeRevoke":
      return { ...state, revokeTarget: null, revokeSubmitting: false }
    case "revokeStart":
      return { ...state, revokeSubmitting: true }
    case "revokeFinish":
      return { ...state, revokeTarget: null, revokeSubmitting: false }
    case "openRoleDialog":
      return {
        ...state,
        roleTarget: action.member,
        roleSelection: action.member.role,
      }
    case "closeRoleDialog":
      return { ...state, roleTarget: null, roleSubmitting: false }
    case "setRoleSelection":
      return { ...state, roleSelection: action.role }
    case "roleStart":
      return { ...state, roleSubmitting: true }
    case "roleFinish":
      return { ...state, roleTarget: null, roleSubmitting: false }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export function useTeamSettingsPage() {
  const [state, dispatch] = useReducer(teamSettingsReducer, INITIAL_STATE)
  const { toast } = useToast()
  const { user } = useUser()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const isAdminAuthReady = useAdminAuthReady()
  const currentUserId = user?.id ?? null

  const reload = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }

    dispatch({ type: "loadStart" })
    try {
      const { members, invitations } = await listTeamMembers()
      dispatch({ type: "loadSuccess", members, invitations })
    } catch (error) {
      dispatch({
        type: "loadError",
        message: error instanceof Error ? error.message : "Failed to load team members",
      })
    }
  }, [hasBackend])

  useEffect(() => {
    if (!isAdminAuthReady) return
    void reload()
  }, [isAdminAuthReady, reload])

  const otherMembers = useMemo(() => {
    if (currentUserId === null) {
      return state.members
    }
    return state.members.filter((member) => member.clerk_user_id !== currentUserId)
  }, [currentUserId, state.members])

  const showEmptyState =
    state.phase === "ready" &&
    otherMembers.length === 0 &&
    state.invitations.length === 0

  const handleInvite = useCallback(async (): Promise<void> => {
    const email = state.inviteEmail.trim()
    if (email === "") {
      dispatch({ type: "inviteError", message: "Email is required" })
      return
    }

    dispatch({ type: "inviteStart" })
    try {
      await inviteTeamMember({ email, role: state.inviteRole })
      dispatch({ type: "inviteSuccess" })
      toast({
        title: "Invitation sent",
        description: `An invite was sent to ${email}. They will receive an email from Clerk to join your store.`,
      })
      await reload()
    } catch (error) {
      dispatch({
        type: "inviteError",
        message: error instanceof Error ? error.message : "Failed to send invitation",
      })
    }
  }, [reload, state.inviteEmail, state.inviteRole, toast])

  const handleConfirmRevoke = useCallback(async (): Promise<void> => {
    if (state.revokeTarget === null) {
      return
    }

    dispatch({ type: "revokeStart" })
    try {
      await revokeTeamMember(state.revokeTarget.clerk_user_id)
      dispatch({ type: "revokeFinish" })
      toast({
        title: "Access revoked",
        description: `${state.revokeTarget.name} was removed from your team.`,
      })
      await reload()
    } catch (error) {
      dispatch({ type: "revokeFinish" })
      toast({
        variant: "error",
        title: "Could not revoke access",
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }, [reload, state.revokeTarget, toast])

  const handleConfirmRoleChange = useCallback(async (): Promise<void> => {
    if (state.roleTarget === null) {
      return
    }

    dispatch({ type: "roleStart" })
    try {
      await updateTeamMemberRole(state.roleTarget.clerk_user_id, {
        role: state.roleSelection,
      })
      dispatch({ type: "roleFinish" })
      toast({
        title: "Role updated",
        description: `${state.roleTarget.name} is now ${state.roleSelection === "admin" ? "an Admin" : "Staff"}.`,
      })
      await reload()
    } catch (error) {
      dispatch({ type: "roleFinish" })
      toast({
        variant: "error",
        title: "Could not update role",
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }, [reload, state.roleSelection, state.roleTarget, toast])

  const handleRevokeInvitation = useCallback(
    async (invitation: TeamInvitationDto): Promise<void> => {
      try {
        await revokeTeamInvitation(invitation.invitation_id)
        toast({
          title: "Invitation revoked",
          description: `The invite to ${invitation.email} was cancelled.`,
        })
        await reload()
      } catch (error) {
        toast({
          variant: "error",
          title: "Could not revoke invitation",
          description: error instanceof Error ? error.message : "Try again.",
        })
      }
    },
    [reload, toast],
  )

  return {
    hasBackend,
    state,
    dispatch,
    reload,
    otherMembers,
    showEmptyState,
    currentUserId,
    handleInvite,
    handleConfirmRevoke,
    handleConfirmRoleChange,
    handleRevokeInvitation,
  }
}
