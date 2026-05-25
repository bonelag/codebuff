/**
 * Accordion-style question component that can expand/collapse
 */

import React, { useCallback, useRef, useEffect } from 'react'
import type { ScrollBoxRenderable } from '@opentui/core'

import { CustomAnswerInput } from './custom-answer-input'
import { OptionsList } from './options-list'
import { QuestionHeader } from './question-header'
import { getOptionLabel } from '../constants'

import type { AskUserQuestion } from '../../../types/store'

/** Answer state for a single question */
export interface AccordionAnswer {
  selectedIndex?: number
  selectedIndices?: Set<number>
  isCustom?: boolean
  customText?: string
}

export interface AccordionQuestionProps {
  question: AskUserQuestion
  questionIndex: number
  totalQuestions: number
  answer: AccordionAnswer | undefined
  isExpanded: boolean
  isTypingCustom: boolean
  onToggleExpand: () => void
  onSelectOption: (optionIndex: number) => void
  onToggleOption: (optionIndex: number) => void
  onSetCustomText: (text: string, cursorPosition: number) => void
  onCustomSubmit: () => void
  customCursorPosition: number
  focusedOptionIndex: number | null
  onFocusOption: (index: number | null) => void
}

export const AccordionQuestion: React.FC<AccordionQuestionProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
  isExpanded,
  isTypingCustom,
  onToggleExpand,
  onSelectOption,
  onToggleOption,
  onSetCustomText,
  onCustomSubmit,
  customCursorPosition,
  focusedOptionIndex,
  onFocusOption,
}) => {
  const isMultiSelect = question.multiSelect
  const showQuestionNumber = totalQuestions > 1
  const questionNumber = questionIndex + 1
  const questionPrefix = showQuestionNumber ? `${questionNumber}. ` : ''
  const optionIndent = 2 + questionPrefix.length

  // Check if question has a valid answer
  const isAnswered =
    !!answer &&
    ((answer.isCustom && !!answer.customText?.trim()) ||
      (isMultiSelect && (answer.selectedIndices?.size ?? 0) > 0) ||
      answer.selectedIndex !== undefined)

  const getAnswerDisplay = (): string => {
    if (!answer) return '(click to answer)'

    if (answer.isCustom && answer.customText) {
      const hadNewlines = /\r?\n/.test(answer.customText)
      const flattenedText = answer.customText
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return `Custom: ${flattenedText}${hadNewlines ? '…' : ''}`
    }

    if (isMultiSelect && answer.selectedIndices) {
      const selectedLabels = Array.from(answer.selectedIndices)
        .map((idx) => getOptionLabel(question.options[idx]))
        .filter(Boolean)
      return selectedLabels.length > 0
        ? selectedLabels.join(', ')
        : '(click to answer)'
    }

    if (answer.selectedIndex !== undefined) {
      const label = getOptionLabel(question.options[answer.selectedIndex])
      return label || '(click to answer)'
    }

    return '(click to answer)'
  }

  const isCustomSelected = answer?.isCustom ?? false

  const handlePaste = useCallback(
    (text: string) => {
      const currentText = answer?.customText || ''
      const newText =
        currentText.slice(0, customCursorPosition) +
        text +
        currentText.slice(customCursorPosition)
      onSetCustomText(newText, customCursorPosition + text.length)
    },
    [answer?.customText, customCursorPosition, onSetCustomText],
  )

  const scrollRef = useRef<ScrollBoxRenderable | null>(null)

  useEffect(() => {
    if (focusedOptionIndex !== null && scrollRef.current) {
      const scrollbox = scrollRef.current
      const itemHeight = 1
      const offset = question.multiSelect ? 1 : 0
      const focusedTop = (focusedOptionIndex + offset) * itemHeight
      const focusedBottom = focusedTop + itemHeight
      
      const viewportHeight = scrollbox.viewport.height
      const currentScroll = scrollbox.scrollTop

      if (focusedTop < currentScroll) {
        scrollbox.scrollTop = Math.max(0, focusedTop)
      } else if (focusedBottom > currentScroll + viewportHeight) {
        scrollbox.scrollTop = focusedBottom - viewportHeight
      }
    }
  }, [focusedOptionIndex, question.multiSelect])

  return (
    <box style={{ flexDirection: 'column', marginBottom: 1, width: '100%' }}>
      {/* Question header - always visible */}
      <QuestionHeader
        questionText={question.question}
        questionPrefix={questionPrefix}
        isExpanded={isExpanded}
        isAnswered={isAnswered}
        answerDisplay={getAnswerDisplay()}
        onToggleExpand={onToggleExpand}
      />

      {/* Expanded content - options */}
      {isExpanded && (
        <box style={{ flexDirection: 'column', width: '100%' }}>
          <scrollbox
            ref={scrollRef}
            scrollX={false}
            scrollbarOptions={{ visible: false }}
            verticalScrollbarOptions={{
              visible: true,
              trackOptions: { width: 1 },
            }}
            style={{
              height: Math.min(question.options.length + 1 + (question.multiSelect ? 1 : 0), 10),
              flexDirection: 'column',
              width: '100%',
              rootOptions: {
                flexDirection: 'row',
                backgroundColor: 'transparent',
              },
              wrapperOptions: {
                border: false,
                backgroundColor: 'transparent',
                flexDirection: 'column',
              },
              contentOptions: {
                flexDirection: 'column',
                gap: 0,
                backgroundColor: 'transparent',
              },
            }}
          >
            <OptionsList
              question={question}
              answer={answer}
              optionIndent={optionIndent}
              focusedOptionIndex={focusedOptionIndex}
              isTypingCustom={isTypingCustom}
              onSelectOption={onSelectOption}
              onToggleOption={onToggleOption}
              onFocusOption={onFocusOption}
            />
          </scrollbox>

          {/* Text input area when Custom is selected */}
          {isCustomSelected && (
            <CustomAnswerInput
              value={answer?.customText || ''}
              cursorPosition={customCursorPosition}
              focused={isTypingCustom}
              optionIndent={optionIndent}
              onChange={onSetCustomText}
              onSubmit={onCustomSubmit}
              onPaste={handlePaste}
            />
          )}
        </box>
      )}
    </box>
  )
}
