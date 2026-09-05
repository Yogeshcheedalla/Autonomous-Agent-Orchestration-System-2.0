export interface DocumentAnalysisResult {
  filename: string;
  rowCount?: number;
  columns?: string[];
  summary: string;
  insights: string[];
  sampleData?: any[];
}

export class DocumentAnalysisCapability {
  async analyzeDocument(filename: string, content: string): Promise<DocumentAnalysisResult> {
    const lines = content.trim().split('\n');
    const isCsv = filename.endsWith('.csv') || content.includes(',');

    if (isCsv && lines.length > 0) {
      const columns = lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const rowCount = lines.length - 1;
      return {
        filename,
        rowCount,
        columns,
        summary: `CSV dataset containing ${rowCount} rows across ${columns.length} columns: [${columns.slice(0, 5).join(', ')}]`,
        insights: [
          `Detected ${columns.length} structured attributes.`,
          `Ready for SQL querying or chart generation.`
        ]
      };
    }

    return {
      filename,
      summary: `Document analysis completed for ${filename} (${content.length} characters, ${lines.length} lines).`,
      insights: [
        `Extracted structured text content successfully.`
      ]
    };
  }
}

export const documentAnalysisCapability = new DocumentAnalysisCapability();
