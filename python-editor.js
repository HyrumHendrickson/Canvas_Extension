let pyodide;
let isInitialized = false;

// Initialize everything when the page loads
async function init() {
    try {
        updateStatus("Loading Python interpreter...");
        
        // Load Pyodide dynamically
        await loadPyodideScript();
        
        // Initialize Pyodide
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
        
        updateStatus("Installing packages...");
        
        // Install commonly used packages
        try {
            await pyodide.loadPackage(["numpy", "matplotlib", "pandas"]);
            
            // Setup matplotlib for web
            pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

def show_plot():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode()
    plt.close()
    return f'<img src="data:image/png;base64,{img_base64}" style="max-width: 100%; height: auto;">'
`);
        } catch (packageError) {
            console.warn("Some packages failed to load:", packageError);
            updateStatus("Ready (some packages unavailable)");
        }
        
        // Hide loading screen and show main content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'flex';
        
        isInitialized = true;
        updateStatus("Ready to run Python code!");
        
    } catch (error) {
        console.error("Initialization error:", error);
        document.getElementById('loading').innerHTML = `
            <div class="info-box" style="background-color: #ffebee; border-color: #ffcdd2;">
                <h3 style="color: #c62828;">Python Environment Unavailable</h3>
                <p>The Python interpreter could not be loaded due to browser security restrictions.</p>
                <p><strong>Solutions:</strong></p>
                <ul>
                    <li>Try refreshing the page</li>
                    <li>Check your internet connection</li>
                    <li>The code editor will still work for writing Python code</li>
                </ul>
                <button onclick="location.reload()" class="btn" style="margin-top: 1rem;">Try Again</button>
            </div>
        `;
    }
}

function loadPyodideScript() {
    return new Promise((resolve, reject) => {
        if (window.loadPyodide) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

async function runCode() {
    const code = document.getElementById('code-editor').value;
    const outputElement = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    
    if (!isInitialized || !pyodide) {
        outputElement.className = 'output-container error';
        outputElement.textContent = 'Python interpreter not available. Please refresh the page and try again.';
        return;
    }
    
    if (!code.trim()) {
        outputElement.className = 'output-container error';
        outputElement.textContent = 'Please enter some Python code to run.';
        return;
    }
    
    // Clear previous output
    outputElement.textContent = '';
    outputElement.className = 'output-container';
    
    // Disable run button during execution
    runBtn.disabled = true;
    updateStatus("Running code...");
    
    try {
        // Capture stdout
        pyodide.runPython(`
import sys
from io import StringIO
import contextlib
import traceback

# Capture stdout and stderr
captured_output = StringIO()
captured_errors = StringIO()
`);
        
        // Run the user's code with output capture
        const result = pyodide.runPython(`
try:
    with contextlib.redirect_stdout(captured_output):
        with contextlib.redirect_stderr(captured_errors):
            exec("""${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}""")
            
            # Check if there's a plot to show
            try:
                if 'plt' in globals() and hasattr(plt, 'get_fignums') and plt.get_fignums():
                    print(show_plot())
            except:
                pass
    
    # Get outputs
    stdout_content = captured_output.getvalue()
    stderr_content = captured_errors.getvalue()
    
    if stderr_content:
        stdout_content += "\\n" + stderr_content
    
    stdout_content if stdout_content else "Code executed successfully (no output)"
    
except Exception as e:
    import traceback
    f"Error: {str(e)}\\n\\n{traceback.format_exc()}"
`);
        
        if (result && result.trim()) {
            // Check if output contains HTML (for plots)
            if (result.includes('<img src="data:image/png;base64,')) {
                outputElement.innerHTML = result;
            } else {
                outputElement.textContent = result;
            }
            
            // Check if it's an error
            if (result.includes('Error:') && result.includes('Traceback')) {
                outputElement.className = 'output-container error';
            }
        } else {
            outputElement.textContent = 'Code executed successfully (no output)';
        }
        
        updateStatus("Execution completed");
        
    } catch (error) {
        outputElement.className = 'output-container error';
        outputElement.textContent = `Error: ${error.message}`;
        updateStatus("Execution failed");
    } finally {
        runBtn.disabled = false;
    }
}

function clearOutput() {
    const outputElement = document.getElementById('output');
    outputElement.textContent = 'Output will appear here...';
    outputElement.className = 'output-container';
    updateStatus("Output cleared");
}

function loadExample(type) {
    const editor = document.getElementById('code-editor');
    let code = '';
    
    switch(type) {
        case 'hello':
            code = `# Hello World Example
print("Hello, World!")
print("Welcome to Python in Canvas!")

# Basic variables and operations
name = "Student"
age = 20
print(f"Hello {name}, you are {age} years old!")

# Simple calculation
result = 2 + 2
print(f"2 + 2 = {result}")`;
            break;
            
        case 'math':
            code = `# Math and Statistics Example
import math
import random

# Mathematical operations
print("=== Mathematical Operations ===")
print(f"π = {math.pi:.6f}")
print(f"e = {math.e:.6f}")
print(f"√2 = {math.sqrt(2):.6f}")

# Trigonometry
angle = math.pi / 4  # 45 degrees in radians
print(f"sin(45°) = {math.sin(angle):.6f}")
print(f"cos(45°) = {math.cos(angle):.6f}")

# Random numbers and statistics
numbers = [random.randint(1, 100) for _ in range(10)]
print(f"Random numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers):.2f}")
print(f"Min: {min(numbers)}, Max: {max(numbers)}")`;
            break;
            
        case 'data':
            code = `# Data Analysis Example
# Create sample data using basic Python (no pandas needed)
students = [
    {"name": "Alice", "age": 25, "score": 85, "city": "New York"},
    {"name": "Bob", "age": 30, "score": 92, "city": "London"},
    {"name": "Charlie", "age": 35, "score": 78, "city": "Paris"},
    {"name": "Diana", "age": 28, "score": 88, "city": "Tokyo"},
    {"name": "Eve", "age": 32, "score": 95, "city": "Sydney"}
]

print("=== Sample Dataset ===")
for student in students:
    print(f"{student['name']}: Age {student['age']}, Score {student['score']}, City {student['city']}")

print("\\n=== Basic Statistics ===")
ages = [s['age'] for s in students]
scores = [s['score'] for s in students]

print(f"Average age: {sum(ages)/len(ages):.1f}")
print(f"Average score: {sum(scores)/len(scores):.1f}")
print(f"Highest score: {max(scores)}")
print(f"Lowest score: {min(scores)}")

print("\\n=== Cities ===")
cities = [s['city'] for s in students]
for city in set(cities):
    count = cities.count(city)
    print(f"{city}: {count} student(s)")`;
            break;
            
        case 'plot':
            code = `# Simple Plot Example
try:
    import matplotlib.pyplot as plt
    import numpy as np
    
    # Create sample data
    x = [i/10 for i in range(0, 63)]  # 0 to 6.2 in steps of 0.1
    y1 = [math.sin(val) for val in x]
    y2 = [math.cos(val) for val in x]
    
    # Create the plot
    plt.figure(figsize=(10, 6))
    plt.plot(x, y1, label='sin(x)', linewidth=2)
    plt.plot(x, y2, label='cos(x)', linewidth=2)
    plt.xlabel('x')
    plt.ylabel('y')
    plt.title('Sine and Cosine Functions')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Display the plot
    plt.show()
    
except ImportError:
    print("Matplotlib not available. Here's the data instead:")
    import math
    
    print("x\\tsin(x)\\tcos(x)")
    print("-" * 25)
    for i in range(0, 63, 6):
        x = i/10
        sin_x = math.sin(x)
        cos_x = math.cos(x)
        print(f"{x:.1f}\\t{sin_x:.3f}\\t{cos_x:.3f}")`;
            break;
    }
    
    editor.value = code;
}

// Handle tab key in textarea for proper indentation
function handleTabKey(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Insert 4 spaces
        const spaces = '    ';
        textarea.value = textarea.value.substring(0, start) + spaces + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        runCode();
    }
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const codeEditor = document.getElementById('code-editor');
    
    if (runBtn) runBtn.addEventListener('click', runCode);
    if (clearBtn) clearBtn.addEventListener('click', clearOutput);
    if (codeEditor) {
        codeEditor.addEventListener('keydown', handleTabKey);
        
        // Auto-resize textarea
        codeEditor.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
    
    // Make loadExample function available globally
    window.loadExample = loadExample;
    
    // Close button functionality
    const closeBtn = document.getElementById('close-page');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage('close-extension-page', '*');
            }
        });
    }
    
    // Show close button only if in an overlay
    window.addEventListener('message', function(event) {
        if (event.data === 'show-close-button') {
            const closeBtn = document.getElementById('close-page');
            if (closeBtn) {
                closeBtn.style.display = 'block';
            }
        }
    });
    
    // Initialize when page loads
    init();
});
