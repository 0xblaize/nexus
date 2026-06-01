function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function GET() {
  const spec = `openapi: 3.0.0
info:
  title: NEXUS M&A Intelligence API
  version: 1.0.0
  description: Autonomous M&A signal detection and scoring
servers:
  - url: ${appUrl()}
paths:
  /api/analyze:
    post:
      operationId: analyzeCompany
      summary: Run M&A signal analysis on a company
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - company
              properties:
                company:
                  type: string
                threshold:
                  type: integer
                  default: 65
      responses:
        "200":
          description: Analysis result with probability score and memo
  /reports:
    get:
      operationId: getRecentReports
      summary: Get recent NEXUS reports
      responses:
        "200":
          description: List of reports
`;

  return new Response(spec, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
    },
  });
}
