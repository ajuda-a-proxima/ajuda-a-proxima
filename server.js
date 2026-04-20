const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// CONFIGURAÇÃO DA MISTICPAY
const CLIENT_ID = 'ci_owb0jgvgx8b22v6';
const CLIENT_SECRET = 'cs_c9gxxya0l7rt5f51aujfnvcj7';

// Rota principal: Carrega o seu site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para Gerar o Pix Real via MisticPay
app.post('/gerar-pix', async (req, res) => {
    const { valor, nome } = req.body;

    try {
        console.log(`Iniciando geração de Pix real para: ${nome}`);

        const response = await axios.post('https://api.misticpay.com/v1/pix/qrcode', {
            amount: parseFloat(valor),
            description: `Doação Ajuda Próxima - ${nome}`,
            external_id: `doacao_${Date.now()}`
        }, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        // Retorna os dados reais da MisticPay para o seu site
        if (response.data && response.data.qrcode) {
            res.json({
                success: true,
                qrCode: response.data.qrcode, // O código "copia e cola"
                pixCopiaECola: response.data.qrcode
            });
        } else {
            throw new Error("Resposta da API sem QR Code");
        }

    } catch (error) {
        console.error("Erro na MisticPay:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: "Erro ao conectar com a MisticPay. Verifique suas credenciais." 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
