# Example: CORS Configuration

Your S3 bucket must be configured to accept cross-origin upload requests from the browser. Without this, direct uploads will fail.

## Required CORS policy

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

> `ETag` must be exposed — it is required for multipart uploads to complete successfully.

## Where to configure

- **AWS S3**: S3 Console → Bucket → Permissions → Cross-origin resource sharing (CORS)
- **Cloudflare R2**: R2 Dashboard → Bucket → Settings → CORS Policy
- **MinIO**: `mc cors set` command or the MinIO Console

## Notes

- Add all domains where your app is served to `AllowedOrigins`
- `AllowedMethods` must include `PUT` (used for pre-signed URL uploads) and `DELETE` (for multipart abort)
- `AllowedHeaders: ["*"]` is the safest default; tighten if needed

> See the [official AWS CORS docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html) for more detail.
