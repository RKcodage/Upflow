import crypto from "crypto";
import ProjectModel from "@/lib/models/Project";

const DEMO_PROJECT_ID = "demo";
const DEMO_ALLOWED_ORIGINS = [
  "https://upflow--upflow--574qbjcqcwyr.code.run",
  "https://www.upflow.website",
  "https://upflow.website",
];

const generatePublicKey = () => `pk_${crypto.randomBytes(16).toString("hex")}`;

const mergeAllowedOrigins = (current: string[] = []) => {
  const normalized = current.map((entry) => entry.trim()).filter(Boolean);
  const set = new Set(normalized);
  let changed = false;

  for (const origin of DEMO_ALLOWED_ORIGINS) {
    if (!set.has(origin)) {
      set.add(origin);
      changed = true;
    }
  }

  return { changed, origins: Array.from(set) };
};

export const ensureDemoProjectForUser = async (userId: string) => {
  const demoProject = await ProjectModel.findOne({
    ownerId: userId,
    name: { $regex: /^demo$/i },
  });

  if (demoProject) {
    const { changed, origins } = mergeAllowedOrigins(demoProject.allowedOrigins ?? []);
    if (changed) {
      demoProject.allowedOrigins = origins;
      await demoProject.save();
    }
    return demoProject;
  }

  const existing = await ProjectModel.findOne({ ownerId: userId }).lean();
  if (existing) return null;

  const createProject = (projectId: string) =>
    ProjectModel.create({
      projectId,
      ownerId: userId,
      name: "Demo",
      publicKey: generatePublicKey(),
      allowedOrigins: DEMO_ALLOWED_ORIGINS,
    });

  try {
    return await createProject(DEMO_PROJECT_ID);
  } catch (error) {
    const maybeDuplicate = (error as { code?: number }).code === 11000;
    if (!maybeDuplicate) throw error;
  }

  const fallbackId = `demo-${crypto.randomBytes(4).toString("hex")}`;
  return await createProject(fallbackId);
};
