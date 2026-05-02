import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');
const CSV_FILE = path.join(process.cwd(), 'database.csv');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to save as CSV (as requested)
const saveToCSV = (expenses: any[], users: any[]) => {
  try {
    const headers = ['ID', 'Descrição', 'Valor', 'Data', 'Mês de Faturamento', 'Categoria', 'Parcelas Totais', 'Parcela Atual', 'Grupo', 'Usuário'];
    const rows = expenses.map(e => {
      const user = users.find((u: any) => u.id === e.userId)?.name || 'Desconhecido';
      const description = `"${e.description.replace(/"/g, '""')}"`;
      const amount = e.amount.toFixed(2).replace('.', ',');
      const category = `"${e.category}"`;
      const userName = `"${user}"`;
      
      return [e.id, description, amount, e.date, e.billingMonth, category, e.installments, e.currentInstallment, e.installmentGroupId || '', userName].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    fs.writeFileSync(CSV_FILE, "\uFEFF" + csvContent, 'utf-8');
  } catch (err) {
    console.error('Error writing CSV:', err);
  }
};

// API routes
app.get('/api/data', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json({ users: null, expenses: null, settings: null });
  }
});

app.post('/api/save', (req, res) => {
  const data = req.body;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    // Also save to CSV as requested
    if (data.expenses && data.users) {
      saveToCSV(data.expenses, data.users);
    }
    
    res.json({ success: true, message: 'Dados salvos no servidor (JSON e CSV)' });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar dados no servidor' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database initialized at: ${DB_FILE}`);
  });
}

startServer();
