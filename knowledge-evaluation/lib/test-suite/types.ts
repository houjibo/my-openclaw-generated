export type QuestionType = 
  | 'fact' 
  | 'concept' 
  | 'application' 
  | 'comparison' 
  | 'synthesis';

export interface Question {
  id?: string;
  type: QuestionType;
  question: string;
  expectedAnswer: string;
  referenceSections: ReferenceSection[];
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
  metadata?: {
    generatedAt: string;
    model?: string;
    temperature?: number;
    [key: string]: any;
  };
}

export interface ReferenceSection {
  content: string;
  position: number;
  context?: string;
}

export interface TestSuite {
  id?: string;
  documentId: string;
  name: string;
  description?: string;
  version: number;
  generatedBy: 'auto' | 'manual';
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateOptions {
  questionTypes?: QuestionType[];
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  temperature?: number;
  model?: string;
}

export interface GenerationResult {
  success: boolean;
  questions: Question[];
  error?: string;
  metadata: {
    totalGenerated: number;
    generationTimeMs: number;
    model: string;
  };
}

export interface LLMResponse {
  questions: Array<{
    type: QuestionType;
    question: string;
    expectedAnswer: string;
    referenceSection: string;
    difficulty: 'easy' | 'medium' | 'hard';
    keywords: string[];
  }>;
}
