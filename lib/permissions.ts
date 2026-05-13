import type { Role } from "@prisma/client";

const roleOrder: Role[] = ["USER", "ORGANIZER", "ADMIN"];

export function hasMinimumRole(role: Role, minimum: Role) {
  return roleOrder.indexOf(role) >= roleOrder.indexOf(minimum);
}

export function canReviewEvents(role: Role) {
  return role === "ADMIN";
}

export function canManageAllEvents(role: Role) {
  return role === "ADMIN";
}

export function canAccessOwnedTicket(input: {
  role: Role;
  ticketOwnerId: number;
  viewerId: number;
}) {
  return input.role === "ADMIN" || input.viewerId === input.ticketOwnerId;
}
