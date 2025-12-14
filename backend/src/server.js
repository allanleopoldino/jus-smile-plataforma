const express = require('express');
const fs = require('fs').promises; // Necessário para ler os arquivos HTML
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer'); // Necessário para o PDF
const db = require('./services/db');
const authMiddleware = require('./middleware/auth');
const cors = require('cors');
const logger = require('./logger');

// variáveis de ambiente .env
require('dotenv').config();

// Inicialização do aplicativo Express
const app = express();
const port = process.env.PORT || 3001;

// Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ROTA DE CADASTRO DE USUÁRIO
app.post('/signup', async (req, res, next) => {
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO users (name, email, password_hash, plan) VALUES ($1, $2, $3, $4) RETURNING id';
        const values = [name, email, hashedPassword, plan || 'Essencial'];

        const result = await db.query(query, values);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.rows[0].id });
    } catch (error) {
        next(error);
    }
});

// ROTA DE LOGIN
app.post('/login', async (req, res, next) => { 
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login bem-sucedido!', token: token });

    } catch (error) {
        next(error);
    }
});

// ROTA DE PERFIL (Protegida)
app.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userQuery = 'SELECT id, name, email, plan FROM users WHERE id = $1';
        const result = await db.query(userQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.status(200).json({
            message: 'Acesso a rota protegida bem-sucedido!',
            user: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

// LISTAR ESPECIALIDADES
app.get('/specialties', authMiddleware, async (req, res, next) => {
    try {
        const query = 'SELECT id, name, description FROM specialties ORDER BY name ASC';
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// LISTAR PROCEDIMENTOS DE UMA ESPECIALIDADE
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

// BUSCAR DETALHES DO PROCEDIMENTO (Lendo arquivo HTML)
app.get('/procedures/:procedureId', authMiddleware, async (req, res, next) => {
    try {
        const { procedureId } = req.params;

        // 1. Busca o nome do arquivo no banco
        const query = `
            SELECT id, title, description, template_filename 
            FROM procedures 
            WHERE id = $1
        `;
        const result = await db.query(query, [procedureId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento não encontrado.' });
        }

        const procedure = result.rows[0];

        // 2. Lê o arquivo HTML da pasta templates
        const templatePath = path.join(__dirname, 'templates', procedure.template_filename);
        const htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        // 3. Retorna os dados + o conteúdo HTML para o front extrair os placeholders
        res.status(200).json({
            ...procedure,
            content_template: htmlTemplate
        });

    } catch (error) {
        next(error);
    }
});

// GERAR PDF (Usando Puppeteer e Templates HTML)
app.post('/procedures/:procedureId/generate-pdf', authMiddleware, async (req, res, next) => {
    let browser;
    try {
        const { procedureId } = req.params;
        const placeholders = req.body;

        // 1. Busca nome do arquivo
        const query = 'SELECT template_filename FROM procedures WHERE id = $1';
        const result = await db.query(query, [procedureId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Modelo de documento não encontrado.' });
        }

        // 2. Lê o arquivo HTML
        const templatePath = path.join(__dirname, 'templates', result.rows[0].template_filename);
        let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        // 3. Substitui os placeholders
        for (const key in placeholders) {
            const regex = new RegExp('{{' + key + '}}', 'g');
            htmlTemplate = htmlTemplate.replace(regex, placeholders[key]);
        }

        // 4. Gera o PDF com Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' }
        });

        // 5. Envia o PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=contrato.pdf');
        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    } finally {
        if (browser) await browser.close();
    }
});

// ROTA PARA CADASTRAR PACIENTES
app.post('/patients', authMiddleware, async (req, res, next) => {
    const { name, cpf, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode } = req.body;

    if (!name || !cpf) {
        return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
    }

    try {
        // 1. Verifica se CPF já existe para evitar duplicidade
        const checkCpf = await db.query('SELECT id FROM patients WHERE cpf = $1', [cpf]);
        if (checkCpf.rows.length > 0) {
            return res.status(400).json({ error: 'Este CPF já está cadastrado.' });
        }
        // 2. Insere o paciente no banco
        const query = `
            INSERT INTO patients 
            (name, cpf, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING id
        `;
        const values = [name, cpf, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode];

        const result = await db.query(query, values);
        
        res.status(201).json({ 
            message: 'Paciente cadastrado com sucesso!', 
            patientId: result.rows[0].id 
        });

    } catch (error) {
        next(error);
    }
});

// --- ROTAS DE GESTÃO DE PACIENTES (CRUD) ---

// 1. LISTAR TODOS OS PACIENTES
app.get('/patients', authMiddleware, async (req, res, next) => {
    try {
        // Busca todos, ordenados pelo nome
        const query = 'SELECT * FROM patients ORDER BY name ASC';
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 2. ATUALIZAR UM PACIENTE (EDITAR)
app.put('/patients/:id', authMiddleware, async (req, res, next) => {
    const { id } = req.params;
    const { name, cpf, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode } = req.body;

    if (!name || !cpf) {
        return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
    }

    try {
        // Verifica se o CPF pertence a OUTRA pessoa (evitar duplicidade na edição)
        const checkCpf = await db.query('SELECT id FROM patients WHERE cpf = $1 AND id != $2', [cpf, id]);
        if (checkCpf.rows.length > 0) {
            return res.status(400).json({ error: 'Este CPF já está em uso por outro paciente.' });
        }

        const query = `
            UPDATE patients 
            SET name=$1, cpf=$2, email=$3, phone=$4, address_street=$5, address_number=$6, address_neighborhood=$7, address_city=$8, address_state=$9, address_zipcode=$10
            WHERE id=$11
        `;
        const values = [name, cpf, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode, id];

        await db.query(query, values);
        res.status(200).json({ message: 'Paciente atualizado com sucesso!' });

    } catch (error) {
        next(error);
    }
});

// 3. EXCLUIR UM PACIENTE
app.delete('/patients/:id', authMiddleware, async (req, res, next) => {
    const { id } = req.params;
    try {
        // Executa a exclusão
        await db.query('DELETE FROM patients WHERE id = $1', [id]);
        res.status(200).json({ message: 'Paciente excluído com sucesso.' });
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