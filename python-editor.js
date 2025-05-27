let pyodide;
let editor;

// Initialize everything when the page loads
async function init() {
    try {
        // Initialize CodeMirror
        editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            extraKeys: {
                "Ctrl-Enter": runCode,
                "Cmd-Enter": runCode
            }
        });
        
        // Initialize Pyodide
        updateStatus("Loading Python interpreter...");
        pyodide = await loadPyodide();
        
        // Install commonly used packages
        updateStatus("Installing packages...");
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
        
        // Hide loading screen and show main content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'flex';
        
        updateStatus("Ready to run Python code!");
        
    } catch (error) {
        document.getElementById('loading').innerHTML = `
            <p style="color: red;">Error loading Python interpreter:</p>
            <p>${error.message}</p>
            <p>Please refresh the page to try again.</p>
        `;
    }
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

async function runCode() {
    if (!pyodide) {
        updateStatus("Python interpreter not ready yet...");
        return;
    }
    
    const code = editor.getValue();
    const outputElement = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    
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

# Capture stdout
captured_output = StringIO()
`);
        
        // Run the user's code with output capture
        pyodide.runPython(`
with contextlib.redirect_stdout(captured_output):
    with contextlib.redirect_stderr(captured_output):
        exec("""${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}""")
        
        # Check if there's a plot to show
        try:
            if plt.get_fignums():
                print(show_plot())
        except:
            pass
`);
        
        // Get the captured output
        const output = pyodide.runPython('captured_output.getvalue()');
        
        if (output.trim()) {
            // Check if output contains HTML (for plots)
            if (output.includes('<img src="data:image/png;base64,')) {
                outputElement.innerHTML = output;
            } else {
                outputElement.textContent = output;
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
print(f"\\nRandom numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers):.2f}")
print(f"Min: {min(numbers)}, Max: {max(numbers)}")`;
            break;
            
        case 'plot':
            code = `# Matplotlib Plot Example
import matplotlib.pyplot as plt
import numpy as np

# Create sample data
x = np.linspace(0, 2*np.pi, 100)
y1 = np.sin(x)
y2 = np.cos(x)

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
plt.show()`;
            break;
            
        case 'data':
            code = `# Data Analysis Example
import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'Score': [85, 92, 78, 88, 95],
    'City': ['New York', 'London', 'Paris', 'Tokyo', 'Sydney']
}

df = pd.DataFrame(data)

print("=== Sample Dataset ===")
print(df)

print("\\n=== Basic Statistics ===")
print(f"Average age: {df['Age'].mean():.1f}")
print(f"Average score: {df['Score'].mean():.1f}")
print(f"Highest score: {df['Score'].max()}")
print(f"Lowest score: {df['Score'].min()}")

print("\\n=== Data by City ===")
for city in df['City'].unique():
    city_data = df[df['City'] == city]
    print(f"{city}: {len(city_data)} person(s)")`;
            break;
    }
    
    editor.setValue(code);
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById('run-btn').addEventListener('click', runCode);
    document.getElementById('clear-btn').addEventListener('click', clearOutput);
    
    // Make loadExample function available globally
    window.loadExample = loadExample;
    
    // Close button functionality
    document.getElementById('close-page').addEventListener('click', function() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage('close-extension-page', '*');
        }
    });
    
    // Show close button only if in an overlay
    window.addEventListener('message', function(event) {
        if (event.data === 'show-close-button') {
            document.getElementById('close-page').style.display = 'block';
        }
    });
    
    // Initialize when page loads
    init();
});
