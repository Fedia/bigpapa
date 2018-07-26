const BigQuery = require("@google-cloud/bigquery")();
const logSchema = require("./schema.json");

/**
 * Background Cloud Function to ingest logs
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.ingestLogs = (data, context) => {
  const file = data;
  if (!file.name.match(/_usage_/)) return;
  const datasetName = file.bucket.replace(/[^\w\d_]/g, "_");
  BigQuery.dataset(datasetName)
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
    INSERT INTO ${datasetName}.logs (hit_ts, id, ip, host, beacon, ref, ua, ts, uid, event, href, sel, data) SELECT
      TIMESTAMP_MICROS(time_micros),
      s_request_id, c_ip, cs_host, cs_object, cs_referer, cs_user_agent,
      TIMESTAMP_MILLIS(JSON_EXTRACT_SCALAR(data, "$.t")),
      JSON_EXTRACT_SCALAR(data, "$.u"), JSON_EXTRACT_SCALAR(data, "$.e"),
      JSON_EXTRACT_SCALAR(data, "$.l"), JSON_EXTRACT_SCALAR(data, "$.s"), data
      FROM (
        SELECT *, URLDECODE(SUBSTR(cs_uri, STRPOS(cs_uri, "?")+1)) data FROM logsbucket
        WHERE cs_method="GET" AND sc_status=200 AND ENDS_WITH(cs_object, ".gif")
      );
    `,
      tableDefinitions: {
        logsbucket: {
          sourceFormat: "CSV",
          csvOptions: {
            skipLeadingRows: 1
          },
          sourceUris: [`gs://${file.bucket}/${file.name}`],
          schema: {
            fields: logSchema
          }
        }
      },
      timePartitioning: {
        type: "DAY",
        field: "hit_ts"
      },
      useLegacySql: false
    })
    .then(res => {
      console.log("Ingested", file.name);
    })
    .catch(err => {
      console.error("Error:", err);
    });
};
