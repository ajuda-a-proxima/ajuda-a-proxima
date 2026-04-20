const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.json());

// CONFIGURAÇÃO DE ARQUIVOS: Procura tudo na pasta principal (raiz)
app.use(express.static(__dirname));

// Rota principal: Carrega o seu site direto da raiz (Resolve o erro "Cannot GET /")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para Gerar o Pix
app.post('/gerar-pix', async (req, res) => {
    const { valor, nome, cpf, email, descricao } = req.body;

    try {
        console.log(`Gerando Pix para ${nome} no valor de R$ ${valor}`);
        
        // Simulação de resposta (QR Code genérico para teste)
        res.json({
            success: true,
            qrCode: "00020101021226870014br.gov.bcb.pix0125suachavepixaqui5204000053039865404" + valor + "5802BR5913AjudaProxima6009SAO PAULO62070503***6304",
            pixCopiaECola: "Link do Pix Copia e Cola aparecerá aqui"
        });
    } catch (error) {
        console.error("Erro ao gerar Pix:", error);
        res.status(500).json({ success: false, message: "Erro ao processar pagamento." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
