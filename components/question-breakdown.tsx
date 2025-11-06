"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

export function QuestionBreakdown() {
  const [moduleFilter, setModuleFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Mock question data
  const questions = [
    {
      id: "q1",
      module: 1,
      number: 1,
      text: "Based on the passage, the author's primary purpose is to:",
      type: "multiple-choice",
      category: "Reading Comprehension",
      userAnswer: "B",
      correctAnswer: "B",
      isCorrect: true,
      explanation:
        "The passage primarily explains the evolution of agricultural practices over time, tracing the development from traditional methods to modern techniques.",
    },
    {
      id: "q2",
      module: 1,
      number: 2,
      text: "The author would most likely agree with which of the following statements?",
      type: "multiple-choice",
      category: "Reading Comprehension",
      userAnswer: "C",
      correctAnswer: "C",
      isCorrect: true,
      explanation:
        "Throughout the passage, the author emphasizes that combining traditional wisdom with modern scientific approaches offers the most effective agricultural strategy.",
    },
    {
      id: "q3",
      module: 1,
      number: 3,
      text: "In the context of the passage, the word 'resilient' most nearly means:",
      type: "multiple-choice",
      category: "Vocabulary",
      userAnswer: "A",
      correctAnswer: "B",
      isCorrect: false,
      explanation:
        "In the context of the passage, 'resilient' refers to the ability to adapt to changing conditions, not fragility.",
    },
    {
      id: "q4",
      module: 2,
      number: 1,
      text: "Which choice most effectively combines the underlined sentences?",
      type: "multiple-choice",
      category: "Grammar",
      userAnswer: "D",
      correctAnswer: "D",
      isCorrect: true,
      explanation: "Option D combines the sentences while maintaining clarity and proper grammatical structure.",
    },
    {
      id: "q5",
      module: 2,
      number: 2,
      text: "The writer is considering deleting the underlined sentence. Should the sentence be kept or deleted?",
      type: "multiple-choice",
      category: "Grammar",
      userAnswer: "A",
      correctAnswer: "B",
      isCorrect: false,
      explanation:
        "The sentence should be deleted as it introduces information that is not relevant to the main argument of the paragraph.",
    },
    {
      id: "q6",
      module: 3,
      number: 1,
      text: "Which of the following is equivalent to (3x - 2)(x + 4)?",
      type: "multiple-choice",
      category: "Algebra",
      userAnswer: "A",
      correctAnswer: "A",
      isCorrect: true,
      explanation: "(3x - 2)(x + 4) = 3x² + 12x - 2x - 8 = 3x² + 10x - 8",
    },
    {
      id: "q7",
      module: 3,
      number: 2,
      text: "If f(x) = 3x² - 4x + 2, what is the value of f(2)?",
      type: "free-response",
      category: "Functions",
      userAnswer: "6",
      correctAnswer: "6",
      isCorrect: true,
      explanation: "f(2) = 3(2)² - 4(2) + 2 = 3(4) - 8 + 2 = 12 - 8 + 2 = 6",
    },
    {
      id: "q8",
      module: 4,
      number: 1,
      text: "In the xy-plane, what is the y-coordinate of the point where the line with equation 2x + 3y = 12 intersects the y-axis?",
      type: "free-response",
      category: "Geometry",
      userAnswer: "4",
      correctAnswer: "4",
      isCorrect: true,
      explanation:
        "When a line intersects the y-axis, the x-coordinate is 0. Substituting x = 0 into 2x + 3y = 12 gives 3y = 12, so y = 4.",
    },
    {
      id: "q9",
      module: 4,
      number: 2,
      text: "If sin(θ) = 0.6, what is the value of cos(θ)?",
      type: "free-response",
      category: "Trigonometry",
      userAnswer: "0.8",
      correctAnswer: "0.8",
      isCorrect: true,
      explanation:
        "Using the Pythagorean identity sin²(θ) + cos²(θ) = 1, we get cos²(θ) = 1 - sin²(θ) = 1 - 0.6² = 1 - 0.36 = 0.64. Since θ is in the first quadrant, cos(θ) = √0.64 = 0.8.",
    },
    {
      id: "q10",
      module: 4,
      number: 3,
      text: "The mean of a data set is 15 and the standard deviation is 3. If each value in the data set is multiplied by 2, what is the new standard deviation?",
      type: "free-response",
      category: "Statistics",
      userAnswer: "5",
      correctAnswer: "6",
      isCorrect: false,
      explanation:
        "When each value is multiplied by a constant k, the standard deviation is multiplied by |k|. So the new standard deviation is 3 × 2 = 6.",
    },
  ]

  // Filter questions based on module and category
  const filteredQuestions = questions.filter((q) => {
    if (moduleFilter !== "all" && q.module !== Number.parseInt(moduleFilter)) return false
    if (categoryFilter !== "all" && q.category !== categoryFilter) return false
    return true
  })

  // Get unique categories for filter
  const categories = ["all", ...new Set(questions.map((q) => q.category))]

  // Count correct and incorrect answers
  const correctCount = filteredQuestions.filter((q) => q.isCorrect).length
  const incorrectCount = filteredQuestions.filter((q) => !q.isCorrect).length
  const accuracy = filteredQuestions.length > 0 ? Math.round((correctCount / filteredQuestions.length) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Module</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="all">All Modules</option>
                <option value="1">Module 1: Reading & Writing</option>
                <option value="2">Module 2: Reading & Writing</option>
                <option value="3">Module 3: Mathematics</option>
                <option value="4">Module 4: Mathematics</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Category</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories
                  .filter((c) => c !== "all")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="correct">Correct</TabsTrigger>
              <TabsTrigger value="incorrect">Incorrect</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-4 rounded-md border ${
                      question.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant="outline">Module {question.module}</Badge>
                        <Badge variant="outline">{question.category}</Badge>
                        {question.isCorrect ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Question {question.number}</span>
                    </div>
                    <p className="text-sm mb-2">{question.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Your Answer</div>
                        <div className={`text-sm p-2 rounded-md ${question.isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                          {question.userAnswer}
                        </div>
                      </div>
                      {!question.isCorrect && (
                        <div>
                          <div className="text-sm font-medium mb-1">Correct Answer</div>
                          <div className="text-sm p-2 rounded-md bg-green-100">{question.correctAnswer}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-1">Explanation</div>
                      <div className="text-sm p-2 rounded-md bg-muted">{question.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="correct">
              <div className="space-y-4">
                {filteredQuestions
                  .filter((q) => q.isCorrect)
                  .map((question) => (
                    <div key={question.id} className="p-4 rounded-md border border-green-200 bg-green-50">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium flex items-center gap-2">
                          <Badge variant="outline">Module {question.module}</Badge>
                          <Badge variant="outline">{question.category}</Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correct
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">Question {question.number}</span>
                      </div>
                      <p className="text-sm mb-2">{question.text}</p>
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-1">Your Answer</div>
                        <div className="text-sm p-2 rounded-md bg-green-100">{question.userAnswer}</div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-1">Explanation</div>
                        <div className="text-sm p-2 rounded-md bg-muted">{question.explanation}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="incorrect">
              <div className="space-y-4">
                {filteredQuestions
                  .filter((q) => !q.isCorrect)
                  .map((question) => (
                    <div key={question.id} className="p-4 rounded-md border border-red-200 bg-red-50">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium flex items-center gap-2">
                          <Badge variant="outline">Module {question.module}</Badge>
                          <Badge variant="outline">{question.category}</Badge>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">Question {question.number}</span>
                      </div>
                      <p className="text-sm mb-2">{question.text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Your Answer</div>
                          <div className="text-sm p-2 rounded-md bg-red-100">{question.userAnswer}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Correct Answer</div>
                          <div className="text-sm p-2 rounded-md bg-green-100">{question.correctAnswer}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-1">Explanation</div>
                        <div className="text-sm p-2 rounded-md bg-muted">{question.explanation}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
