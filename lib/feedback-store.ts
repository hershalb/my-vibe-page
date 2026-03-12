import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

export interface FeedbackItem {
  id: string;
  message: string;
  name?: string;
  pageId?: string;
  createdAt: string;
}

export interface FeedbackListResult {
  items: FeedbackItem[];
  nextCursor: string | null;
}

const BUCKET = process.env.AWS_S3_BUCKET!;
const s3 = new S3Client({});
const PREFIX = "feedback/";

// Inverted timestamp so lexicographic order = newest first
function feedbackKey(id: string, createdAt: Date): string {
  const inverted = (9999999999999 - createdAt.getTime())
    .toString()
    .padStart(13, "0");
  return `${PREFIX}${inverted}_${id}.json`;
}

export async function saveFeedback(input: {
  message: string;
  name?: string;
  pageId?: string;
}): Promise<FeedbackItem> {
  const id = nanoid(10);
  const now = new Date();
  const item: FeedbackItem = {
    id,
    message: input.message,
    ...(input.name ? { name: input.name } : {}),
    ...(input.pageId ? { pageId: input.pageId } : {}),
    createdAt: now.toISOString(),
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: feedbackKey(id, now),
      Body: JSON.stringify(item, null, 2),
      ContentType: "application/json",
    })
  );

  return item;
}

export async function listFeedback(
  cursor?: string,
  limit = 20
): Promise<FeedbackListResult> {
  const listRes = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      MaxKeys: limit,
      ...(cursor ? { ContinuationToken: cursor } : {}),
    })
  );

  const keys = (listRes.Contents ?? []).map((obj) => obj.Key!);

  const items = await Promise.all(
    keys.map(async (key) => {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key })
      );
      const body = await res.Body?.transformToString("utf-8");
      return body ? (JSON.parse(body) as FeedbackItem) : null;
    })
  );

  return {
    items: items.filter((item): item is FeedbackItem => item !== null),
    nextCursor: listRes.IsTruncated ? (listRes.NextContinuationToken ?? null) : null,
  };
}
