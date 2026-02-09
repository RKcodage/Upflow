import ProjectModel from "@/lib/models/Project";

const normalizeOrigin = (origin: string) => {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
};

const isSameOrigin = (
  apiOrigin: string | null,
  requestOrigin: string | null,
  requestReferer: string | null
) => {
  if (!apiOrigin) return false;
  const normalizedApi = normalizeOrigin(apiOrigin);
  if (!normalizedApi) return false;

  const normalizedRequestOrigin = requestOrigin ? normalizeOrigin(requestOrigin) : null;
  if (normalizedRequestOrigin && normalizedRequestOrigin === normalizedApi) return true;

  if (requestReferer) {
    const refererOrigin = normalizeOrigin(requestReferer);
    if (refererOrigin && refererOrigin === normalizedApi) return true;
  }

  return false;
};

const isOriginAllowed = (siteOrigin: string | null, allowedOrigins: string[]) => {
  if (!siteOrigin) return false;
  const normalized = normalizeOrigin(siteOrigin);
  if (!normalized) return false;
  const host = new URL(normalized).host;

  return allowedOrigins.some((entry) => {
    const trimmed = entry.trim();
    if (!trimmed) return false;
    if (trimmed.includes("://")) {
      return normalizeOrigin(trimmed) === normalized;
    }
    return trimmed === host;
  });
};

type AccessContext = {
  isAdmin?: boolean;
  userId?: string | null;
  requestOrigin?: string | null;
  requestReferer?: string | null;
  apiOrigin?: string | null;
};

export async function verifyProjectAccess(
  projectId: string,
  projectKey: string | null,
  siteOrigin: string | null,
  context?: AccessContext
) {
  const project = await ProjectModel.findOne({ projectId }).lean();
  if (!project) {
    return { ok: false, status: 404, message: "Project not found." };
  }

  if (context?.isAdmin && isSameOrigin(context.apiOrigin ?? null, context.requestOrigin ?? null, context.requestReferer ?? null)) {
    if (context.userId && project.ownerId && project.ownerId !== context.userId) {
      return { ok: false, status: 403, message: "Project access denied." };
    }
    return { ok: true as const, project };
  }

  if (projectKey && project.publicKey === projectKey) {
    return { ok: true as const, project };
  }

  if (isOriginAllowed(siteOrigin, project.allowedOrigins ?? [])) {
    return { ok: true as const, project };
  }

  if (!projectKey && !siteOrigin) {
    return { ok: false, status: 401, message: "Missing projectKey or siteOrigin." };
  }

  return { ok: false, status: 403, message: "Project access denied." };
}
