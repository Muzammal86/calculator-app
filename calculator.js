// 1. DOM Elements Target Karna
const mainDisplay = document.getElementById('mainDisplay');
const expressionDisplay = document.getElementById('expressionDisplay');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const keypad = document.querySelector('.keypad');

// 2. Global Variables (Application State)
let currentValue = '0';
let expression = '';
let shouldResetDisplay = false;
let history = JSON.parse(localStorage.getItem('calc_history')) || [];

// 3. Helper Functions

// Display Update Karna
function updateDisplay() {
    mainDisplay.textContent = currentValue;
    expressionDisplay.textContent = formatDisplayOperator(expression);

    // Font Size Adjust karna (Long Numbers ke liye)
    if (currentValue.length > 9) {
        mainDisplay.style.fontSize = '1.8rem';
    } else if (currentValue.length > 6) {
        mainDisplay.style.fontSize = '2.1rem';
    } else {
        mainDisplay.style.fontSize = '2.5rem';
    }
}

// Operators Ko Display Formatting Ke Liye Badalna
function formatDisplayOperator(expr) {
    return expr
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−');
}

// Button Click Animation
function animateButton(btn) {
    btn.classList.add('btn-pressed');
    setTimeout(() => btn.classList.remove('btn-pressed'), 150);
}

// 4. Calculator Core Logic

// Numbers Handle Karna
function handleNumber(num) {
    if (shouldResetDisplay) {
        currentValue = '';
        shouldResetDisplay = false;
    }

    if (num === '.' && currentValue.includes('.')) return;
    
    if (currentValue === '0' && num !== '.') {
        currentValue = num;
    } else {
        currentValue += num;
    }
    updateDisplay();
}

// Operators Handle Karna (+, -, *, /)
function handleOperator(op) {
    if (currentValue === 'Error') currentValue = '0';

    if (expression && !shouldResetDisplay) {
        calculate();
    }

    expression = `${currentValue} ${op}`;
    shouldResetDisplay = true;
    updateDisplay();
}

// Actions Handle Karna (Clear, Backspace, Equals, Sign Change)
function handleAction(action) {
    switch (action) {
        case 'clear':
            currentValue = '0';
            expression = '';
            shouldResetDisplay = false;
            break;

        case 'backspace':
            if (shouldResetDisplay || currentValue === 'Error') return;
            currentValue = currentValue.slice(0, -1);
            if (currentValue === '' || currentValue === '-') currentValue = '0';
            break;

        case 'percent':
            try {
                let val = parseFloat(currentValue);
                currentValue = (val / 100).toString();
            } catch (err) {
                currentValue = 'Error';
            }
            break;

        case 'toggle-sign':
            if (currentValue === '0' || currentValue === 'Error') return;
            currentValue = currentValue.startsWith('-')
                ? currentValue.slice(1)
                : '-' + currentValue;
            break;

        case 'calculate':
            calculate(true);
            break;
    }
    updateDisplay();
}

// Main Calculation Logic (Using try...catch for Error Handling)
function calculate(isFinal = false) {
    if (!expression || shouldResetDisplay) return;

    let fullExpr = `${expression} ${currentValue}`;
    let cleanExpr = fullExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

    try {
        // Calculation execute karna
        let result = Function(`"use strict"; return (${cleanExpr})`)();

        if (!isFinite(result) || isNaN(result)) {
            throw new Error("Invalid Math");
        }

        let formattedResult = Number.isInteger(result)
            ? result.toString()
            : parseFloat(result.toFixed(8)).toString();

        if (isFinal) {
            saveHistory(fullExpr, formattedResult);
            expression = '';
        } else {
            expression = `${formattedResult}`;
        }

        currentValue = formattedResult;
        shouldResetDisplay = true;

    } catch (err) {
        currentValue = 'Error';
        expression = '';
        shouldResetDisplay = true;
    }
    updateDisplay();
}

// 5. LocalStorage & History Logic

function saveHistory(expr, res) {
    let item = { expr: expr, res: res, id: Date.now() };
    history.unshift(item); // Start mein add karna
    if (history.length > 20) history.pop();

    try {
        localStorage.setItem('calc_history', JSON.stringify(history));
    } catch (err) {
        console.warn("LocalStorage error:", err.message);
    }

    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No history yet</div>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item" data-res="${item.res}">
            <div class="history-expr">${formatDisplayOperator(item.expr)} =</div>
            <div class="history-res">${item.res}</div>
        </div>
    `).join('');

    // History Item Click Par Value Re-use Karna
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            currentValue = item.dataset.res;
            shouldResetDisplay = false;
            updateDisplay();
            historyPanel.classList.remove('active');
        });
    });
}

// 6. Event Listeners Setup

// Keypad Clicks
keypad.addEventListener('click', (e) => {
    let btn = e.target.closest('.btn');
    if (!btn) return;

    let value = btn.dataset.value;
    let action = btn.dataset.action;

    if (value !== undefined) {
        if (['+', '-', '*', '/'].includes(value)) {
            handleOperator(value);
        } else {
            handleNumber(value);
        }
    } else if (action) {
        handleAction(action);
    }
    animateButton(btn);
});

// Keyboard Input
window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
    } else if (e.key === '.') {
        handleNumber('.');
    } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleAction('calculate');
    } else if (e.key === 'Backspace') {
        handleAction('backspace');
    } else if (e.key === 'Escape') {
        handleAction('clear');
    }
});

// History Panel Toggle
toggleHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('active');
});

clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
});

// Initial Setup Call
renderHistory();
updateDisplay();