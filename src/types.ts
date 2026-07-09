
export type DocType = 'SRS' | 'FRS' | 'TestPlan' | 'TestCases' | 'Environment' | 'History' | 'Automation';

export interface DocumentState {
  id: string;
  type: DocType;
  title: string;
  content: string;
  projectName: string;
  createdAt: number;
}

export interface GenerationConfig {
  type: DocType;
  projectName: string;
  description: string;
  additionalDetails?: string;
  referenceUrl?: string;
  image?: { data: string; mimeType: string };
}
