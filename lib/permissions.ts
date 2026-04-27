import type { Role } from "@prisma/client";

const roleOrder: Role[] = ["USER", "ORGANIZER", "MODERATOR", "ADMIN"];

export function hasMinimumRole(role: Role, minimum: Role) {
  return roleOrder.indexOf(role) >= roleOrder.indexOf(minimum);
}

export function canReviewEvents(role: Role) {
  return role === "MODERATOR" || role === "ADMIN";
}

export function canManageAllEvents(role: Role) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function canAccessOwnedTicket(input: {
  role: Role;
  ticketOwnerId: string;
  viewerId: string;
}) {
  return input.role === "ADMIN" || input.viewerId === input.ticketOwnerId;
}
