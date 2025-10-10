import type { User, Leave, Team } from '../types'

export function normalizeId<T extends { id?: string; _id?: string }>(entity: T): T & { id: string } {
  const id = (entity.id || entity._id) as string
  return { ...entity, id }
}

export function normalizeUser(user: User): User {
  return normalizeId(user)
}

export function normalizeLeave(leave: Leave): Leave {
  return normalizeId(leave)
}

export function normalizeTeam(team: Team): Team {
  return normalizeId(team)
}


