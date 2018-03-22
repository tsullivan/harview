const { log: har } = require('./har_files/har-as-json');

const summarizeClusterOverview = text => {
  return text;
};

const summarizeNodesListingOverview = ({ clusterStatus, nodes, rows }) => {
  return {
    clusterStatus,
    nodes: Object.keys(nodes),
    rows
  };
};

function getEntriesListing(entries) {
  const workEntries = entries.filter(e => {
    const isMonitoring = e.request.url.match(/\/api\/monitoring\/v1\/clusters/) !== null;
    const notCluster = e.request.url.match(/\/api\/monitoring\/v1\/clusters$/) === null;
    return isMonitoring && notCluster;
  });

  const listing = [];
  for (const { request, response } of workEntries) {
    const text = JSON.parse(response.content.text);
    if (text) {
      const timeRange = JSON.parse(request.postData.text).timeRange;
      const timeRangeSize = (new Date(timeRange.max)).getTime() - (new Date(timeRange.min)).getTime();

      let textSummary;
      if (request.url.match(/\/elasticsearch\/nodes$/) !== null) {
        textSummary = summarizeNodesListingOverview(text);
      } else {
        textSummary = summarizeClusterOverview(text);
      }

      listing.push({
        request: {
          url: request.url,
          timeRange,
          timeRangeSize
        },
        response: {
          status: response.status,
          summary: textSummary
        }
      });
    } else {
      throw new Error('No content text available in entry!');
    }
  }

  return listing;
}

const { entries } = har;
const listing = getEntriesListing(entries);
console.log(JSON.stringify(listing)); // eslint-disable-line no-console
