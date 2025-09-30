// Importa a biblioteca para manipulação de JWT
const jwt = require('jsonwebtoken');

// Exporta a função de middleware
module.exports = function (req, res, next) {
    // Pega o token do cabeçalho de autorização da requisição
    const authHeader = req.header('Authorization');

    // Verifica se o cabeçalho de autorização existe
    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
    }

    // O formato do token é "Bearer <token>". Precisamos extrair apenas o token.
    const token = authHeader.split(' ')[1];

    // Verifica se o token existe após o "Bearer"
    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido.' });
    }

    try {
        // Tenta verificar se o token é válido usando o nosso segredo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Se for válido, o 'decoded' conterá os dados do usuário (payload)
        // Adicionamos esses dados ao objeto 'req' para que as rotas subsequentes possam usá-lo
        req.user = decoded;
        
        // Chama a próxima função/middleware na cadeia (neste caso, a lógica da rota)
        next();
    } catch (error) {
        // Se a verificação falhar (token inválido, expirado, etc.), retorna um erro
        res.status(401).json({ error: 'Token inválido.' });
    }
};