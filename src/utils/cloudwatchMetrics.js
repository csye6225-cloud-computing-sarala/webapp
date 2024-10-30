import AWS from "aws-sdk";

// Initialize CloudWatch client
const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Sends a custom metric to AWS CloudWatch.
 * @param {string} metricName - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {string} [unit="Count"] - The unit of the metric (e.g., "Count", "Milliseconds").
 * @param {string} [namespace="csye6225_v3"] - The namespace in CloudWatch where the metric will be sent.
 */
export function sendMetricToCloudWatch(
  metricName,
  value,
  unit = "Count",
  namespace = "csye6225_v3"
) {
  const params = {
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
    Namespace: namespace,
  };

  cloudwatch.putMetricData(params, (err) => {
    if (err) {
      console.error("Error sending metric to CloudWatch:", err);
    } else {
      console.log(
        `Metric sent to CloudWatch: ${metricName} with value ${value} ${unit}`
      );
    }
  });
}
