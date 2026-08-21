import { request } from "@/utils/request";

const CHUNK_SIZE = 4096;

/**
 * WeChat createUploadTask rejects this machine's IP (127.0.0.1 / 本机局域网 IP).
 * Split the image into tiny JSON requests so it stays on wx.request.
 */
export async function uploadAppFile(filePath: string, folder = "aftersale") {
  if (!filePath) {
    throw new Error("未选择图片");
  }
  const localPath = await compressIfPossible(filePath);
  const file = await readTempFile(localPath);
  const total = Math.max(1, Math.ceil(file.data.length / CHUNK_SIZE));
  const uploadId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let uploaded: { objectKey: string; url: string } | undefined;
  for (let index = 0; index < total; index++) {
    const res = await request<{
      complete?: boolean;
      received?: number;
      file?: { objectKey: string; url: string };
    }>({
      url: "/api/app/file/upload-chunk",
      method: "POST",
      data: {
        uploadId,
        index,
        total,
        folder,
        filename: file.filename,
        contentType: file.contentType,
        chunk: file.data.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
      },
    });
    if (res.data?.complete && res.data.file?.url) {
      uploaded = res.data.file;
    }
  }
  if (!uploaded?.url) {
    throw new Error("上传失败");
  }
  return uploaded;
}

function compressIfPossible(filePath: string) {
  return new Promise<string>((resolve) => {
    const compress = (uni as any).compressImage as
      | ((options: {
          src: string;
          quality: number;
          success: (res: { tempFilePath?: string }) => void;
          fail: () => void;
        }) => void)
      | undefined;
    if (typeof compress !== "function") {
      resolve(filePath);
      return;
    }
    compress({
      src: filePath,
      quality: 70,
      success: (res) => resolve(res.tempFilePath || filePath),
      fail: () => resolve(filePath),
    });
  });
}

function readTempFile(filePath: string) {
  return new Promise<{ data: string; filename: string; contentType: string }>((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: "base64",
      success: (res) => {
        const data = String(res.data || "");
        if (!data) {
          reject(new Error("读取图片失败"));
          return;
        }
        resolve({
          data,
          filename: guessFilename(filePath),
          contentType: guessContentType(filePath),
        });
      },
      fail: (err) => {
        reject(new Error(err?.errMsg || "读取图片失败"));
      },
    });
  });
}

function guessFilename(filePath: string) {
  const name = filePath.split(/[/\\]/).pop() || "image.jpg";
  return /\.[a-z0-9]+$/i.test(name) ? name : `${name}.jpg`;
}

function guessContentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".gif")) {
    return "image/gif";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}
