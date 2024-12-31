let currentUser = null;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const expenseCtx = document.getElementById('expenseChart').getContext('2d');
const trendCtx = document.getElementById('trendChart').getContext('2d');
const expenseChart = new Chart(expenseCtx, {
  type: 'bar',
  data: {
    labels: ['Income', 'Food', 'Utilities', 'Transportation', 'Entertainment', 'Rent', 'Other'],
    datasets: [{
      label: 'Monthly Breakdown (PKR)',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: ['#B8A9C6', '#F8B195', '#96CEB4', '#D4A5A5', '#FFE0E0', '#A5BBD4', '#E0E0FF']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Monthly Financial Breakdown'
      }
    }
  }
});
const trendChart = new Chart(trendCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Daily Transaction Trend (PKR)',
      data: [],
      borderColor: '#6B5B95',
      tension: 0.3,
      fill: true,
      backgroundColor: 'rgba(107, 91, 149, 0.1)'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Transaction Trend'
      }
    }
  }
});
function handleLogin(username, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = username;
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginOverlay').style.display = 'none';
    transactions = JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];
    updateCharts();
    updateSummary();
    generateInsights();
  } else {
    document.getElementById('loginError').textContent = 'Invalid username or password';
  }
}
function handleSignup(username, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.some(u => u.username === username)) {
    document.getElementById('signupError').textContent = 'Username already exists';
    return;
  }
  users.push({
    username,
    password
  });
  localStorage.setItem('users', JSON.stringify(users));
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('signupContainer').style.display = 'none';
  document.getElementById('loginUsername').value = username;
  document.getElementById('loginPassword').value = password;
}
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  handleLogin(username, password);
});
document.getElementById('showSignup').addEventListener('click', function () {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('signupContainer').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', function () {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('signupContainer').style.display = 'none';
});
document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (password !== confirmPassword) {
    document.getElementById('signupError').textContent = 'Passwords do not match';
    return;
  }
  if (password.length < 6) {
    document.getElementById('signupError').textContent = 'Password must be at least 6 characters long';
    return;
  }
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.some(u => u.username === username)) {
    document.getElementById('signupError').textContent = 'Username already exists';
    return;
  }
  users.push({
    username,
    password
  });
  localStorage.setItem('users', JSON.stringify(users));
  currentUser = username;
  document.getElementById('loginOverlay').style.display = 'none';
  transactions = [];
  updateCharts();
  updateSummary();
  generateInsights();
});
document.getElementById('expenseForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!currentUser) return;
  const transaction = {
    type: document.getElementById('transactionType').value,
    amount: parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date: document.getElementById('date').value
  };
  transactions.push(transaction);
  localStorage.setItem(`transactions_${currentUser}`, JSON.stringify(transactions));
  updateCharts();
  updateSummary();
  generateInsights();
  this.reset();
});
function updateCharts() {
  const categoryTotals = {
    income: 0,
    food: 0,
    utilities: 0,
    transportation: 0,
    entertainment: 0,
    rent: 0,
    other: 0
  };
  transactions.forEach(t => {
    if (t.type === 'income') {
      categoryTotals.income += t.amount;
    } else {
      categoryTotals[t.category] += t.amount;
    }
  });
  expenseChart.data.datasets[0].data = Object.values(categoryTotals);
  expenseChart.update();
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  trendChart.data.labels = sortedTransactions.map(t => t.date);
  trendChart.data.datasets[0].data = sortedTransactions.map(t => t.type === 'income' ? t.amount : -t.amount);
  trendChart.update();
}
function updateSummary() {
  const summary = document.getElementById('summary');
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  summary.innerHTML = `
                <p>Total Income: PKR ${totalIncome.toLocaleString()}</p>
                <p>Total Expenses: PKR ${totalExpenses.toLocaleString()}</p>
                <p>Net Balance: PKR ${(totalIncome - totalExpenses).toLocaleString()}</p>
            `;
}
function generateInsights() {
  const insightsDiv = document.getElementById('insights');
  insightsDiv.innerHTML = '';
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const categories = ['food', 'utilities', 'transportation', 'entertainment', 'rent', 'other'];
  const categoryTotals = categories.reduce((acc, category) => {
    acc[category] = transactions.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {});
  const highestExpenseCategory = Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b);
  const insights = [`Monthly Income: PKR ${totalIncome.toLocaleString()}`, `Total Expenses: PKR ${totalExpenses.toLocaleString()}`, `Highest spending category is ${highestExpenseCategory[0]} at PKR ${highestExpenseCategory[1].toLocaleString()}`, `Your savings rate is ${totalIncome ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%`, totalExpenses > totalIncome * 0.8 ? 'Warning: Your expenses are over 80% of your income' : 'Your spending is within healthy limits'];
  insights.forEach(insight => {
    const insightCard = document.createElement('div');
    insightCard.className = 'insight-card animate-in';
    insightCard.textContent = insight;
    insightsDiv.appendChild(insightCard);
  });
}
function handleLogout() {
  currentUser = null;
  transactions = [];
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
}
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
updateCharts();
updateSummary();
generateInsights();
