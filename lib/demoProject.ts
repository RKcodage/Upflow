import crypto from "crypto";
import ProjectModel from "@/lib/models/Project";

const DEMO_PROJECT_ID = "demo";
const DEMO_ALLOWED_ORIGINS = ["https://upflow--upflow--574qbjcqcwyr.code.run"];

const generatePublicKey = () => `pk_${crypto.randomBytes(16).toString("hex")}`;

export const ensureDemoProjectForUser = async (userId: string) => {
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
