CREATE TABLE logs (dt DATE, id STRING, ip STRING, host STRING, beacon STRING, ref STRING, ua STRING, ts TIMESTAMP, uid STRING, event STRING, href STRING, sel STRING, data STRING)
PARTITION BY dt AS