exports.handler = async () => {
  // This endpoint currently exposes a static capability descriptor only.
  // Do not represent unqueried compliance or oracle data as live measurements.
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      layers: [
        "Infrastructure",
        "Protocol",
        "Smart Contract",
        "Service",
        "Interoperability",
        "Application",
        "Governance"
      ],
      compliance: "UNVERIFIED — no signed compliance evidence is connected",
      engagementScore: "UNAVAILABLE — no verified oracle observation is connected",
      metricsStatus: "NO_LIVE_EVIDENCE",
      sourceType: "STATIC_CAPABILITY_DESCRIPTOR",
      measuredAt: null,
      evidence: {
        complianceRecords: 0,
        oracleObservations: 0,
        networkTransactions: 0
      }
    })
  };
};
