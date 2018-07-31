const BigQuery = require('@google-cloud/bigquery')();
const logSchema = require('./schema.json');

/**
 * Background Cloud Function to ingest logs
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.ingestLogs = (data, context) => {
  const file = data;
  if (!file.name.match(/_usage_/)) return true;
  const datasetName = file.bucket.replace('-logs', '');
  return BigQuery.dataset(datasetName)
    .query({
      query: `
    CREATE TEMP FUNCTION URLDECODE(url STRING) AS ((
      SELECT STRING_AGG(
        IF(REGEXP_CONTAINS(y, r'^%[0-9a-fA-F]{2}'), 
          SAFE_CONVERT_BYTES_TO_STRING(FROM_HEX(REPLACE(y, '%', ''))), y), '' 
        ORDER BY i
        )
      FROM UNNEST(REGEXP_EXTRACT_ALL(url, r"%[0-9a-fA-F]{2}(?:%[0-9a-fA-F]{2})*|[^%]+")) y
      WITH OFFSET AS i 
    ));
    SELECT
      DATE(TIMESTAMP_MICROS(CAST(time_micros AS INT64))) dt,
      s_request_id id, c_ip ip, cs_host host, cs_object beacon, cs_referer ref, cs_user_agent ua,
      TIMESTAMP_MILLIS(CAST(JSON_EXTRACT_SCALAR(data, "$.t") AS INT64)) ts,
      JSON_EXTRACT_SCALAR(data, "$.u") uid, JSON_EXTRACT_SCALAR(data, "$.e") event,
      JSON_EXTRACT_SCALAR(data, "$.l") href, JSON_EXTRACT_SCALAR(data, "$.s") sel,
      data
      FROM (
        SELECT *, URLDECODE(SUBSTR(cs_uri, STRPOS(cs_uri, "?")+1)) data FROM logsbucket
        WHERE cs_method="GET" AND sc_status=200 AND ENDS_WITH(cs_object, ".gif")
      );
    `,
      tableDefinitions: {
        logsbucket: {
          sourceFormat: 'CSV',
          csvOptions: {
            skipLeadingRows: 1
          },
          sourceUris: [`gs://${file.bucket}/${file.name}`],
          schema: {
            fields: logSchema
          }
        }
      },
      destinationTable: {
        datasetId: datasetName,
        tableId: 'logs'
      },
      createDisposition: 'CREATE_IF_NEEDED',
      writeDisposition: 'WRITE_APPEND',
      timePartitioning: {
        type: 'DAY',
        field: 'dt'
      },
      useLegacySql: false
    })
    .then(res => {
      console.log('Ingested', file.name);
    })
    .catch(err => {
      console.error('Error:', err);
    });
};
