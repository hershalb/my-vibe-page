import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export interface PageMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PageData {
  id: string;
  html: string;
  messages: PageMessage[];
  createdAt: string;
  updatedAt: string;
}

const BUCKET = process.env.AWS_S3_BUCKET!;

const s3 = new S3Client({});

function objectKey(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return `pages/${safe}.json`;
}

export async function savePage(page: PageData): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey(page.id),
      Body: JSON.stringify(page, null, 2),
      ContentType: "application/json",
    })
  );
}

export async function loadPage(id: string): Promise<PageData | null> {
  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: objectKey(id),
      })
    );
    const body = await res.Body?.transformToString("utf-8");
    if (!body) return null;
    return JSON.parse(body) as PageData;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "NoSuchKey"
    ) {
      return null;
    }
    throw err;
  }
}
