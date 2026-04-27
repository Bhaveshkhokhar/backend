const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!region || !bucketName) {
  throw new Error(
    "AWS_REGION and AWS_S3_BUCKET_NAME must be configured in .env",
  );
}

const s3Client = new S3Client({ region });

async function uploadFileToS3({ buffer, key, contentType }) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(params));

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function generateS3Key(entity, id, originalFilename) {
  const extension = originalFilename.split(".").pop();
  return `${entity}/${id}.${extension}`;
}

module.exports = {
  uploadFileToS3,
  generateS3Key,
};
