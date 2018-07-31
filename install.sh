#!/bin/bash
BUCKET=$0

set -e

# try to create BigQuery dataset and GCS bucket first
bq mk --dataset=$BUCKET
gsutil mb gs://${BUCKET}

# OK? then carry on
gsutil defacl set public-read gs://${BUCKET}
gsutil -h "Cache-Control:no-cache" cp beacon/*.gif gs://${BUCKET}

cd tag
echo "bucket=$BUCKET" > .env
npm install
npm run build
gsutil -h "Cache-Control:public,max-age=3600" cp -Z dist/*.js gs://${BUCKET}

gsutil mb gs://${BUCKET}-logs
gsutil acl ch -g cloud-storage-analytics@google.com:W gs://${BUCKET}-logs
gsutil logging set on -b gs://${BUCKET}-logs gs://${BUCKET}

cd ../ingest
bq mk --table --schema table-schema.json --time_partitioning_field dt ${BUCKET}.logs
gcloud beta functions deploy ingestLogs --runtime nodejs8 --trigger-resource gs://${BUCKET}-logs --trigger-event google.storage.object.finalize

echo "Done!"
