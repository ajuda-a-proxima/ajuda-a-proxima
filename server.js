const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas
app.use(cors());
app.use(bodyParser.json());

// --- ESTA PARTE RESOLVE O ERRO "CANNOT GET /" ---
// Indica que os arquivos estáticos (como o index.html) estão na pasta raiz
app.use(express.static(path.join(__dirname, '')));

// Rota principal: quando alguém acessa o site, o servidor envia o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- ROTA PARA GERAR O PIX ---
// Aqui é onde a mágica acontece quando o usuário clica no botão de doar
app.post('/gerar-pix', async (req, res) => {
    try {
        const { nome, valor } = req.body;

        // Log para você acompanhar no console do Render
        console.log(`Solicitação de Pix: Nome: ${nome}, Valor: R$ ${valor}`);

        // Placeholder para a lógica do seu provedor de pagamento (Mercado Pago, Efí, etc)
        // Por enquanto, vamos retornar um link de teste para validar a conexão
        res.status(200).json({
            success: true,
            message: "Servidor conectado!",
            qrCode: "https://via.placeholder.com/200?text=QR+CODE+PIX" 
        });

    } catch (error) {
        console.error("Erro no processamento:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Projeto: Ajuda a Próxima`);
});
