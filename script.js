const API_BASE = 'https://SEU-BACKEND.onrender.com';
const TOTAL_SECONDS = 1800;

let timeLeft = TOTAL_SECONDS;
let activeTransactionId = '';
let pixPayload = '';
let timerInterval = null;
let statusInterval = null;

const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('progressBar');
const qrcodeImg = document.getElementById('qrcodeImg');
const qrcodePlaceholder = document.getElementById('qrcodePlaceholder');
const copyBtn = document.getElementById('copyBtn');
const pixCodeEl = document.getElementById('pixCode');
const statusBox = document.getElementById('statusBox');

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setStatus(message, type = '') {
  statusBox.className = `status ${type}`.trim();
  statusBox.textContent = message;
}

function updateTimerUI() {
  timerEl.textContent = formatTime(timeLeft);
  progressBar.style.width = `${(timeLeft / TOTAL_SECONDS) * 100}%`;
}

async function fetchCurrentPix() {
  const res = await fetch(`${API_BASE}/api/get-pix`);
  if (!res.ok) throw new Error('Não foi possível carregar o Pix atual.');
  return res.json();
}

async function initializePix() {
  try {
    setStatus('Carregando cobrança...', '');
    const data = await fetchCurrentPix();
    pixPayload = data.payload || '';
    activeTransactionId = data.transactionId || '';

    if (data.qrcode) {
      qrcodeImg.src = data.qrcode;
      qrcodeImg.style.display = 'block';
      qrcodePlaceholder.style.display = 'none';
    }

    pixCodeEl.value = pixPayload;
    timeLeft = data.expires_in || TOTAL_SECONDS;
    updateTimerUI();
    setStatus('Aguardando confirmação do pagamento...', '');
  } catch (err) {
    setStatus(err.message, 'error');
  }
}

async function refreshPix() {
  try {
    setStatus('Gerando novo Pix...', '');
    const res = await fetch(`${API_BASE}/api/refresh-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10 })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar Pix.');

    pixPayload = data.payload || '';
    activeTransactionId = data.transactionId || '';
    pixCodeEl.value = pixPayload;

    if (data.qrcode) {
      qrcodeImg.src = data.qrcode;
      qrcodeImg.style.display = 'block';
      qrcodePlaceholder.style.display = 'none';
    }

    timeLeft = data.expires_in || TOTAL_SECONDS;
    updateTimerUI();
    setStatus('Novo Pix gerado com sucesso.', 'ok');
  } catch (err) {
    setStatus(err.message, 'error');
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      await refreshPix();
      startTimer();
      return;
    }
    updateTimerUI();
  }, 1000);
}

async function checkStatus() {
  if (!activeTransactionId) return;

  try {
    const res = await fetch(`${API_BASE}/api/status/${activeTransactionId}`);
    const data = await res.json();

    if (data.status === 'CONCLUIDO' || data.status === 'COMPLETO') {
      setStatus('Pagamento Confirmado', 'ok');
      clearInterval(timerInterval);
      clearInterval(statusInterval);
    }
  } catch (err) {
    console.error(err);
  }
}

copyBtn.addEventListener('click', async () => {
  if (!pixPayload) return;
  await navigator.clipboard.writeText(pixPayload);
  setStatus('Código Pix copiado.', 'ok');
});

(async function boot() {
  await initializePix();
  startTimer();
  statusInterval = setInterval(checkStatus, 5000);
})(); 
 
 
  
   
   