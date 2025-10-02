const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./services/db');
const authMiddleware = require('./middleware/auth');
const cors = require('cors');

// variáveis de ambiente .env
require('dotenv').config();

// Inicialização do aplicativo Express
const app = express();
const port = process.env.PORT;

// Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ROTA DE CADASTRO DE USUÁRIO
app.post('/signup', async (req, res) => {
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password || !plan) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO users (name, email, password_hash, plan) VALUES ($1, $2, $3, $4) RETURNING id';
        const values = [name, email, hashedPassword, plan];

        const result = await db.query(query, values);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// NOVA ROTA DE LOGIN DE USUÁRIO
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // 1. Busca o usuário pelo e-mail no banco de dados
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];

        // 2. Compara a senha enviada com a senha criptografada (hash) no banco
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 3. Se a senha for válida, gera o token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email }, // Payload: dados que estarão no token
            process.env.JWT_SECRET, // Segredo usado para assinar o token
            { expiresIn: '1h' } // Opções: define a validade do token (ex: 1 hora)
        );

        // 4. Envia o token de volta para o cliente
        res.status(200).json({ message: 'Login bem-sucedido!', token: token });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.get('/profile', authMiddleware, async (req, res) => {
    try {
        // middleware
        const userId = req.user.userId;

        const userQuery = 'SELECT id, name, email, plan FROM users WHERE id = $1';
        const result = await db.query(userQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const userProfile = result.rows[0];
        
        res.status(200).json({ 
            message: 'Acesso a rota protegida bem-sucedido!',
            user: userProfile 
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ROTA PARA LISTAR CATEGORIAS DE DOCUMENTOS
app.get('/categories', authMiddleware, async (req, res) => {
    try {
        // Query para buscar todas as categorias no banco de dados, ordenadas por nome
        const query = 'SELECT id, name, description FROM document_categories ORDER BY name ASC';
        
        const result = await db.query(query);

        // Retorna a lista de categorias como um array JSON
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// LISTAR DOCUMENTOS DE UMA CATEGORIA ESPECÍFICA
app.get('/categories/:categoryId/documents', authMiddleware, async (req, res) => {
    try {
        // Extrai o ID da categoria dos parâmetros da URL
        const { categoryId } = req.params;

        // Query para buscar os documentos que pertencem à categoria especificada
        // Selecionamos apenas id, title e description para a lista (o conteúdo completo virá depois)
        const query = `
            SELECT id, title, description 
            FROM documents 
            WHERE category_id = $1 
            ORDER BY title ASC
        `;
        
        const result = await db.query(query, [categoryId]);

        // Retorna a lista de documentos como um array JSON
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar documentos da categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// BUSCAR OS DETALHES DE UM ÚNICO DOCUMENTO (O TEMPLATE)
app.get('/documents/:documentId', authMiddleware, async (req, res) => {
    try {
        // Extrai o ID do documento dos parâmetros da URL
        const { documentId } = req.params;

        // Query para buscar um documento específico pelo seu ID
        const query = `
            SELECT id, title, description, content_template 
            FROM documents 
            WHERE id = $1
        `;
        
        const result = await db.query(query, [documentId]);

        // Verifica se o documento foi encontrado
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento não encontrado.' });
        }

        // Retorna o documento encontrado (o primeiro e único item do array)
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar o documento:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GERAR UM DOCUMENTO PREENCHIDO COM DADOS DINÂMICOS
app.post('/documents/:documentId/generate', authMiddleware, async (req, res) => {
    try {
        // Pega o ID do documento da URL
        const { documentId } = req.params;
        // Pega os dados para preenchimento do corpo da requisição
        const placeholders = req.body;

        // 1. Busca o template do documento no banco de dados
        const query = 'SELECT content_template FROM documents WHERE id = $1';
        const result = await db.query(query, [documentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Modelo de documento não encontrado.' });
        }

        let generatedContent = result.rows[0].content_template;

        // 2. O "Motor" de Substituição: Itera sobre os dados enviados e substitui no template
        for (const key in placeholders) {
            // Cria uma Expressão Regular para encontrar todas as ocorrências de {{key}}
            const regex = new RegExp('{{' + key + '}}', 'g');
            generatedContent = generatedContent.replace(regex, placeholders[key]);
        }

        // 3. Retorna o conteúdo final gerado
        res.status(200).json({ generated_content: generatedContent });

    } catch (error) {
        console.error('Erro ao gerar o documento:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor back-end rodando em http://localhost:${port}`);
});