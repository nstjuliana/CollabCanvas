/**
 * AI Agent Panel Component
 * Example UI for AI agent interaction
 * 
 * This is a starter template - customize based on your LLM integration
 */

import { useState, useRef, useEffect } from 'react';
import { processAgentCommand } from '../services/agentExecutor';
import './AIAgentPanel.css';

function AIAgentPanel({ shapes }) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  /**
   * Handle command submission with streaming
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!command.trim() || isProcessing) return;

    const userCommand = command.trim();
    setCommand('');
    setIsProcessing(true);

    // Add user message to history
    setHistory(prev => [...prev, {
      type: 'user',
      content: userCommand,
      timestamp: new Date(),
    }]);

    // Add a placeholder for agent response that will be updated with streaming chunks
    const agentMessageIndex = history.length + 1;
    setHistory(prev => [...prev, {
      type: 'agent',
      content: '',
      streaming: true,
      success: null,
      timestamp: new Date(),
      toolCalls: [],
    }]);

    try {
      // Process command through AI agent with streaming
      const result = await processAgentCommand(userCommand, shapes, {
        // Stream text chunks as they arrive
        onChunk: (chunk) => {
          setHistory(prev => {
            const newHistory = [...prev];
            if (newHistory[agentMessageIndex]) {
              newHistory[agentMessageIndex] = {
                ...newHistory[agentMessageIndex],
                content: newHistory[agentMessageIndex].content + chunk,
              };
            }
            return newHistory;
          });
        },
        // Handle tool calls
        onToolCall: (toolCall) => {
          setHistory(prev => {
            const newHistory = [...prev];
            if (newHistory[agentMessageIndex]) {
              const toolCalls = [...(newHistory[agentMessageIndex].toolCalls || [])];
              toolCalls.push(toolCall);
              newHistory[agentMessageIndex] = {
                ...newHistory[agentMessageIndex],
                toolCalls,
              };
            }
            return newHistory;
          });
        },
      });

      // Update the final message with success status
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[agentMessageIndex]) {
          newHistory[agentMessageIndex] = {
            ...newHistory[agentMessageIndex],
            streaming: false,
            success: result.success,
            content: result.success 
              ? (newHistory[agentMessageIndex].content || result.message)
              : `✗ Error: ${result.message}`,
          };
        }
        return newHistory;
      });
    } catch (error) {
      // Update message with error
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[agentMessageIndex]) {
          newHistory[agentMessageIndex] = {
            ...newHistory[agentMessageIndex],
            streaming: false,
            success: false,
            content: `✗ Error: ${error.message}`,
          };
        }
        return newHistory;
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Example command shortcuts
   */
  const exampleCommands = [
    'Create a red square at (200, 200)',
    'Create a grid of 4 blue circles',
    'Move the leftmost rectangle 50px to the right',
    'Change all red shapes to green',
    'Delete the text on the bottom',
  ];

  const handleExampleClick = (exampleCommand) => {
    setCommand(exampleCommand);
    inputRef.current?.focus();
  };

  /**
   * Clear history
   */
  const handleClear = () => {
    setHistory([]);
  };

  return (
    <div className={`ai-agent-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle button */}
      <button 
        className="ai-agent-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse AI Agent' : 'Expand AI Agent'}
      >
        <span className="ai-icon">🤖</span>
        {!isExpanded && <span className="ai-label">AI Agent</span>}
      </button>

      {/* Panel content */}
      {isExpanded && (
        <div className="ai-agent-content">
          {/* Header */}
          <div className="ai-agent-header">
            <h3>AI Agent</h3>
            <button 
              className="ai-agent-close"
              onClick={() => setIsExpanded(false)}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Command history */}
          <div className="ai-agent-history" ref={historyRef}>
            {history.length === 0 ? (
              <div className="ai-agent-empty">
                <p>👋 Hi! I can help you manipulate shapes on the canvas.</p>
                <p>Try commands like:</p>
                <ul>
                  <li>"Create a red circle"</li>
                  <li>"Move the blue square left"</li>
                  <li>"Delete all green shapes"</li>
                </ul>
              </div>
            ) : (
              history.map((entry, index) => (
                <div 
                  key={index} 
                  className={`ai-message ai-message-${entry.type} ${entry.success === false ? 'ai-message-error' : ''} ${entry.streaming ? 'ai-message-streaming' : ''}`}
                >
                  <div className="ai-message-content">
                    {entry.content || (entry.streaming ? '...' : '')}
                    {entry.streaming && <span className="ai-cursor">▊</span>}
                  </div>
                  {entry.toolCalls && entry.toolCalls.length > 0 && (
                    <div className="ai-message-details">
                      {entry.toolCalls.map((toolCall, i) => (
                        <div key={i} className="ai-detail">
                          <code>{toolCall.function}</code>
                          {toolCall.result && (
                            <span className="ai-detail-result">
                              {Array.isArray(toolCall.result) 
                                ? `(${toolCall.result.length} ${toolCall.result.length === 1 ? 'item' : 'items'})`
                                : typeof toolCall.result === 'string'
                                ? '✓'
                                : JSON.stringify(toolCall.result).substring(0, 50)
                              }
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {isProcessing && (
              <div className="ai-message ai-message-agent ai-message-loading">
                <div className="ai-loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
          </div>

          {/* Example commands */}
          {history.length === 0 && (
            <div className="ai-agent-examples">
              <p className="ai-examples-title">Quick examples:</p>
              <div className="ai-examples-list">
                {exampleCommands.map((example, index) => (
                  <button
                    key={index}
                    className="ai-example-button"
                    onClick={() => handleExampleClick(example)}
                    disabled={isProcessing}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Command input */}
          <form className="ai-agent-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ai-agent-input"
              placeholder="Type a command... (e.g., 'create a red circle')"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              className="ai-agent-submit"
              disabled={!command.trim() || isProcessing}
            >
              {isProcessing ? '⏳' : '➤'}
            </button>
          </form>

          {/* Actions */}
          {history.length > 0 && (
            <div className="ai-agent-actions">
              <button 
                className="ai-agent-clear"
                onClick={handleClear}
                disabled={isProcessing}
              >
                Clear History
              </button>
            </div>
          )}

          {/* Status indicator */}
          <div className="ai-agent-status">
            {shapes.length} shape{shapes.length !== 1 ? 's' : ''} on canvas
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAgentPanel;

