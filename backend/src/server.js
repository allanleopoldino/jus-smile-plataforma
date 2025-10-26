const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./services/db');
const authMiddleware = require('./middleware/auth');
const cors = require('cors');
const logger = require('./logger');

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
app.post('/signup', async (req, res, next) => {
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
        next(error);
    }
});

// NOVA ROTA DE LOGIN DE USUÁRIO
app.post('/login', async (req, res, next) => { 
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
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Envia o token de volta para o cliente
        res.status(200).json({ message: 'Login bem-sucedido!', token: token });

    } catch (error) {
        next(error);
    }
});

app.get('/profile', authMiddleware, async (req, res, next) => {
    try {
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
        next(error);
    }
});

// ROTA PARA LISTAR ESPECIALIDADES
app.get('/specialties', authMiddleware, async (req, res, next) => {
    try {
        const query = 'SELECT id, name, description FROM specialties ORDER BY name ASC';
        const result = await db.query(query);
        res.status(200).json(result.rows);

    } catch (error) {
        next(error);
    }
});

// LISTAR PROCEDIMENTOS DE UMA ESPECIALIDADE ESPECÍFICA
app.get('/specialties/:specialtyId/procedures', authMiddleware, async (req, res, next) => {
    try {
        const { specialtyId } = req.params;
        const query = `
            SELECT id, title, description 
            FROM procedures 
            WHERE specialty_id = $1 
            ORDER BY title ASC
        `;
        const result = await db.query(query, [specialtyId]);
        res.status(200).json(result.rows);

    } catch (error) {
        next(error);
    }
});

// BUSCAR OS DETALHES DE UM ÚNICO PROCEDIMENTO
app.get('/procedures/:procedureId', authMiddleware, async (req, res, next) => {
    try {
        const { procedureId } = req.params;
        const query = `
            SELECT id, title, description, content_template 
            FROM procedures 
            WHERE id = $1
        `;
        const result = await db.query(query, [procedureId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento não encontrado.' });
        }
        res.status(200).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

// GERAR UM DOCUMENTO PREENCHIDO COM DADOS DINÂMICOS
app.post('/procedures/:procedureId/generate', authMiddleware, async (req, res, next) => {
    try {
        const { procedureId } = req.params;
        const placeholders = req.body;
        const query = 'SELECT content_template FROM procedures WHERE id = $1';
        const result = await db.query(query, [procedureId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Modelo de documento não encontrado.' });
        }

        let generatedContent = result.rows[0].content_template;

        for (const key in placeholders) {
            const regex = new RegExp('{{' + key + '}}', 'g');
            generatedContent = generatedContent.replace(regex, placeholders[key]);
        }
        res.status(200).json({ generated_content: generatedContent });

    } catch (error) {
        next(error);
    }
});


// --- MIDDLEWARE DE ERRO GLOBAL ---
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);

    res.status(500).json({
        error: 'Ocorreu um erro inesperado no servidor.',
    });
});

app.listen(port, () => {
    logger.info(`Servidor back-end rodando em http://localhost:${port}`); 
});