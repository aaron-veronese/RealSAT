"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Divide, Minus, Plus, X } from "lucide-react"

export function TestCalculator() {
  const [display, setDisplay] = useState("0")
  const [memory, setMemory] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const clearDisplay = () => {
    setDisplay("0")
    setWaitingForOperand(false)
  }

  const clearAll = () => {
    setDisplay("0")
    setMemory(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".")
    }
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = Number.parseFloat(display)

    if (memory === null) {
      setMemory(inputValue)
    } else if (operation) {
      const result = calculate(memory, inputValue, operation)
      setMemory(result)
      setDisplay(String(result))
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case "+":
        return a + b
      case "-":
        return a - b
      case "×":
        return a * b
      case "÷":
        return a / b
      default:
        return b
    }
  }

  const handleEquals = () => {
    const inputValue = Number.parseFloat(display)

    if (memory === null) {
      return
    }

    if (operation) {
      const result = calculate(memory, inputValue, operation)
      setDisplay(String(result))
      setMemory(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const toggleSign = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(-value))
  }

  const calculatePercentage = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(value / 100))
  }

  const calculateSquareRoot = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(Math.sqrt(value)))
  }

  const calculateSquare = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(value * value))
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="scientific">Scientific</TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/50 text-right">
              <div className="text-2xl font-medium">{display}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={clearAll}>
                AC
              </Button>
              <Button variant="outline" onClick={() => toggleSign()}>
                +/-
              </Button>
              <Button variant="outline" onClick={() => calculatePercentage()}>
                %
              </Button>
              <Button variant="outline" onClick={() => performOperation("÷")}>
                <Divide className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("7")}>
                7
              </Button>
              <Button variant="outline" onClick={() => inputDigit("8")}>
                8
              </Button>
              <Button variant="outline" onClick={() => inputDigit("9")}>
                9
              </Button>
              <Button variant="outline" onClick={() => performOperation("×")}>
                <X className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("4")}>
                4
              </Button>
              <Button variant="outline" onClick={() => inputDigit("5")}>
                5
              </Button>
              <Button variant="outline" onClick={() => inputDigit("6")}>
                6
              </Button>
              <Button variant="outline" onClick={() => performOperation("-")}>
                <Minus className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("1")}>
                1
              </Button>
              <Button variant="outline" onClick={() => inputDigit("2")}>
                2
              </Button>
              <Button variant="outline" onClick={() => inputDigit("3")}>
                3
              </Button>
              <Button variant="outline" onClick={() => performOperation("+")}>
                <Plus className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("0")} className="col-span-2">
                0
              </Button>
              <Button variant="outline" onClick={() => inputDecimal()}>
                .
              </Button>
              <Button variant="default" onClick={() => handleEquals()}>
                =
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scientific" className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/50 text-right">
              <div className="text-2xl font-medium">{display}</div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <Button variant="outline" onClick={clearAll}>
                AC
              </Button>
              <Button variant="outline" onClick={clearDisplay}>
                C
              </Button>
              <Button variant="outline" onClick={() => toggleSign()}>
                +/-
              </Button>
              <Button variant="outline" onClick={() => calculatePercentage()}>
                %
              </Button>
              <Button variant="outline" onClick={() => performOperation("÷")}>
                <Divide className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => calculateSquare()}>
                x²
              </Button>
              <Button variant="outline" onClick={() => inputDigit("7")}>
                7
              </Button>
              <Button variant="outline" onClick={() => inputDigit("8")}>
                8
              </Button>
              <Button variant="outline" onClick={() => inputDigit("9")}>
                9
              </Button>
              <Button variant="outline" onClick={() => performOperation("×")}>
                <X className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => calculateSquareRoot()}>
                √
              </Button>
              <Button variant="outline" onClick={() => inputDigit("4")}>
                4
              </Button>
              <Button variant="outline" onClick={() => inputDigit("5")}>
                5
              </Button>
              <Button variant="outline" onClick={() => inputDigit("6")}>
                6
              </Button>
              <Button variant="outline" onClick={() => performOperation("-")}>
                <Minus className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("π")}>
                π
              </Button>
              <Button variant="outline" onClick={() => inputDigit("1")}>
                1
              </Button>
              <Button variant="outline" onClick={() => inputDigit("2")}>
                2
              </Button>
              <Button variant="outline" onClick={() => inputDigit("3")}>
                3
              </Button>
              <Button variant="outline" onClick={() => performOperation("+")}>
                <Plus className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => inputDigit("e")}>
                e
              </Button>
              <Button variant="outline" onClick={() => inputDigit("0")} className="col-span-2">
                0
              </Button>
              <Button variant="outline" onClick={() => inputDecimal()}>
                .
              </Button>
              <Button variant="default" onClick={() => handleEquals()}>
                =
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
