// Python Code Editor with iframe execution
let editor;
let lineNumbers;
let pythonExecutor;
let currentExecutor = 'trinket';

// Code examples
const examples = {
    hello: `# Hello World Example
print("Hello, World!")
print("Welcome to Python in Canvas!")

# Basic variables and operations
name = "Student"
age = 20
print(f"Hello {name}, you are {age} years old!")

# Simple calculation
result = 2 + 2
print(f"2 + 2 = {result}")`,

    math: `# Math and Statistics Example
import math
import random

# Mathematical operations
print("=== Mathematical Operations ===")
print(f"π = {math.pi:.6f}")
print(f"e = {math.e:.6f}")
print(f"√2 = {math.sqrt(2):.6f}")

# Random numbers
numbers = [random.randint(1, 100) for _ in range(10)]
print(f"Random numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers):.2f}")`,

    data: `# Data Analysis Example
# Sample student data
students = [
    {"name": "Alice", "age": 22, "grade": "A", "major": "CS"},
    {"name": "Bob", "age": 23, "grade": "B+", "major": "Math"},
    {"name": "Charlie", "age": 21, "grade": "A-", "major": "Physics"},
    {"name": "Diana", "age": 24, "grade": "A", "major": "CS"},
]

print("=== Student Analysis ===")
print(f"Total students: {len(students)}")

# Grade analysis
grades = [s["grade"] for s in students]
print(f"Grades: {grades}")

# Major counts
majors = [s["major"] for s in students]
cs_count = majors.count("CS")
print(f"CS majors: {cs_count}")`,

    plot: `# Simple Plotting Example
# For matplotlib plots, use this pattern:

import matplotlib.pyplot as plt

# Sample data
x = [1, 2, 3, 4, 5]
y = [2, 4, 1, 5, 3]

# Create plot
plt.figure(figsize=(8, 6))
plt.plot(x, y, marker='o')
plt.title('Sample Plot')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.grid(True)
plt.show()

# Text-based alternative:
print("Simple data visualization:")
for i, val in enumerate(y):
    print(f"X={x[i]}: {'*' * val}")`
};

// Executor configurations
const executors = {
    trinket: {
        name: 'Trinket',
        baseUrl: 'https://trinket.io/embed/python/9416dfb893',
        supportsCustomCode: true,
        method: 'url_params'
    },
    replit: {
        name: 'Replit',
        baseUrl: 'https://replit.com/@templates/Python?embed=true',
        supportsCustomCode: false,
        method: 'manual'
    },
    skulpt: {
        name: 'Skulpt',
        baseUrl: 'https://skulpt.org/skulpt.html',
        supportsCustomCode: false,
        method: 'manual'
    }
};

// Initialize the editor
function init() {
    editor = document.getElementById('code-editor');
    lineNumbers = document.getElementById('line-numbers');
    pythonExecutor = document.getElementById('python-executor');
    
    if (!editor || !lineNumbers || !pythonExecutor) {
        console.error('Required elements not found');
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize line numbers and status
    updateLineNumbers();
    updateStatus();
    
    // Load initial executor
    loadExecutor(currentExecutor);
    
    console.log('Python Code Editor with iframe execution initialized');
}

function setupEventListeners() {
    // Example buttons
    const exampleButtons = document.querySelectorAll('.example-btn');
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const example = this.getAttribute('data-example');
            loadExample(example);
        });
    });
    
    // Control buttons
    const runBtn = document.getElementById('run-code');
    const copyBtn = document.getElementById('copy-code');
    const clearBtn = document.getElementById('clear-editor');
    const resetBtn = document.getElementById('reset-executor');
    const fullscreenBtn = document.getElementById('fullscreen-executor');
    const executorSelect = document.getElementById('executor-select');
    
    if (runBtn) runBtn.addEventListener('click', runCode);
    if (copyBtn) copyBtn.addEventListener('click', copyCode);
    if (clearBtn) clearBtn.addEventListener('click', clearEditor);
    if (resetBtn) resetBtn.addEventListener('click', resetExecutor);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', fullscreenExecutor);
    if (executorSelect) {
        executorSelect.addEventListener('change', function() {
            currentExecutor = this.value;
            loadExecutor(currentExecutor);
        });
    }
    
    // Editor events
    editor.addEventListener('input', function() {
        updateLineNumbers();
        updateStatus();
    });
    
    editor.addEventListener('scroll', function() {
        lineNumbers.scrollTop = editor.scrollTop;
    });
    
    editor.addEventListener('keydown', handleKeydown);
    
    // Close button functionality
    const closeBtn = document.getElementById('close-page');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage('close-extension-page', '*');
            }
        });
    }
    
    // Show close button if in overlay
    window.addEventListener('message', function(event) {
        if (event.data === 'show-close-button') {
            const closeBtn = document.getElementById('close-page');
            if (closeBtn) {
                closeBtn.style.display = 'block';
            }
        }
    });
}

function loadExecutor(executorType) {
    const loadingDiv = document.getElementById('loading-executor');
    const config = executors[executorType];
    
    if (!config) {
        console.error('Unknown executor type:', executorType);
        return;
    }
    
    // Show loading
    loadingDiv.style.display = 'flex';
    pythonExecutor.style.display = 'none';
    loadingDiv.textContent = `Loading ${config.name} executor...`;
    
    // Set iframe source
    pythonExecutor.src = config.baseUrl;
    
    // Handle iframe load
    pythonExecutor.onload = function() {
        loadingDiv.style.display = 'none';
        pythonExecutor.style.display = 'block';
        showMessage(`${config.name} executor loaded!`, 'success');
    };
    
    pythonExecutor.onerror = function() {
        loadingDiv.textContent = `Failed to load ${config.name}. Try another executor.`;
        showMessage(`Failed to load ${config.name}`, 'error');
    };
}

function runCode() {
    const code = editor.value.trim();
    
    if (!code) {
        showMessage('Please write some Python code first!', 'warning');
        return;
    }
    
    const config = executors[currentExecutor];
    
    if (currentExecutor === 'trinket' && config.supportsCustomCode) {
        // For Trinket, we can encode the code in the URL
        runCodeInTrinket(code);
    } else {
        // For other executors, show instructions
        showRunInstructions(code);
    }
}

function runCodeInTrinket(code) {
    try {
        // Encode the code for URL
        const encodedCode = encodeURIComponent(code);
        
        // Create a new Trinket URL with the code
        const trinketUrl = `https://trinket.io/embed/python/9416dfb893?start=result&showInstructions=false#code=${encodedCode}`;
        
        // Update iframe
        const loadingDiv = document.getElementById('loading-executor');
        loadingDiv.style.display = 'flex';
        loadingDiv.textContent = 'Running your code...';
        pythonExecutor.style.display = 'none';
        
        pythonExecutor.src = trinketUrl;
        
        pythonExecutor.onload = function() {
            loadingDiv.style.display = 'none';
            pythonExecutor.style.display = 'block';
            showMessage('Code executed in Trinket!', 'success');
        };
        
    } catch (error) {
        console.error('Error running code in Trinket:', error);
        showMessage('Error running code. Try copying and pasting manually.', 'error');
        showRunInstructions(code);
    }
}

function showRunInstructions(code) {
    // Create a modal or instructions for manual execution
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    content.innerHTML = `
        <h3 style="margin-top: 0; color: #0374B5;">🚀 Run Your Code</h3>
        <p>Your code has been copied to the clipboard! Follow these steps:</p>
        <ol>
            <li><strong>Go to the executor</strong> (right panel)</li>
            <li><strong>Clear any existing code</strong></li>
            <li><strong>Paste your code</strong> (Ctrl+V or Cmd+V)</li>
            <li><strong>Run the code</strong> using the executor's run button</li>
        </ol>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
            <strong>Your code:</strong><br>
            <pre style="margin: 0.5rem 0; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">${code}</pre>
        </div>
        <div style="text-align: center; margin-top: 1.5rem;">
            <button id="close-modal" style="background: #0374B5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Got it!</button>
            <button id="copy-again" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 1rem;">Copy Again</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Copy code to clipboard
    copyToClipboard(code);
    
    // Event listeners
    content.querySelector('#close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    content.querySelector('#copy-again').addEventListener('click', () => {
        copyToClipboard(code);
        showMessage('Code copied again!', 'success');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function resetExecutor() {
    loadExecutor(currentExecutor);
}

function fullscreenExecutor() {
    const config = executors[currentExecutor];
    window.open(config.baseUrl, '_blank');
}

function handleKeydown(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        insertTab(event.shiftKey);
    } else if (event.key === 'Enter') {
        setTimeout(() => {
            autoIndent();
            updateLineNumbers();
            updateStatus();
        }, 0);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runCode();
    }
}

function insertTab(unindent = false) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    
    if (start === end) {
        if (unindent) {
            const beforeCursor = value.substring(0, start);
            const match = beforeCursor.match(/( {1,4})$/);
            if (match) {
                const spaces = match[1];
                editor.value = value.substring(0, start - spaces.length) + value.substring(start);
                editor.selectionStart = editor.selectionEnd = start - spaces.length;
            }
        } else {
            const spaces = '    ';
            editor.value = value.substring(0, start) + spaces + value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + spaces.length;
        }
    }
}

function autoIndent() {
    const cursorPos = editor.selectionStart;
    const value = editor.value;
    const beforeCursor = value.substring(0, cursorPos);
    const lines = beforeCursor.split('\n');
    const currentLine = lines[lines.length - 2] || '';
    
    const indentMatch = currentLine.match(/^(\s*)/);
    let indent = indentMatch ? indentMatch[1] : '';
    
    if (currentLine.trim().endsWith(':')) {
        indent += '    ';
    }
    
    if (indent) {
        const newValue = value.substring(0, cursorPos) + indent + value.substring(cursorPos);
        editor.value = newValue;
        editor.selectionStart = editor.selectionEnd = cursorPos + indent.length;
    }
}

function updateLineNumbers() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;
    
    let lineNumbersText = '';
    for (let i = 1; i <= lineCount; i++) {
        lineNumbersText += i + '\n';
    }
    
    lineNumbers.textContent = lineNumbersText;
}

function updateStatus() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;
    const charCount = editor.value.length;
    
    const statusElement = document.getElementById('status');
    const lineCountElement = document.getElementById('line-count');
    
    if (lineCountElement) {
        lineCountElement.textContent = lineCount;
    }
    
    if (statusElement) {
        statusElement.innerHTML = `Ready • <span id="line-count">${lineCount}</span> lines • ${charCount} chars`;
    }
}

function loadExample(type) {
    if (examples[type]) {
        editor.value = examples[type];
        updateLineNumbers();
        updateStatus();
        
        editor.scrollTop = 0;
        lineNumbers.scrollTop = 0;
        
        // Flash effect
        editor.style.backgroundColor = '#4a5568';
        setTimeout(() => {
            editor.style.backgroundColor = '#2d3748';
        }, 200);
        
        showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} example loaded!`, 'success');
    }
}

function copyCode() {
    const code = editor.value;
    
    if (!code.trim()) {
        showMessage('No code to copy!', 'warning');
        return;
    }
    
    copyToClipboard(code);
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Code copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    try {
        textarea.select();
        document.execCommand('copy');
        showMessage('Code copied to clipboard!', 'success');
    } catch (err) {
        showMessage('Copy failed. Please select and copy manually.', 'error');
    } finally {
        document.body.removeChild(textarea);
    }
}

function clearEditor() {
    if (confirm('Clear all code?')) {
        editor.value = '# Write your Python code here\nprint("Hello from Canvas!")\n';
        updateLineNumbers();
        updateStatus();
        editor.focus();
        showMessage('Editor cleared!', 'success');
    }
}

function showMessage(text, type = 'info') {
    const statusElement = document.getElementById('status');
    const originalHTML = statusElement.innerHTML;
    
    const colors = {
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    statusElement.style.color = colors[type] || colors.info;
    statusElement.textContent = text;
    
    setTimeout(() => {
        statusElement.style.color = '#666';
        statusElement.innerHTML = originalHTML;
    }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
