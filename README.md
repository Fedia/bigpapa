# BigPapa

BigPapa glues Google Cloud Storage with BigQuery to provide an alternative to Google Analytics.

## Some Benefits
- Tracks most user interactions from day 1 like [Heap](https://heapanalytics.com)
- Ad-blocking is less of an issue than for popular scripts (GA, Tag Manager)
- No sampling and no event limits
- Custom analytics with BigQuery + DataStudio for reporting
- Serverless and scaleable cloud solution, but *you own* the data

## Installation
1. Create a billable project in [Google Cloud Console](https://console.cloud.google.com)
2. Open [Cloud Shell](https://cloud.google.com/shell/docs/quickstart) for this project
3. Type:
```
git clone https://github.com/fedia/bigpapa.git
cd bigpapa
sh install.sh mytracker123
```
4. Put this tracking code on any website:
```
<script src="https://storage.googleapis.com/mytracker123/b.js" async></script>
```
5. Enjoy hourly updates of `mytracker123.logs` [table](https://console.cloud.google.com/bigquery) which can be aggregated and visualized with [DataStudio](https://datastudio.google.com/)
