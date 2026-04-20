const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const CLIENT_ID = process.env.CLIENT_ID || 'ci_owb0jgvgx8b22v6';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const API_BASE = process.env.API_BASE || 'https://api.misticpay.com/api';
const PIX_KEY = process.env.PIX_KEY || '';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

let current = {
  payload: '',
  qrcode: '',
  transactionId: 'initial',
  expiresAt: Date.now() + 1800 * 1000,
  status: 'PENDENTE'
};

let accessToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const auth = await axios.post(
    `${API_BASE}/oauth/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  accessToken = auth.data.access_token;
  tokenExpiresAt = Date.now() + ((auth.data.expires_in || 3600) - 60) * 1000;
  return accessToken;
}

async function createPix(amount) {
  const token = await getToken();
  const txid = `tx_${Date.now()}`;

  const response = await axios.post(
    `${API_BASE}/transactions/create`,
    {
      amount: Number(amount),
      payerName: 'Cliente',
      payerDocument: '12345678909',
      transactionId: txid,
      description: 'Ajuda a Próxima',
      webhookUrl: WEBHOOK_URL
    },
    {
      headers: {
        ci: CLIENT_ID,
        cs: CLIENT_SECRET,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = response.data?.data || response.data || {};

  current = {
    payload: data.copyPaste || data.pixCopiaECola || '',
    qrcode: data.qrCodeBase64 ? `data:image/png;base64,${data.qrCodeBase64}` : (data.qrcodeUrl || ''),
    transactionId: data.transactionId || txid,
    expiresAt: Date.now() + 1800 * 1000,
    status: 'PENDENTE'
  };

  return current;
}

app.get('/api/get-pix', (_req, res) => {
  res.json({
    payload: current.payload,
    qrcode: current.qrcode,
    transactionId: current.transactionId,
    expires_in: Math.max(0, Math.floor((current.expiresAt - Date.now()) / 1000)),
    status: current.status
  });
});

app.post('/api/refresh-pix', async (req, res) => {
  try {
    const pix = await createPix(req.body.amount || 10);
    res.json({
      payload: pix.payload,
      qrcode: pix.qrcode,
      transactionId: pix.transactionId,
      expires_in: 1800
    });
  } catch (err) {
    res.status(500).json({
      error: err.response?.data?.message || err.message || 'Erro ao gerar Pix.'
    });
  }
});

app.get('/api/status/:transactionId', async (req, res) => {
  try {
    const token = await getToken();

    const statusResp = await axios.post(
      `${API_BASE}/transactions/check`,
      { transactionId: req.params.transactionId },
      {
        headers: {
          ci: CLIENT_ID,
          cs: CLIENT_SECRET,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = statusResp.data || {};
    const status = data.transaction?.transactionState || data.status || 'PENDENTE';
    current.status = status;

    res.json({ status, raw: data });
  } catch (err) {
    res.status(500).json({
      error: 'Falha ao consultar status.',
      detail: err.message
    });
  }
});

app.post('/webhook', (req, res) => {
  const { status } = req.body || {};
  if (status === 'CONCLUIDO' || status === 'COMPLETO') {
    current.status = 'COMPLETO';
  }
  res.sendStatus(200);
});

setInterval(() => {
  if (Date.now() >= current.expiresAt) {
    createPix(10).catch(console.error);
  }
}, 1000);

app.listen(process.env.PORT || 3000, () => console.log('Servidor rodando na porta 3000'));  
 
  
  