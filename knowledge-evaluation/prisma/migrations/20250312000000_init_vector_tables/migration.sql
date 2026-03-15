-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT,
    "filePath" TEXT,
    "rawContent" TEXT,
    "structuredContent" JSONB,
    "metadata" JSONB,
    "parseStatus" TEXT NOT NULL DEFAULT 'pending',
    "parseError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "structuredContent" JSONB,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "optimizationPlan" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "intrinsicScore" DECIMAL(5,2) NOT NULL,
    "structuralScore" DECIMAL(5,2) NOT NULL,
    "consumptionScore" DECIMAL(5,2) NOT NULL,
    "metrics" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationTimeMs" INTEGER,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationSuggestion" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentValue" JSONB,
    "suggestedValue" JSONB,
    "autoApplicable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "appliedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSuite" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSuite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "testSuiteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "referenceSections" JSONB,
    "difficulty" TEXT,
    "keywords" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorizedDocument" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT,
    "version" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "embeddingDimension" INTEGER NOT NULL,
    "chunkingStrategy" JSONB,
    "totalChunks" INTEGER NOT NULL,
    "totalTokens" INTEGER,
    "vectorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorizedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorChunk" (
    "id" TEXT NOT NULL,
    "vectorizedDocumentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "position" INTEGER NOT NULL,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationRun" (
    "id" TEXT NOT NULL,
    "testSuiteId" TEXT NOT NULL,
    "vectorizedDocumentId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "passedQuestions" INTEGER NOT NULL,
    "passRate" DECIMAL(5,4) NOT NULL,
    "avgRelevanceScore" DECIMAL(5,4) NOT NULL,
    "metrics" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionTimeMs" INTEGER,

    CONSTRAINT "EvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "evaluationRunId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "retrieved" BOOLEAN NOT NULL,
    "retrievedChunks" JSONB,
    "relevanceScore" DECIMAL(5,4) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionComparison" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "targetVersionId" TEXT NOT NULL,
    "intrinsicDiff" JSONB NOT NULL,
    "structuralDiff" JSONB NOT NULL,
    "consumptionDiff" JSONB NOT NULL,
    "overallScoreDiff" DECIMAL(5,2) NOT NULL,
    "improvements" JSONB NOT NULL,
    "regressions" JSONB NOT NULL,
    "unchanged" JSONB NOT NULL,
    "comparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationComparison" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "baseEvaluationRunId" TEXT NOT NULL,
    "comparisonEvaluationRunId" TEXT NOT NULL,
    "accuracyDiff" DECIMAL(5,4) NOT NULL,
    "recallDiff" DECIMAL(5,4) NOT NULL,
    "f1ScoreDiff" DECIMAL(5,4) NOT NULL,
    "passRateDiff" DECIMAL(5,4) NOT NULL,
    "detailedMetrics" JSONB NOT NULL,
    "comparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationComparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_fileType_idx" ON "Document"("fileType");

-- CreateIndex
CREATE INDEX "Document_parseStatus_idx" ON "Document"("parseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "Evaluation_documentId_idx" ON "Evaluation"("documentId");

-- CreateIndex
CREATE INDEX "Evaluation_overallScore_idx" ON "Evaluation"("overallScore");

-- CreateIndex
CREATE INDEX "OptimizationSuggestion_evaluationId_idx" ON "OptimizationSuggestion"("evaluationId");

-- CreateIndex
CREATE INDEX "OptimizationSuggestion_category_idx" ON "OptimizationSuggestion"("category");

-- CreateIndex
CREATE INDEX "OptimizationSuggestion_severity_idx" ON "OptimizationSuggestion"("severity");

-- CreateIndex
CREATE INDEX "OptimizationSuggestion_applied_idx" ON "OptimizationSuggestion"("applied");

-- CreateIndex
CREATE INDEX "TestSuite_documentId_idx" ON "TestSuite"("documentId");

-- CreateIndex
CREATE INDEX "TestQuestion_testSuiteId_idx" ON "TestQuestion"("testSuiteId");

-- CreateIndex
CREATE INDEX "VectorizedDocument_documentId_idx" ON "VectorizedDocument"("documentId");

-- CreateIndex
CREATE INDEX "VectorizedDocument_documentVersionId_idx" ON "VectorizedDocument"("documentVersionId");

-- CreateIndex
CREATE INDEX "VectorChunk_vectorizedDocumentId_idx" ON "VectorChunk"("vectorizedDocumentId");

-- CreateIndex
CREATE INDEX "EvaluationRun_testSuiteId_idx" ON "EvaluationRun"("testSuiteId");

-- CreateIndex
CREATE INDEX "EvaluationRun_vectorizedDocumentId_idx" ON "EvaluationRun"("vectorizedDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "TestResult_evaluationRunId_questionId_key" ON "TestResult"("evaluationRunId", "questionId");

-- CreateIndex
CREATE INDEX "TestResult_evaluationRunId_idx" ON "TestResult"("evaluationRunId");

-- CreateIndex
CREATE INDEX "TestResult_questionId_idx" ON "TestResult"("questionId");

-- CreateIndex
CREATE INDEX "VersionComparison_documentId_idx" ON "VersionComparison"("documentId");

-- CreateIndex
CREATE INDEX "VersionComparison_sourceVersionId_idx" ON "VersionComparison"("sourceVersionId");

-- CreateIndex
CREATE INDEX "VersionComparison_targetVersionId_idx" ON "VersionComparison"("targetVersionId");

-- CreateIndex
CREATE INDEX "EvaluationComparison_documentId_idx" ON "EvaluationComparison"("documentId");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationSuggestion" ADD CONSTRAINT "OptimizationSuggestion_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSuite" ADD CONSTRAINT "TestSuite_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_testSuiteId_fkey" FOREIGN KEY ("testSuiteId") REFERENCES "TestSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorizedDocument" ADD CONSTRAINT "VectorizedDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorizedDocument" ADD CONSTRAINT "VectorizedDocument_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorChunk" ADD CONSTRAINT "VectorChunk_vectorizedDocumentId_fkey" FOREIGN KEY ("vectorizedDocumentId") REFERENCES "VectorizedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRun" ADD CONSTRAINT "EvaluationRun_testSuiteId_fkey" FOREIGN KEY ("testSuiteId") REFERENCES "TestSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRun" ADD CONSTRAINT "EvaluationRun_vectorizedDocumentId_fkey" FOREIGN KEY ("vectorizedDocumentId") REFERENCES "VectorizedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "EvaluationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
