import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { hashPassword, verifyPassword, signJwtToken, verifyJwtToken } from './security.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Garante conexão com o MongoDB em ambientes Serverless (Vercel) e força o banco oficial `sport_maker_db`
const MONGODB_DB_NAME = (process.env.MONGODB_DB_NAME || 'sport_maker_db').trim();
const PORT = process.env.PORT || 5000;
const EXPECTED_API_KEY = (
  process.env.MONGODB_API_KEY ||
  process.env.VITE_MONGODB_API_KEY ||
  ''
).trim();

const rawMongoUri = (process.env.MONGODB_URI || '')
  .trim()
  .replace(/^['"]|['"]$/g, '');
const MONGODB_URI = rawMongoUri.replace(/:<([^>]+)>@/, ':$1@');

let connectionPromise = null;
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!MONGODB_URI) {
    throw new Error('Variável de ambiente MONGODB_URI não está configurada.');
  }
  if (connectionPromise && mongoose.connection.readyState === 2) {
    return connectionPromise;
  }
  connectionPromise = mongoose
    .connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10000,
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });
  return connectionPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Erro ao conectar no MongoDB Atlas:', err.message);
    res.status(500).json({
      ok: false,
      message: `Não foi possível conectar ao servidor do MongoDB: ${err.message}`,
    });
  }
});

// Schema Mongoose para Atletas e Proprietários de Arena com `passwordHash` criptografado e Assinatura PRO
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    googleId: { type: String, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    role: { type: String, enum: ['player', 'owner'], default: 'player', required: true },
    arenaName: { type: String, default: null },
    cnpj: { type: String, default: null },
    favoriteSport: { type: String, default: 'society' },
    positionRole: { type: String, default: 'Atleta Sport Maker' },
    customTag: { type: String, default: 'Atleta Iniciante' },
    cardThemeId: { type: String, default: 'neon-lime' },
    ovr: { type: Number, default: 0 },
    pixKey: { type: String, default: '' },
    avatar: { type: String, default: '' },
    avatarScale: { type: Number, default: 100 },
    // Controle de Assinatura PRO (Liberado apenas após confirmação de pagamento)
    isPro: { type: Boolean, default: false },
    proPlan: { type: String, enum: [null, 'monthly', 'annual'], default: null },
    proStatus: {
      type: String,
      enum: ['inactive', 'pending_payment', 'active'],
      default: 'inactive',
    },
    proActivatedAt: { type: Date, default: null },
    proTransactionId: { type: String, default: null },

    // Geolocalização + Termo de Consentimento LGPD do Usuário
    locationConsentAccepted: { type: Boolean, default: false },
    locationConsentAcceptedAt: { type: Date, default: null },
    userLocation: {
      mode: { type: String, enum: ['gps', 'manual', 'none'], default: 'none' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      label: { type: String, default: '' },
      neighborhood: { type: String, default: '' },
      city: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
    },

    // Estatísticas reais e Rede de Amigos do Atleta (iniciam zeradas em novas contas)
    matchesCount: { type: Number, default: 0 },
    mvpCount: { type: Number, default: 0 },
    fairPlay: { type: Number, default: 0 },
    stats: {
      ritmo: { type: Number, default: 0 },
      finalizacao: { type: Number, default: 0 },
      passe: { type: Number, default: 0 },
      defesa: { type: Number, default: 0 },
      fisico: { type: Number, default: 0 },
      fairPlay: { type: Number, default: 0 },
    },
    friends: { type: [String], default: [] },
    friendRequestsReceived: { type: [String], default: [] },
    friendRequestsSent: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Schema Mongoose para Partidas / Lobbies dos Atletas
const MatchSchema = new mongoose.Schema(
  {
    hostId: { type: String, required: true, index: true },
    hostName: { type: String, required: true },
    hostAvatar: { type: String, default: '' },
    hostRating: { type: Number, default: 88 },
    isProHost: { type: Boolean, default: false },
    freeBallIncluded: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    bookingId: { type: String, default: '' },
    arenaId: { type: String, default: '' },
    arena: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    distance: { type: String, default: '1.5 km' },
    time: { type: String, required: true },
    totalSlots: { type: Number, default: 14 },
    filledSlots: { type: Number, default: 1 },
    pricePerPlayer: { type: Number, default: 20 },
    neededPositions: { type: [String], default: [] },
    extras: { type: [String], default: [] },
    isPublicLobby: { type: Boolean, default: true },
    splitWithFriends: { type: Boolean, default: false },
    status: { type: String, default: 'Confirmada' },
    invitedUserIds: { type: [String], default: [] },
    participants: {
      type: [
        {
          userId: { type: String },
          name: { type: String },
          avatar: { type: String },
          ovr: { type: Number, default: 0 },
          role: { type: String, default: 'Solicitante' },
          status: { type: String, default: 'Confirmada' },
          requestStatus: {
            type: String,
            enum: ['approved', 'pending', 'awaiting_payment', 'rejected'],
            default: 'approved',
          },
          isPro: { type: Boolean, default: false },
          paymentConfirmed: { type: Boolean, default: false },
          paymentTransactionId: { type: String, default: '' },
          evaluated: { type: Boolean, default: false },
          evaluationStars: { type: Number, default: null },
          matchScore: { type: Number, default: null },
          matchBadges: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    evaluationSummary: {
      arenaStars: { type: Number, default: null },
      arenaTierLabel: { type: String, default: '' },
      arenaComment: { type: String, default: '' },
      mvpPlayerId: { type: String, default: '' },
      mvpPlayerName: { type: String, default: '' },
      mvpPlayerAvatar: { type: String, default: '' },
      mvpScore: { type: Number, default: null },
      playerRatings: {
        type: [
          {
            id: { type: String },
            name: { type: String },
            avatar: { type: String },
            score: { type: Number },
            badges: { type: [String], default: [] },
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
);

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

// Schema Mongoose para Arenas dos Proprietários (Integrado ao MongoDB Atlas)
const ArenaSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, default: '' },
    sport: {
      type: String,
      enum: ['society', 'beachtennis', 'padel', 'futevolei'],
      default: 'society',
    },
    sportLabel: { type: String, default: 'Futebol Society • Grama FIFA Pro' },
    distance: { type: String, default: '1.5 km' },
    neighborhood: { type: String, default: 'São Paulo, SP' },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: -23.5955 },
      lng: { type: Number, default: -46.6865 },
    },
    openingHours: { type: String, default: 'Seg a Dom • 07:00 às 00:00' },
    description: {
      type: String,
      default:
        'Complexo esportivo completo com quadras iluminadas, vestiários e área de convivência pós-jogo.',
    },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    reviews: {
      type: [
        {
          userId: { type: String, default: '' },
          userName: { type: String, default: 'Atleta Sport Maker' },
          userAvatar: { type: String, default: '' },
          stars: { type: Number, required: true },
          tierLabel: { type: String, default: '' },
          comment: { type: String, default: '' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    pricePerHour: { type: Number, default: 200 },
    pricePerPlayer: { type: Number, default: 20 },
    cancellationDeadlineHours: { type: Number, default: 0 },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
    },
    gallery: {
      type: [String],
      default: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
      ],
    },
    verified: { type: Boolean, default: true },
    featured: { type: Boolean, default: true },
    amenities: {
      type: [String],
      default: ['Estacionamento', 'Churrasqueira', 'Bar & Restaurante', 'Vestiário VIP', 'Wi-Fi'],
    },
    onSiteServices: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          badge: { type: String },
        },
      ],
      default: [
        {
          title: 'Restaurante & Sports Bar no Local',
          description: 'Venda de bebidas geladas, porções, churrasco e isotônicos.',
          badge: 'Gastronomia & Bebidas',
        },
      ],
    },
    courts: {
      type: [
        {
          id: { type: String },
          name: { type: String },
          sport: { type: String },
          surface: { type: String },
          covered: { type: Boolean, default: true },
          pricePerHour: { type: Number, default: 200 },
        },
      ],
      default: [
        {
          id: 'c1',
          name: 'Quadra 1 • Principal',
          sport: 'Futebol Society (7x7)',
          surface: 'Grama Sintética 60mm FIFA Pro',
          covered: true,
          pricePerHour: 200,
        },
      ],
    },
    products: {
      type: [
        {
          id: { type: String },
          name: { type: String },
          price: { type: Number, default: 0 },
          tag: { type: String, default: 'Extra' },
        },
      ],
      default: [
        { id: 'p1', name: 'Kit Churrasco Pós-Jogo (Carvão + Gelo)', price: 65, tag: '3º Tempo' },
        { id: 'p2', name: 'Locação Bola Oficial Penalty S11', price: 15, tag: 'Equipamento' },
      ],
    },
    slots: {
      type: [
        {
          time: { type: String },
          status: { type: String, enum: ['available', 'booked', 'blocked'], default: 'available' },
          highlight: { type: String, default: '' },
          discount: { type: String, default: '' },
        },
      ],
      default: [
        { time: '18:00', status: 'available', highlight: '' },
        { time: '19:00', status: 'available', highlight: 'Horário Nobre' },
        { time: '20:00', status: 'available', highlight: '' },
        { time: '21:00', status: 'available', highlight: '' },
        { time: '22:00', status: 'available', discount: '-15%' },
      ],
    },
  },
  { timestamps: true }
);

const Arena = mongoose.models.Arena || mongoose.model('Arena', ArenaSchema);

// Schema Mongoose para Agendamentos / Reservas (Quadro de Horários e Painel de Ganhos)
const BookingSchema = new mongoose.Schema(
  {
    arenaId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    arenaName: { type: String, required: true },
    courtId: { type: String, default: 'c1' },
    courtName: { type: String, default: 'Quadra Principal' },
    surface: { type: String, default: 'Grama Sintética' },
    sport: { type: String, default: 'Futebol Society' },
    dateLabel: { type: String, default: 'Hoje' },
    slotTime: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '(11) 99876-5432' },
    customerEmail: { type: String, default: '' },
    isProCustomer: { type: Boolean, default: false },
    courtAmount: { type: Number, required: true },
    productsAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    productsList: { type: [String], default: [] },
    paymentMethod: { type: String, enum: ['Pix', 'Cartão', 'Presencial'], default: 'Pix' },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled', 'manual_block'],
      default: 'confirmed',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// Schema Mongoose para Notificações dos Usuários (Cancelamentos, Reembolsos, Convites)
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    matchId: { type: String, default: '' },
    arenaName: { type: String, default: '' },
    matchTitle: { type: String, default: '' },
    dateLabel: { type: String, default: '' },
    slotTime: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

function sanitizeUser(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.passwordHash;
  delete obj.password;
  return obj;
}

// Middleware de validação da API Key do MongoDB
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['api-key'] || req.headers['x-mongodb-api-key'];
  if (apiKey && apiKey !== EXPECTED_API_KEY) {
    return res.status(401).json({ message: 'API Key do MongoDB inválida.' });
  }
  next();
});

// GET /api/health - Status da conexão com o cluster footplus.yliizzy.mongodb.net
app.get('/api/health', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    ok: mongoose.connection.readyState === 1,
    mongoState: stateMap[mongoose.connection.readyState] || 'unknown',
    cluster: 'footplus.yliizzy.mongodb.net',
    database: mongoose.connection.name || 'sport_maker_db',
    encryption: 'scrypt-salt-timingSafeEqual + JWT-HS256',
  });
});

async function sendConfirmationEmail(toEmail, userName, verifyUrl) {
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpFrom = (process.env.SMTP_FROM || smtpUser || 'no-reply@sportmaker.app').trim();

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`📧 [Sport Maker Dev] Link de confirmação para ${toEmail}: ${verifyUrl}`);
    return { sent: false, mode: 'dev_console' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"Sport Maker" <${smtpFrom}>`,
    to: toEmail,
    subject: 'Confirme seu e-mail no Sport Maker ⚽',
    html: `
      <div style="font-family: Arial, sans-serif; background: #07090E; color: #F8FAFC; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto;">
        <h1 style="color: #CCFF00; margin: 0 0 12px;">SPORT MAKER</h1>
        <p style="font-size: 15px;">Olá, <strong>${userName}</strong>!</p>
        <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
          Obrigado por criar sua conta no Sport Maker. Clique no botão abaixo para confirmar seu endereço de e-mail:
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${verifyUrl}" style="display: inline-block; background: #CCFF00; color: #07090E; font-weight: 800; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px;">
            Confirmar meu E-mail
          </a>
        </div>
        <p style="font-size: 12px; color: #64748B;">
          Ou copie e cole este link no navegador:<br />
          <a href="${verifyUrl}" style="color: #CCFF00;">${verifyUrl}</a>
        </p>
      </div>
    `,
  });

  return { sent: true, mode: 'smtp' };
}

// POST /api/auth/register - Criptografa a senha com scrypt + salt aleatório antes de salvar no MongoDB
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, arenaName, cnpj, favoriteSport, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado no banco de dados.' });
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      role: role || 'player',
      arenaName: role === 'owner' ? arenaName : null,
      cnpj: role === 'owner' ? cnpj : null,
      favoriteSport: role === 'player' ? favoriteSport || 'society' : null,
      ovr: 0,
      avatar: avatar || '',
    });

    const appOrigin = (
      process.env.APP_URL ||
      req.headers.origin ||
      'http://localhost:5173'
    ).replace(/\/+$/, '');
    const verifyUrl = `${appOrigin}/confirmar-email?token=${verificationToken}`;

    const mailResult = await sendConfirmationEmail(
      normalizedEmail,
      user.name,
      verifyUrl
    ).catch((mailErr) => {
      console.error('⚠️ Erro ao enviar e-mail de confirmação:', mailErr.message);
      return { sent: false, mode: 'error' };
    });

    const token = signJwtToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
      emailVerificationSent: mailResult.sent,
      devVerificationUrl: mailResult.sent ? undefined : verifyUrl,
      mode: 'mongodb_atlas_live',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao registrar no MongoDB.' });
  }
});

// GET /api/auth/verify-email?token=... - Confirma o e-mail do usuário pelo link enviado
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({ message: 'Token de confirmação ausente.' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Link de confirmação inválido ou expirado.',
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({
      ok: true,
      message: 'E-mail confirmado com sucesso! Sua conta já está verificada.',
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao confirmar e-mail.' });
  }
});

// POST /api/auth/google - Autentica ou cria conta usando ID Token do Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, role } = req.body || {};
    if (!credential) {
      return res.status(400).json({ message: 'Credencial do Google não recebida.' });
    }

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    const googleData = await googleRes.json().catch(() => ({}));
    if (!googleRes.ok || !googleData.email) {
      return res.status(401).json({ message: 'Token do Google inválido ou expirado.' });
    }

    const expectedClientId = (
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      ''
    ).trim();
    if (expectedClientId && googleData.aud !== expectedClientId) {
      return res.status(401).json({ message: 'Client ID do Google não corresponde.' });
    }

    const normalizedEmail = String(googleData.email).toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
      user = await User.create({
        name: googleData.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: randomPasswordHash,
        googleId: googleData.sub || null,
        emailVerified: true,
        role: role === 'owner' ? 'owner' : 'player',
        favoriteSport: role === 'owner' ? null : 'society',
        ovr: 0,
        avatar: googleData.picture || '',
      });
    } else {
      let dirty = false;
      if (!user.emailVerified) {
        user.emailVerified = true;
        dirty = true;
      }
      if (!user.googleId && googleData.sub) {
        user.googleId = googleData.sub;
        dirty = true;
      }
      if (!user.avatar && googleData.picture) {
        user.avatar = googleData.picture;
        dirty = true;
      }
      if (dirty) await user.save();
    }

    const token = signJwtToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return res.json({
      user: sanitizeUser(user),
      token,
      mode: 'google_oauth',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao autenticar com Google.' });
  }
});

// POST /api/auth/login - Verifica o hash criptográfico (timingSafeEqual) e emite JWT assinado
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Informe seu e-mail e senha.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        message: `Esta conta pertence ao perfil de ${
          user.role === 'owner' ? 'Proprietário de Arena' : 'Atleta'
        }. Alterne a aba acima para entrar.`,
      });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const token = signJwtToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return res.json({
      user: sanitizeUser(user),
      token,
      mode: 'mongodb_atlas_live',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao autenticar no MongoDB.' });
  }
});

// GET /api/auth/me - Valida o token JWT e retorna o documento atualizado do MongoDB
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Sessão expirada ou token inválido.' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile - Atualiza foto, apelido (nickname), nome e preferências no MongoDB
app.put('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = token ? verifyJwtToken(token) : null;
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const {
      name,
      nickname,
      email,
      avatar,
      avatarScale,
      positionRole,
      customTag,
      cardThemeId,
      pixKey,
      locationConsentAccepted,
      userLocation,
    } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof nickname === 'string') updates.nickname = nickname.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: decoded.sub },
      });
      if (existing) {
        return res.status(409).json({ message: 'Este e-mail já está em uso por outra conta.' });
      }
      updates.email = normalizedEmail;
    }
    if (typeof avatar === 'string') updates.avatar = avatar.trim();
    if (typeof avatarScale === 'number' && !Number.isNaN(avatarScale)) {
      updates.avatarScale = Math.max(60, Math.min(150, Math.round(avatarScale)));
    }
    if (typeof positionRole === 'string') updates.positionRole = positionRole;
    if (typeof customTag === 'string') updates.customTag = customTag;
    if (typeof cardThemeId === 'string') updates.cardThemeId = cardThemeId;
    if (typeof pixKey === 'string') updates.pixKey = pixKey;
    if (typeof locationConsentAccepted === 'boolean') {
      updates.locationConsentAccepted = locationConsentAccepted;
      if (locationConsentAccepted) {
        updates.locationConsentAcceptedAt = new Date();
      }
    }
    if (userLocation && typeof userLocation === 'object') {
      updates.userLocation = {
        mode: userLocation.mode || 'manual',
        lat: typeof userLocation.lat === 'number' ? userLocation.lat : null,
        lng: typeof userLocation.lng === 'number' ? userLocation.lng : null,
        label: userLocation.label || '',
        neighborhood: userLocation.neighborhood || '',
        city: userLocation.city || '',
        updatedAt: new Date(),
      };
    }

    const updatedUser = await User.findByIdAndUpdate(decoded.sub, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao atualizar perfil.' });
  }
});

// POST /api/subscription/confirm-payment - Valida confirmação de pagamento e libera benefícios PRO
app.post('/api/subscription/confirm-payment', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = token ? verifyJwtToken(token) : null;
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Faça login para assinar o Sport Maker PRO.' });
    }

    const { planId, paymentMethod, paymentConfirmed, transactionCode } = req.body;

    if (!['monthly', 'annual'].includes(planId)) {
      return res.status(400).json({ message: 'Plano inválido. Escolha Mensal (R$ 24,90) ou Anual (R$ 199,90).' });
    }

    // Certifica que os benefícios só sejam liberados quando paymentConfirmed === true
    if (paymentConfirmed !== true || !transactionCode) {
      return res.status(402).json({
        message: 'Aguardando confirmação do pagamento pelo gateway para liberar os benefícios PRO.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.sub,
      {
        isPro: true,
        proPlan: planId,
        proStatus: 'active',
        proActivatedAt: new Date(),
        proTransactionId: transactionCode,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json({
      message: 'Pagamento confirmado! Seus benefícios Sport Maker PRO foram liberados.',
      user: sanitizeUser(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao confirmar assinatura PRO.' });
  }
});

// POST /api/subscription/cancel - Cancela a assinatura Sport Maker PRO do usuário
app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = token ? verifyJwtToken(token) : null;
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.sub,
      {
        isPro: false,
        proPlan: null,
        proStatus: 'inactive',
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json({
      ok: true,
      message: 'Assinatura Sport Maker PRO cancelada com sucesso.',
      user: sanitizeUser(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao cancelar assinatura PRO.' });
  }
});

// PUT /api/auth/password - Altera a senha do usuário validando a senha atual
app.put('/api/auth/password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = token ? verifyJwtToken(token) : null;
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Informe a senha atual e a nova senha.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'A senha atual está incorreta.' });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return res.json({ ok: true, message: 'Senha alterada com sucesso!' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao alterar senha.' });
  }
});

// DELETE /api/auth/account - Exige senha, cancela assinatura PRO se ativa e apaga a conta permanentemente
app.delete('/api/auth/account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = token ? verifyJwtToken(token) : null;
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: 'Digite sua senha para confirmar a exclusão da conta.' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Senha incorreta. A conta não foi excluída.' });
    }

    // Se tiver assinatura PRO ativa, cancela antes de remover o registro
    if (user.isPro || user.proStatus === 'active') {
      user.isPro = false;
      user.proPlan = null;
      user.proStatus = 'inactive';
      await user.save();
    }

    const uid = String(user._id);
    await User.updateMany(
      {},
      {
        $pull: {
          friends: uid,
          friendRequestsReceived: uid,
          friendRequestsSent: uid,
        },
      }
    );

    await User.findByIdAndDelete(user._id);

    return res.json({
      ok: true,
      message: 'Assinatura cancelada e conta apagada permanentemente.',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao apagar conta.' });
  }
});

// Helper: Inicializa Arena padrão no MongoDB caso o proprietário ainda não tenha nenhuma (sem reservas fictícias)
async function ensureOwnerDefaultArenaAndBookings(ownerUser) {
  const ownerId = String(ownerUser._id);
  let arenas = await Arena.find({ ownerId }).sort({ createdAt: -1 });

  if (arenas.length === 0) {
    const defaultArena = await Arena.create({
      ownerId,
      ownerEmail: ownerUser.email,
      name: ownerUser.arenaName || 'Nova Arena Esportiva',
      cnpj: ownerUser.cnpj || '',
      sport: 'society',
      sportLabel: 'Futebol Society • Grama FIFA Pro',
      distance: '1.2 km',
      neighborhood: 'São Paulo, SP',
      address: '',
      openingHours: 'Seg a Dom • 07:00 às 00:00',
      description:
        'Complexo esportivo com quadras iluminadas, vestiários e área de convivência pós-jogo.',
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      pricePerHour: 200,
      pricePerPlayer: 20,
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
      ],
      amenities: [
        'Estacionamento',
        'Churrasqueira',
        'Bar & Restaurante',
        'Vestiário',
        'Wi-Fi',
      ],
      onSiteServices: [
        {
          title: 'Restaurante & Sports Bar no Local',
          description:
            'Porções, bebidas geladas, isotônicos e área de convivência.',
          badge: 'Gastronomia & Bebidas',
        },
      ],
      courts: [
        {
          id: 'c1',
          name: 'Quadra 1 • Principal',
          sport: 'Futebol Society (7x7)',
          surface: 'Grama Sintética 60mm',
          covered: true,
          pricePerHour: 200,
        },
      ],
      products: [
        { id: 'p1', name: 'Kit Churrasco Pós-Jogo (Carvão + Gelo)', price: 65, tag: '3º Tempo' },
        { id: 'p2', name: 'Locação Bola Oficial Penalty S11', price: 15, tag: 'Equipamento' },
      ],
      slots: [
        { time: '18:00', status: 'available', highlight: '', discount: '' },
        { time: '19:00', status: 'available', highlight: 'Horário Nobre', discount: '' },
        { time: '20:00', status: 'available', highlight: 'Horário Nobre', discount: '' },
        { time: '21:00', status: 'available', highlight: '', discount: '' },
        { time: '22:00', status: 'available', highlight: '', discount: '' },
      ],
    });

    arenas = [defaultArena];
  }

  return arenas;
}

function getAuthenticatedUserFromReq(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifyJwtToken(token);
}

// Cache em memória de curta duração no servidor (evita múltiplas leituras repetidas no MongoDB Atlas)
let serverArenasCache = { data: null, expiresAt: 0 };

function invalidateServerArenasCache() {
  serverArenasCache = { data: null, expiresAt: 0 };
}

// Helper: Converte qualquer dateLabel ("Hoje (23/11/2026)", "Amanhã (24/11)", "2026-11-23", "Hoje")
// na data ISO exata YYYY-MM-DD usando createdAt como referência caso não haja números na string
function resolveBookingIsoDate(dateLabel = '', createdAt = null) {
  const raw = String(dateLabel || '').trim();
  const base =
    createdAt && !Number.isNaN(new Date(createdAt).getTime())
      ? new Date(createdAt)
      : new Date();

  // 1. DD/MM/YYYY
  const fullBr = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (fullBr) {
    const [, dd, mm, yyyy] = fullBr;
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2. YYYY-MM-DD
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  // 3. DD/MM
  const shortBr = raw.match(/(\d{2})\/(\d{2})/);
  if (shortBr) {
    const [, dd, mm] = shortBr;
    return `${base.getFullYear()}-${mm}-${dd}`;
  }

  // 4. Apenas "Amanhã" ou "Hoje" sem números -> usa a data em que o agendamento foi criado
  const lower = raw.toLowerCase();
  const target = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (lower.includes('amanh')) {
    target.setDate(target.getDate() + 1);
  }
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getServerTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// GET /api/arenas - Lista arenas cadastradas no MongoDB + horários já reservados (bookedSlots apenas de hoje em diante)
app.get('/api/arenas', async (req, res) => {
  try {
    const now = Date.now();
    if (serverArenasCache.data && now < serverArenasCache.expiresAt) {
      res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
      return res.json({ arenas: serverArenasCache.data, cached: true });
    }

    const [arenas, activeBookings] = await Promise.all([
      Arena.find().sort({ createdAt: -1 }).lean(),
      Booking.find({ bookingStatus: { $ne: 'cancelled' } })
        .select('arenaId courtId courtName dateLabel slotTime createdAt')
        .lean(),
    ]);

    const todayIso = getServerTodayIso();
    const bookingsByArena = new Map();
    for (const b of activeBookings) {
      const isoDate = resolveBookingIsoDate(b.dateLabel, b.createdAt);
      // Ignora agendamentos de dias anteriores para nunca travar horários de dias seguintes
      if (isoDate < todayIso) continue;

      const aid = String(b.arenaId);
      if (!bookingsByArena.has(aid)) {
        bookingsByArena.set(aid, []);
      }
      bookingsByArena.get(aid).push({
        courtId: b.courtId || 'c1',
        courtName: b.courtName || '',
        dateLabel: b.dateLabel || isoDate,
        isoDate,
        slotTime: b.slotTime,
      });
    }

    const enrichedArenas = arenas.map((a) => ({
      ...a,
      bookedSlots: bookingsByArena.get(String(a._id)) || [],
    }));

    serverArenasCache = {
      data: enrichedArenas,
      expiresAt: now + 15 * 1000,
    };
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    return res.json({ arenas: enrichedArenas });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar arenas.' });
  }
});

// GET /api/arenas/:id/booked-slots - Consulta leve e em tempo real (sem cache) dos horários já ocupados da arena
app.get('/api/arenas/:id/booked-slots', async (req, res) => {
  try {
    const arenaId = String(req.params.id || '').trim();
    if (!arenaId) {
      return res.json({ bookedSlots: [] });
    }
    const activeBookings = await Booking.find(
      { arenaId, bookingStatus: { $ne: 'cancelled' } },
      { courtId: 1, courtName: 1, dateLabel: 1, slotTime: 1, createdAt: 1 }
    ).lean();

    const todayIso = getServerTodayIso();
    const bookedSlots = [];
    for (const b of activeBookings) {
      const isoDate = resolveBookingIsoDate(b.dateLabel, b.createdAt);
      if (isoDate < todayIso) continue;
      bookedSlots.push({
        courtId: b.courtId || 'c1',
        courtName: b.courtName || '',
        dateLabel: b.dateLabel || isoDate,
        isoDate,
        slotTime: b.slotTime,
      });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({ bookedSlots });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar horários ocupados.' });
  }
});

// GET /api/owner/dashboard - Retorna arenas do proprietário, quadro de horários e métricas financeiras do MongoDB
app.get('/api/owner/dashboard', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const ownerUser = await User.findById(decoded.sub);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Proprietário não encontrado.' });
    }

    const arenas = await ensureOwnerDefaultArenaAndBookings(ownerUser);
    const bookings = await Booking.find({ ownerId: String(ownerUser._id) }).sort({
      createdAt: -1,
    });

    const activeBookings = bookings.filter((b) => b.bookingStatus !== 'cancelled');
    const paidBookings = activeBookings.filter((b) => b.paymentStatus === 'paid');
    const pendingBookings = activeBookings.filter((b) => b.paymentStatus === 'pending');

    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const courtRevenue = paidBookings.reduce((sum, b) => sum + (b.courtAmount || 0), 0);
    const productsRevenue = paidBookings.reduce((sum, b) => sum + (b.productsAmount || 0), 0);
    const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return res.json({
      arenas,
      bookings,
      metrics: {
        totalRevenue,
        courtRevenue,
        productsRevenue,
        pendingRevenue,
        totalBookingsCount: activeBookings.length,
        paidBookingsCount: paidBookings.length,
        averageTicket:
          paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao carregar painel do proprietário.' });
  }
});

// POST /api/owner/arenas - Cria uma nova arena no MongoDB para o proprietário logado
app.post('/api/owner/arenas', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const ownerUser = await User.findById(decoded.sub);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Proprietário não encontrado.' });
    }

    const payload = req.body || {};
    const newArena = await Arena.create({
      ownerId: String(ownerUser._id),
      ownerEmail: ownerUser.email,
      name: payload.name || 'Nova Arena Esportiva',
      cnpj: payload.cnpj || ownerUser.cnpj || '',
      sport: payload.sport || 'society',
      sportLabel: payload.sportLabel || 'Futebol Society • Grama Sintética',
      distance: payload.distance || '1.8 km',
      neighborhood: payload.neighborhood || 'São Paulo, SP',
      address: payload.address || '',
      coordinates: payload.coordinates || { lat: -23.5955, lng: -46.6865 },
      openingHours: payload.openingHours || 'Seg a Dom • 07:00 às 23:00',
      description:
        payload.description ||
        'Complexo esportivo com estrutura completa para atletas, vestiários e área de lazer.',
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      pricePerHour: Number(payload.pricePerHour) || 180,
      pricePerPlayer: Number(payload.pricePerPlayer) || 20,
      cancellationDeadlineHours: Math.max(0, Number(payload.cancellationDeadlineHours) || 0),
      image:
        payload.image ||
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
      gallery: Array.isArray(payload.gallery) && payload.gallery.length > 0
        ? payload.gallery
        : [
            payload.image ||
              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
          ],
      amenities: Array.isArray(payload.amenities)
        ? payload.amenities
        : ['Estacionamento', 'Vestiário', 'Bar & Bebidas', 'Wi-Fi'],
      onSiteServices: Array.isArray(payload.onSiteServices) ? payload.onSiteServices : [],
      courts: Array.isArray(payload.courts) && payload.courts.length > 0
        ? payload.courts
        : [
            {
              id: `c_${Date.now()}`,
              name: 'Quadra 1 • Principal',
              sport: 'Futebol Society',
              surface: 'Grama Sintética',
              covered: true,
              pricePerHour: Number(payload.pricePerHour) || 180,
            },
          ],
      products: Array.isArray(payload.products) ? payload.products : [],
      slots: Array.isArray(payload.slots) && payload.slots.length > 0
        ? payload.slots
        : [
            { time: '18:00', status: 'available', highlight: '', discount: '' },
            { time: '19:00', status: 'available', highlight: 'Horário Nobre', discount: '' },
            { time: '20:00', status: 'available', highlight: '', discount: '' },
            { time: '21:00', status: 'available', highlight: '', discount: '' },
            { time: '22:00', status: 'available', highlight: '', discount: '-15%' },
          ],
    });

    invalidateServerArenasCache();
    return res.status(201).json({ arena: newArena });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao criar nova arena.' });
  }
});

// PUT /api/owner/arenas/:id - Atualiza detalhes, quadras, serviços, produtos e horários da arena no MongoDB
app.put('/api/owner/arenas/:id', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const arena = await Arena.findOne({ _id: req.params.id, ownerId: String(decoded.sub) });
    if (!arena) {
      return res.status(404).json({ message: 'Arena não encontrada para este proprietário.' });
    }

    const allowedFields = [
      'name',
      'cnpj',
      'sport',
      'sportLabel',
      'neighborhood',
      'address',
      'coordinates',
      'openingHours',
      'description',
      'pricePerHour',
      'pricePerPlayer',
      'cancellationDeadlineHours',
      'image',
      'gallery',
      'amenities',
      'onSiteServices',
      'courts',
      'products',
      'slots',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        arena[field] = req.body[field];
      }
    });

    await arena.save();
    invalidateServerArenasCache();
    return res.json({ arena, message: 'Configurações da arena salvas no MongoDB com sucesso!' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao atualizar arena.' });
  }
});

function isSlotTimeInPast(dateLabel = 'Hoje', slotTime = '') {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;
  const todayBr = `${d}/${m}/${y}`;

  const cleanDate = String(dateLabel || '').trim();
  const isToday =
    cleanDate === 'Hoje' ||
    cleanDate.startsWith('Hoje') ||
    cleanDate === todayIso ||
    cleanDate.includes(todayBr);

  if (!isToday) return false;

  const [hh, mm] = String(slotTime || '')
    .split(':')
    .map(Number);
  if (Number.isNaN(hh)) return false;
  const slotMinutes = hh * 60 + (Number.isNaN(mm) ? 0 : mm);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes <= currentMinutes;
}

// POST /api/owner/bookings - Registra novo agendamento (pelo proprietário no balcão/whatsapp ou pelo atleta)
app.post('/api/owner/bookings', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const {
      arenaId,
      courtId,
      courtName,
      surface,
      sport,
      dateLabel,
      slotTime,
      customerName,
      customerPhone,
      customerEmail,
      isProCustomer,
      courtAmount,
      productsAmount,
      productsList,
      paymentMethod,
      paymentStatus,
      notes,
    } = req.body;

    const arena = arenaId
      ? await Arena.findById(arenaId)
      : await Arena.findOne({ ownerId: String(decoded.sub) });

    if (!arena) {
      return res.status(404).json({ message: 'Arena não encontrada.' });
    }

    const resolvedCourtId = courtId || arena.courts?.[0]?.id || 'c1';
    const resolvedCourtName = courtName || arena.courts?.[0]?.name || 'Quadra Principal';
    const resolvedDateLabel = (dateLabel || 'Hoje').trim();
    const resolvedSlotTime = (slotTime || '19:00').trim();

    if (isSlotTimeInPast(resolvedDateLabel, resolvedSlotTime)) {
      return res.status(400).json({
        message: `O horário ${resolvedSlotTime} de hoje já passou. Escolha um horário futuro ou outra data no calendário.`,
      });
    }

    // Verifica se já existe agendamento confirmado para a mesma Arena, Quadra, Data ISO real e Horário (evita duplicidade e não trava dias futuros com reservas antigas)
    const targetIsoDate = resolveBookingIsoDate(resolvedDateLabel, new Date());
    const sameSlotBookings = await Booking.find({
      arenaId: String(arena._id),
      slotTime: resolvedSlotTime,
      bookingStatus: { $ne: 'cancelled' },
      $or: [
        { courtId: resolvedCourtId },
        { courtName: resolvedCourtName },
      ],
    }).lean();

    const existingConflict = sameSlotBookings.find(
      (b) => resolveBookingIsoDate(b.dateLabel, b.createdAt) === targetIsoDate
    );

    if (existingConflict) {
      return res.status(409).json({
        message: `Este horário (${resolvedDateLabel} às ${resolvedSlotTime}) já está reservado na quadra ${resolvedCourtName}. Escolha outro horário ou quadra.`,
      });
    }

    const parsedCourtAmount = Number(courtAmount) || arena.pricePerHour || 200;
    const parsedProductsAmount = Number(productsAmount) || 0;

    const newBooking = await Booking.create({
      arenaId: String(arena._id),
      ownerId: String(arena.ownerId),
      arenaName: arena.name,
      courtId: resolvedCourtId,
      courtName: resolvedCourtName,
      surface: surface || arena.courts?.[0]?.surface || 'Grama Sintética',
      sport: sport || arena.courts?.[0]?.sport || 'Futebol Society',
      dateLabel: resolvedDateLabel,
      slotTime: resolvedSlotTime,
      customerName: customerName || 'Cliente Presencial',
      customerPhone: customerPhone || '(11) 99999-0000',
      customerEmail: customerEmail || '',
      isProCustomer: Boolean(isProCustomer),
      courtAmount: parsedCourtAmount,
      productsAmount: parsedProductsAmount,
      totalAmount: parsedCourtAmount + parsedProductsAmount,
      productsList: Array.isArray(productsList) ? productsList : [],
      paymentMethod: paymentMethod || 'Pix',
      paymentStatus: paymentStatus || 'paid',
      bookingStatus: 'confirmed',
      notes: notes || '',
    });

    invalidateServerArenasCache();
    return res.status(201).json({ booking: newBooking, arena });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao criar agendamento.' });
  }
});

// PATCH /api/owner/bookings/:id - Atualiza status de pagamento ou status da reserva no MongoDB
app.patch('/api/owner/bookings/:id', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      ownerId: String(decoded.sub),
    });

    if (!booking) {
      return res.status(404).json({ message: 'Agendamento não encontrado.' });
    }

    if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;
    if (req.body.bookingStatus) booking.bookingStatus = req.body.bookingStatus;
    if (req.body.notes !== undefined) booking.notes = req.body.notes;

    await booking.save();

    // Se cancelado pelo proprietário, libera o horário na arena, cancela a partida do usuário e envia notificação de reembolso
    if (req.body.bookingStatus === 'cancelled') {
      const arena = await Arena.findById(booking.arenaId);
      if (arena) {
        const slotIdx = arena.slots.findIndex((s) => s.time === booking.slotTime);
        if (slotIdx >= 0) {
          arena.slots[slotIdx].status = 'available';
          await arena.save();
        }
      }

      const expectedTime = `${booking.dateLabel}, ${booking.slotTime}`;
      const relatedMatches = await Match.find({
        $or: [
          { bookingId: String(booking._id) },
          {
            arenaId: String(booking.arenaId),
            time: expectedTime,
          },
        ],
      });

      const affectedUserIds = new Set();
      let matchedTitle = '';

      for (const m of relatedMatches) {
        if (!matchedTitle) matchedTitle = m.title;
        if (m.hostId) affectedUserIds.add(String(m.hostId));
        if (Array.isArray(m.participants)) {
          m.participants.forEach((p) => {
            if (p.userId) affectedUserIds.add(String(p.userId));
            p.status = 'Cancelada pela Arena • Reembolso Garantido';
          });
          m.markModified('participants');
        }
        m.status = 'Cancelada pela Arena • Reembolso Garantido';
        m.isPublicLobby = false;
        await m.save();
      }

      if (booking.customerEmail) {
        const customerUser = await User.findOne({
          email: String(booking.customerEmail).toLowerCase().trim(),
        });
        if (customerUser) {
          affectedUserIds.add(String(customerUser._id));
        }
      }

      const refundValue = Number(booking.totalAmount) || 0;
      const refundText =
        refundValue > 0
          ? `O valor pago (R$ ${refundValue},00) será reembolsado integralmente via ${booking.paymentMethod || 'Pix'}.`
          : 'Qualquer valor pago por esta reserva será reembolsado integralmente.';

      const notifDocs = Array.from(affectedUserIds).map((uid) => ({
        userId: uid,
        type: 'match_cancelled',
        title: 'Partida cancelada pela arena • Reembolso garantido',
        message: `O proprietário da arena ${booking.arenaName} cancelou o agendamento de ${booking.dateLabel} às ${booking.slotTime} (${booking.courtName}). Sua partida foi cancelada automaticamente. ${refundText}`,
        arenaName: booking.arenaName || '',
        matchTitle: matchedTitle || `${booking.arenaName} • ${booking.courtName}`,
        dateLabel: booking.dateLabel || '',
        slotTime: booking.slotTime || '',
        refundAmount: refundValue,
        read: false,
      }));

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }
    }

    invalidateServerArenasCache();
    return res.json({ booking });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao atualizar reserva.' });
  }
});

// ============================================================================
// ENDPOINTS DE REDE DE AMIGOS & BUSCA DE USUÁRIOS REAIS NO MONGODB
// ============================================================================

function formatPublicPlayer(u) {
  return {
    id: String(u._id),
    name: u.name,
    nickname: u.nickname || '',
    handle: `@${(u.nickname || u.name || 'atleta').toLowerCase().replace(/\s+/g, '')}`,
    sport: u.positionRole || 'Atleta Sport Maker',
    positionRole: u.positionRole || 'Atleta Sport Maker',
    customTag: u.customTag || 'Atleta Iniciante',
    cardThemeId: u.cardThemeId || 'neon-lime',
    ovr: u.ovr ?? 0,
    avatar: u.avatar || '',
    avatarScale: u.avatarScale || 100,
    isPro: Boolean(u.isPro && u.proStatus === 'active'),
    matchesCount: u.matchesCount || 0,
    matches: u.matchesCount || 0,
    mvpCount: u.mvpCount || 0,
    friendsCount: Array.isArray(u.friends) ? u.friends.length : 0,
    stats: u.stats || {
      ritmo: 0,
      finalizacao: 0,
      passe: 0,
      defesa: 0,
      fisico: 0,
      fairPlay: 0,
    },
    status: 'Atleta Cadastrado',
    isOnline: true,
    mutualMatches: 0,
  };
}

// GET /api/friends - Retorna a lista real de amigos, solicitações pendentes (recebidas/enviadas) e sugestões
app.get('/api/friends', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUser = await User.findById(decoded.sub);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const friendIds = (currentUser.friends || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const receivedIds = (currentUser.friendRequestsReceived || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const sentIds = (currentUser.friendRequestsSent || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const [friendDocs, receivedDocs, sentDocs] = await Promise.all([
      friendIds.length > 0 ? User.find({ _id: { $in: friendIds } }) : [],
      receivedIds.length > 0 ? User.find({ _id: { $in: receivedIds } }) : [],
      sentIds.length > 0 ? User.find({ _id: { $in: sentIds } }) : [],
    ]);

    const excludeFromSuggestions = [
      currentUser._id,
      ...friendIds,
      ...receivedIds,
      ...sentIds,
    ];

    const suggestionsDocs = await User.find({
      _id: { $nin: excludeFromSuggestions },
      role: 'player',
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      friends: friendDocs.map(formatPublicPlayer),
      receivedRequests: receivedDocs.map(formatPublicPlayer),
      sentRequests: sentDocs.map(formatPublicPlayer),
      suggestions: suggestionsDocs.map(formatPublicPlayer),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar amigos.' });
  }
});

// GET /api/users/search?q=nome - Busca usuários reais no MongoDB pelo nome, apelido ou email
app.get('/api/users/search', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ users: [] });
    }

    const currentUser = await User.findById(decoded.sub);
    const friendSet = new Set((currentUser?.friends || []).map(String));
    const receivedSet = new Set((currentUser?.friendRequestsReceived || []).map(String));
    const sentSet = new Set((currentUser?.friendRequestsSent || []).map(String));

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const foundUsers = await User.find({
      _id: { $ne: decoded.sub },
      $or: [{ name: regex }, { nickname: regex }, { email: regex }],
    })
      .sort({ name: 1 })
      .limit(20);

    return res.json({
      users: foundUsers.map((u) => {
        const uid = String(u._id);
        return {
          ...formatPublicPlayer(u),
          isFriend: friendSet.has(uid),
          hasReceivedRequest: receivedSet.has(uid),
          hasSentRequest: sentSet.has(uid),
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao pesquisar usuários.' });
  }
});

// GET /api/users/:id - Retorna o perfil público completo e o PlayerCard real escolhido pelo usuário
app.get('/api/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    return res.json({ user: formatPublicPlayer(targetUser) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar perfil do jogador.' });
  }
});

// POST /api/friends/:targetId - Envia solicitação de amizade (ou aceita automaticamente se o outro já enviou)
app.post('/api/friends/:targetId', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUserId = String(decoded.sub);
    const targetId = String(req.params.targetId);
    if (!mongoose.Types.ObjectId.isValid(targetId) || targetId === currentUserId) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Se já são amigos
    if ((currentUser.friends || []).map(String).includes(targetId)) {
      return res.json({
        status: 'already_friends',
        message: `${targetUser.name} já está na sua lista de amigos.`,
        user: formatPublicPlayer(targetUser),
      });
    }

    // Se o usuário alvo já tinha enviado solicitação para mim, aceita direto!
    if ((currentUser.friendRequestsReceived || []).map(String).includes(targetId)) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { friendRequestsReceived: targetId, friendRequestsSent: targetId },
        $addToSet: { friends: targetId },
      });
      await User.findByIdAndUpdate(targetId, {
        $pull: { friendRequestsSent: currentUserId, friendRequestsReceived: currentUserId },
        $addToSet: { friends: currentUserId },
      });

      return res.json({
        status: 'accepted',
        message: `Solicitação de amizade de ${targetUser.name} aceita!`,
        friend: formatPublicPlayer(targetUser),
      });
    }

    // Caso contrário, registra a solicitação pendente para o destinatário aceitar ou recusar
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friendRequestsSent: targetId },
    });
    await User.findByIdAndUpdate(targetId, {
      $addToSet: { friendRequestsReceived: currentUserId },
    });

    return res.json({
      status: 'request_sent',
      message: `Solicitação de amizade enviada para ${targetUser.name}!`,
      user: formatPublicPlayer(targetUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao enviar solicitação de amizade.' });
  }
});

// POST /api/friends/:targetId/accept - Aceita uma solicitação de amizade recebida
app.post('/api/friends/:targetId/accept', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUserId = String(decoded.sub);
    const targetId = String(req.params.targetId);
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friendRequestsReceived: targetId, friendRequestsSent: targetId },
      $addToSet: { friends: targetId },
    });
    await User.findByIdAndUpdate(targetId, {
      $pull: { friendRequestsSent: currentUserId, friendRequestsReceived: currentUserId },
      $addToSet: { friends: currentUserId },
    });

    return res.json({
      status: 'accepted',
      message: `Agora você e ${targetUser.name} são amigos!`,
      friend: formatPublicPlayer(targetUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao aceitar solicitação.' });
  }
});

// POST /api/friends/:targetId/reject - Recusa uma solicitação recebida (ou cancela uma enviada)
app.post('/api/friends/:targetId/reject', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUserId = String(decoded.sub);
    const targetId = String(req.params.targetId);

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friendRequestsReceived: targetId, friendRequestsSent: targetId },
    });
    await User.findByIdAndUpdate(targetId, {
      $pull: { friendRequestsSent: currentUserId, friendRequestsReceived: currentUserId },
    });

    return res.json({
      ok: true,
      status: 'rejected',
      message: 'Solicitação de amizade removida.',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao recusar solicitação.' });
  }
});

// DELETE /api/friends/:targetId - Remove um usuário da lista de amigos ou cancela solicitação
app.delete('/api/friends/:targetId', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUserId = String(decoded.sub);
    const targetId = String(req.params.targetId);
    await User.findByIdAndUpdate(currentUserId, {
      $pull: {
        friends: targetId,
        friendRequestsReceived: targetId,
        friendRequestsSent: targetId,
      },
    });
    await User.findByIdAndUpdate(targetId, {
      $pull: {
        friends: currentUserId,
        friendRequestsReceived: currentUserId,
        friendRequestsSent: currentUserId,
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao remover amigo.' });
  }
});

// ============================================================================
// ENDPOINTS DE PARTIDAS E LOBBIES REAIS NO MONGODB
// ============================================================================

function formatMatchForClient(doc, currentUserId) {
  const m = doc.toObject ? doc.toObject() : doc;
  const allParticipants = Array.isArray(m.participants) ? m.participants : [];
  const participant = allParticipants.find(
    (p) => String(p.userId) === String(currentUserId)
  );
  const isHost = String(m.hostId) === String(currentUserId);

  const approvedParticipants = allParticipants.filter((p) => {
    if (p.requestStatus) return p.requestStatus === 'approved';
    return !String(p.status || '').toLowerCase().includes('aguardando host');
  });

  const pendingParticipants = allParticipants
    .filter((p) => {
      if (p.requestStatus) {
        return p.requestStatus === 'pending' || p.requestStatus === 'awaiting_payment';
      }
      return String(p.status || '').toLowerCase().includes('aguardando');
    })
    .sort((a, b) => Number(Boolean(b.isPro)) - Number(Boolean(a.isPro)));

  const confirmedCount = Math.max(1, approvedParticipants.length);

  return {
    id: String(m._id),
    _id: String(m._id),
    createdAt: m.createdAt || null,
    hostId: m.hostId,
    title: m.title,
    arenaId: m.arenaId,
    arena: m.arena,
    neighborhood: m.neighborhood || 'Região Verificada',
    distance: m.distance || '1.5 km',
    time: m.time,
    date: m.time,
    totalSlots: m.totalSlots || 14,
    filledSlots: confirmedCount,
    playersCount: `${confirmedCount}/${m.totalSlots || 14}`,
    pendingRequestsCount: pendingParticipants.length,
    pricePerPlayer: m.pricePerPlayer || 20,
    neededPositions: m.neededPositions || [],
    extras: m.extras || [],
    isPublicLobby: Boolean(m.isPublicLobby),
    splitWithFriends: Boolean(
      m.splitWithFriends ||
        (Array.isArray(m.extras) &&
          m.extras.some((e) => /divis[aã]o|pix split/i.test(String(e))))
    ),
    participantPaymentConfirmed: isHost ? true : Boolean(participant?.paymentConfirmed),
    role: isHost ? 'Organizador (Host)' : participant?.role || 'Atleta Participante',
    status: isHost
      ? m.status || 'Confirmada'
      : participant?.status || m.status || 'Confirmada',
    requestStatus: isHost
      ? 'approved'
      : participant?.requestStatus ||
        (String(participant?.status || '').toLowerCase().includes('aguardando host')
          ? 'pending'
          : 'approved'),
    evaluated: Boolean(participant?.evaluated),
    evaluationStars: participant?.evaluationStars || null,
    isProHost: Boolean(m.isProHost),
    freeBallIncluded: Boolean(m.freeBallIncluded),
    isInvited: Boolean(
      currentUserId &&
        Array.isArray(m.invitedUserIds) &&
        m.invitedUserIds.map(String).includes(String(currentUserId))
    ),
    host: {
      id: m.hostId,
      name: m.hostName,
      rating: m.hostRating ?? 0,
      isPro: Boolean(m.isProHost),
      avatar: m.hostAvatar || '',
    },
    participants: allParticipants,
    approvedParticipants,
    pendingParticipants,
    evaluationSummary: m.evaluationSummary || null,
  };
}

// Helper: Verifica no servidor se a partida é elegível para o Lobby Público (hoje ou amanhã, não encerrada e não cancelada)
function parseServerMatchDate(dateTimeStr, referenceDate = null) {
  if (!dateTimeStr) return null;
  const raw = String(dateTimeStr).trim();
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const baseDate =
    referenceDate && !Number.isNaN(new Date(referenceDate).getTime())
      ? new Date(referenceDate)
      : new Date();

  const fullBrMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (fullBrMatch) {
    const [, dd, mm, yyyy] = fullBrMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }
  const shortBrMatch = raw.match(/(\d{2})\/(\d{2})/);
  if (shortBrMatch) {
    const [, dd, mm] = shortBrMatch;
    return new Date(baseDate.getFullYear(), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }
  const lower = raw.toLowerCase();
  if (lower.includes('amanh')) {
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, hours, minutes, 0, 0);
  }
  if (lower.includes('hoje')) {
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
  }
  return null;
}

function isServerLobbyEligible(m) {
  if (!m) return false;
  const statusLower = String(m.status || '').toLowerCase();
  if (
    statusLower.includes('cancelad') ||
    statusLower.includes('encerrad') ||
    statusLower.includes('conclu') ||
    statusLower.includes('finaliz')
  ) {
    return false;
  }
  const startDate = parseServerMatchDate(m.time, m.createdAt);
  if (!startDate) return false;
  if (Date.now() >= startDate.getTime() + 60 * 60 * 1000) {
    return false;
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const matchDayStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();
  const dayDiff = Math.round((matchDayStart - todayStart) / (24 * 60 * 60 * 1000));
  return dayDiff === 0 || dayDiff === 1;
}

// GET /api/lobbies - Lista partidas públicas abertas reais do MongoDB (apenas de hoje ou amanhã, não encerradas e não canceladas)
app.get('/api/lobbies', async (req, res) => {
  try {
    const matches = await Match.find({ isPublicLobby: true }).sort({ createdAt: -1 }).limit(50);
    const validMatches = matches.filter((m) => isServerLobbyEligible(m));
    return res.json({
      lobbies: validMatches.map((m) => formatMatchForClient(m, null)),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar lobbies.' });
  }
});

// GET /api/matches/my - Lista apenas as partidas criadas ou participadas pelo usuário autenticado
app.get('/api/matches/my', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const userId = String(decoded.sub);
    const matches = await Match.find({
      $or: [{ hostId: userId }, { 'participants.userId': userId }],
    }).sort({ createdAt: -1 });

    return res.json({
      matches: matches.map((m) => formatMatchForClient(m, userId)),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar suas partidas.' });
  }
});

// POST /api/matches - Cria uma nova partida ou reserva no MongoDB para o usuário logado
app.post('/api/matches', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const payload = req.body || {};
    const isPro = Boolean(user.isPro && user.proStatus === 'active');

    const newMatch = await Match.create({
      hostId: String(user._id),
      hostName: user.nickname ? `${user.name} "${user.nickname}"` : user.name,
      hostAvatar: user.avatar,
      hostRating: user.ovr || 88,
      isProHost: isPro,
      freeBallIncluded: isPro,
      title: payload.title || 'Partida Oficial',
      bookingId: payload.bookingId || '',
      arenaId: payload.arenaId || '',
      arena: payload.arena || 'Arena Esportiva',
      neighborhood: payload.neighborhood || '',
      distance: payload.distance || '1.5 km',
      time: payload.time || payload.date || 'Hoje, 20:00',
      totalSlots: Number(payload.totalSlots) || 14,
      filledSlots: 1,
      pricePerPlayer: Number(payload.pricePerPlayer) || 20,
      neededPositions: Array.isArray(payload.neededPositions) ? payload.neededPositions : [],
      extras: Array.isArray(payload.extras) ? payload.extras : [],
      isPublicLobby: payload.isPublicLobby !== false,
      splitWithFriends: Boolean(payload.splitWithFriends),
      status: payload.status || 'Confirmada',
      participants: [
        {
          userId: String(user._id),
          name: user.name,
          avatar: user.avatar,
          ovr: user.ovr ?? 0,
          role: payload.role || 'Organizador (Host)',
          status: payload.status || 'Confirmada',
          requestStatus: 'approved',
          isPro,
          paymentConfirmed: true,
          evaluated: false,
        },
      ],
    });

    await User.findByIdAndUpdate(user._id, { $inc: { matchesCount: 1 } });

    return res.status(201).json({
      match: formatMatchForClient(newMatch, String(user._id)),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao criar partida.' });
  }
});

// POST /api/matches/:id/join - Entra ou sai de um lobby público
app.post('/api/matches/:id/join', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const user = await User.findById(decoded.sub);
    const match = await Match.findById(req.params.id);
    if (!user || !match) {
      return res.status(404).json({ message: 'Partida não encontrada.' });
    }

    const userId = String(user._id);
    const isPro = Boolean(user.isPro && user.proStatus === 'active');
    const existingIdx = match.participants.findIndex((p) => String(p.userId) === userId);

    if (existingIdx >= 0 && String(match.hostId) !== userId) {
      match.participants.splice(existingIdx, 1);
      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      match.filledSlots = Math.max(1, approvedCount);
      await match.save();
      return res.json({
        joined: false,
        match: formatMatchForClient(match, userId),
      });
    }

    if (existingIdx < 0) {
      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      const isFull = approvedCount >= (match.totalSlots || 14);

      const requiresSplitPayment = Boolean(
        match.splitWithFriends ||
          (Array.isArray(match.extras) &&
            match.extras.some((e) => /divis[aã]o|pix split/i.test(String(e))))
      );

      const newParticipant = {
        userId,
        name: user.name,
        avatar: user.avatar,
        ovr: user.ovr ?? 0,
        role: requiresSplitPayment
          ? `Aguardando Pagamento da Cota (R$ ${match.pricePerPlayer || 20},00)`
          : isFull
            ? isPro
              ? `👑 1º da Fila de Espera PRO (Host: ${match.hostName})`
              : `Fila de Espera (Host: ${match.hostName})`
            : isPro
              ? `⚡ Prioridade PRO na Fila (Host: ${match.hostName})`
              : `Solicitante (Host: ${match.hostName})`,
        status: requiresSplitPayment
          ? 'Aguardando Confirmação do Gateway de Pagamento'
          : isFull
            ? isPro
              ? 'Fila de Espera PRO • Prioridade Máxima'
              : 'Na Fila de Espera • Aguardando Vaga'
            : isPro
              ? 'Solicitação PRO Enviada • Aguardando Host'
              : 'Solicitação Enviada • Aguardando Host',
        requestStatus: 'pending',
        isPro,
        paymentConfirmed: false,
        evaluated: false,
      };

      // Jogadores PRO pulam para o topo da fila de solicitações pendentes
      if (isPro) {
        const firstNonProPendingIdx = match.participants.findIndex(
          (p) => p.requestStatus === 'pending' && !p.isPro
        );
        if (firstNonProPendingIdx >= 0) {
          match.participants.splice(firstNonProPendingIdx, 0, newParticipant);
        } else {
          match.participants.push(newParticipant);
        }
      } else {
        match.participants.push(newParticipant);
      }

      match.markModified('participants');
      await match.save();

      if (match.hostId && String(match.hostId) !== userId) {
        await Notification.create({
          userId: String(match.hostId),
          type: 'match_join_request',
          title: isFull
            ? 'Novo jogador entrou na fila de espera da partida'
            : 'Nova solicitação para entrar na sua partida',
          message: `${user.name}${
            isPro ? ' (Atleta PRO ⚡ — Topo da Fila)' : ''
          } ${
            isFull ? 'entrou na fila de espera' : 'solicitou entrada'
          } na partida "${match.title}" (${match.time}).`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});
      }
    }

    return res.json({
      joined: true,
      match: formatMatchForClient(match, userId),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao participar da partida.' });
  }
});

// GET /api/matches/:id - Busca detalhes completos de uma partida (arena, jogadores aprovados e solicitações pendentes)
app.get('/api/matches/:id', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    const currentUserId = decoded?.sub ? String(decoded.sub) : null;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID da partida inválido.' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Partida não encontrada.' });
    }

    return res.json({
      match: formatMatchForClient(match, currentUserId),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar detalhes da partida.' });
  }
});

// POST /api/matches/:id/participants/:targetUserId/respond - Organizador (Host) aceita ou recusa solicitação de entrada na partida
app.post('/api/matches/:id/participants/:targetUserId/respond', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const currentUserId = String(decoded.sub);
    const targetUserId = String(req.params.targetUserId);
    const { action } = req.body || {}; // 'accept' | 'reject'

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID da partida inválido.' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Partida não encontrada.' });
    }

    const isHostUser =
      String(match.hostId) === currentUserId ||
      match.participants.some(
        (p) =>
          String(p.userId) === currentUserId &&
          String(p.role || '').toLowerCase().includes('organizador')
      );

    if (!isHostUser) {
      return res.status(403).json({
        message: 'Apenas o organizador (Host) da partida pode aceitar ou recusar jogadores.',
      });
    }

    const partIdx = match.participants.findIndex(
      (p) =>
        String(p.userId) === targetUserId ||
        String(p._id) === targetUserId
    );
    if (partIdx < 0) {
      return res.status(404).json({ message: 'Solicitação de jogador não encontrada.' });
    }

    if (action === 'accept') {
      const requiresSplitPayment = Boolean(
        match.splitWithFriends ||
          (Array.isArray(match.extras) &&
            match.extras.some((e) => /divis[aã]o|pix split/i.test(String(e))))
      );

      const acceptedName = match.participants[partIdx].name;
      const acceptedUserId = String(match.participants[partIdx].userId || targetUserId);

      // Se a partida tiver divisão de valor e o jogador ainda não pagou, muda para aguardando pagamento e envia notificação ao solicitante
      if (requiresSplitPayment && !match.participants[partIdx].paymentConfirmed) {
        match.participants[partIdx].requestStatus = 'awaiting_payment';
        match.participants[partIdx].role = `Aceito pelo Host • Aguardando Pagamento (R$ ${
          match.pricePerPlayer || 20
        },00)`;
        match.participants[partIdx].status = 'Aprovado pelo Host • Aguardando Pagamento';
        match.markModified('participants');
        await match.save();

        await Notification.create({
          userId: acceptedUserId,
          type: 'match_payment_required',
          title: 'Sua solicitação foi aceita! Aguardando pagamento 💳⚽',
          message: `O organizador aceitou sua entrada na partida "${match.title}" (${
            match.time
          }). Acesse os detalhes da partida para realizar o pagamento da sua cota de R$ ${
            match.pricePerPlayer || 20
          },00 e confirmar sua vaga!`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});

        return res.json({
          message: `Solicitação de ${acceptedName} aceita! Enviamos uma notificação de aguardando pagamento para ele.`,
          match: formatMatchForClient(match, currentUserId),
        });
      }

      match.participants[partIdx].requestStatus = 'approved';
      match.participants[partIdx].role = 'Atleta Confirmado';
      match.participants[partIdx].status = 'Entrada Aprovada pelo Host';
      match.markModified('participants');

      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      match.filledSlots = Math.max(1, approvedCount);
      await match.save();

      if (mongoose.Types.ObjectId.isValid(targetUserId)) {
        await User.findByIdAndUpdate(targetUserId, { $inc: { matchesCount: 1 } }).catch(() => {});
      }

      // Notifica o solicitante que sua entrada foi aceita e já está confirmada (sem pagamento pendente)
      if (acceptedUserId && acceptedUserId !== currentUserId) {
        await Notification.create({
          userId: acceptedUserId,
          type: 'match_request_accepted',
          title: 'Sua solicitação foi aceita! Vaga confirmada ⚽✅',
          message: `O organizador aceitou sua entrada na partida "${match.title}" em ${match.arena} (${match.time}). Não há pagamento pendente — a partida já está na sua aba de Partidas Futuras!`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});
      }

      // Notifica o criador da partida quando completar o número máximo de jogadores
      if (match.hostId && approvedCount === (match.totalSlots || 14)) {
        await Notification.create({
          userId: String(match.hostId),
          type: 'match_full',
          title: 'Sua partida completou todos os jogadores! ⚽🔥',
          message: `A partida "${match.title}" em ${match.arena} (${match.time}) atingiu a lotação máxima de ${
            match.totalSlots || 14
          }/${match.totalSlots || 14} atletas confirmados!`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});
      }

      return res.json({
        message: `${acceptedName} foi aceito na partida!`,
        match: formatMatchForClient(match, currentUserId),
      });
    } else {
      const removedName = match.participants[partIdx].name;
      match.participants.splice(partIdx, 1);
      match.markModified('participants');
      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      match.filledSlots = Math.max(1, approvedCount);
      await match.save();

      return res.json({
        message: `Solicitação de ${removedName} recusada.`,
        match: formatMatchForClient(match, currentUserId),
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Erro ao responder solicitação da partida.',
    });
  }
});

// POST /api/matches/:id/invite/respond - Atleta convidado aceita ou recusa entrar na partida
app.post('/api/matches/:id/invite/respond', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const userId = String(decoded.sub);
    const { action } = req.body || {}; // 'accept' | 'decline'
    const [user, match] = await Promise.all([
      User.findById(userId),
      Match.findById(req.params.id),
    ]);

    if (!user || !match) {
      return res.status(404).json({ message: 'Partida ou usuário não encontrado.' });
    }

    match.invitedUserIds = (match.invitedUserIds || []).filter(
      (id) => String(id) !== userId
    );

    if (action === 'accept') {
      const requiresSplitPayment = Boolean(
        match.splitWithFriends ||
          (Array.isArray(match.extras) &&
            match.extras.some((e) => /divis[aã]o|pix split/i.test(String(e))))
      );
      const { paymentConfirmed } = req.body || {};

      if (requiresSplitPayment && paymentConfirmed !== true) {
        const existingIdx = match.participants.findIndex(
          (p) => String(p.userId) === userId
        );
        const isPro = Boolean(user.isPro && user.proStatus === 'active');

        if (existingIdx >= 0) {
          match.participants[existingIdx].requestStatus = 'awaiting_payment';
          match.participants[existingIdx].role = `Convidado Aceito • Aguardando Pagamento (R$ ${
            match.pricePerPlayer || 20
          },00)`;
          match.participants[existingIdx].status = 'Aguardando Pagamento da Cota';
        } else {
          match.participants.push({
            userId,
            name: user.name,
            avatar: user.avatar,
            ovr: user.ovr ?? 0,
            role: `Convidado Aceito • Aguardando Pagamento (R$ ${match.pricePerPlayer || 20},00)`,
            status: 'Aguardando Pagamento da Cota',
            requestStatus: 'awaiting_payment',
            isPro,
            paymentConfirmed: false,
            evaluated: false,
          });
        }
        match.markModified('participants');
        await match.save();

        return res.json({
          accepted: true,
          requiresPayment: true,
          message:
            'Convite aceito! Realize o pagamento da sua cota abaixo para confirmar sua entrada oficial na partida.',
          match: formatMatchForClient(match, userId),
        });
      }

      const existingIdx = match.participants.findIndex(
        (p) => String(p.userId) === userId
      );
      const isPro = Boolean(user.isPro && user.proStatus === 'active');

      if (existingIdx >= 0) {
        match.participants[existingIdx].requestStatus = 'approved';
        match.participants[existingIdx].role = 'Atleta Confirmado (Convidado)';
        match.participants[existingIdx].status = 'Confirmada • Convite Aceito';
      } else {
        match.participants.push({
          userId,
          name: user.name,
          avatar: user.avatar,
          ovr: user.ovr ?? 0,
          role: 'Atleta Confirmado (Convidado)',
          status: 'Confirmada • Convite Aceito',
          requestStatus: 'approved',
          isPro,
          evaluated: false,
        });
      }

      match.markModified('participants');
      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      match.filledSlots = Math.max(1, approvedCount);
      await match.save();

      await User.findByIdAndUpdate(userId, { $inc: { matchesCount: 1 } }).catch(() => {});

      // Notifica o criador da partida quando completar o número máximo de jogadores
      if (match.hostId && approvedCount === (match.totalSlots || 14)) {
        await Notification.create({
          userId: String(match.hostId),
          type: 'match_full',
          title: 'Sua partida completou todos os jogadores! ⚽🔥',
          message: `A partida "${match.title}" em ${match.arena} (${match.time}) atingiu a lotação máxima de ${
            match.totalSlots || 14
          }/${match.totalSlots || 14} atletas confirmados!`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});
      }

      return res.json({
        accepted: true,
        message: 'Convite aceito! Você já está confirmado nesta partida.',
        match: formatMatchForClient(match, userId),
      });
    }

    await match.save();
    return res.json({
      accepted: false,
      message: 'Você recusou o convite para esta partida.',
      match: formatMatchForClient(match, userId),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao responder convite.' });
  }
});

// POST /api/matches/:id/pay-share - Realiza e confirma o pagamento da cota da partida (via gateway) após aprovação do Host
app.post('/api/matches/:id/pay-share', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const userId = String(decoded.sub);
    const { paymentMethod = 'pix', transactionId } = req.body || {};

    const [user, match] = await Promise.all([
      User.findById(userId),
      Match.findById(req.params.id),
    ]);

    if (!user || !match) {
      return res.status(404).json({ message: 'Partida ou usuário não encontrado.' });
    }

    const partIdx = match.participants.findIndex(
      (p) => String(p.userId) === userId
    );
    if (partIdx < 0) {
      return res.status(404).json({
        message: 'Solicite entrada na partida e aguarde o aceite do organizador antes de pagar.',
      });
    }

    if (match.participants[partIdx].requestStatus === 'pending') {
      return res.status(400).json({
        message: 'Aguarde o organizador aceitar sua solicitação para liberar o pagamento.',
      });
    }

    match.participants[partIdx].paymentConfirmed = true;
    match.participants[partIdx].paymentTransactionId =
      transactionId || `TX_MATCH_${String(paymentMethod).toUpperCase()}_${Date.now()}`;
    match.participants[partIdx].requestStatus = 'approved';
    match.participants[partIdx].role = 'Atleta Confirmado (Cota Paga)';
    match.participants[partIdx].status = 'Confirmada • Pagamento Aprovado';
    match.markModified('participants');

    const approvedCount = match.participants.filter(
      (p) => (p.requestStatus || 'approved') === 'approved'
    ).length;
    match.filledSlots = Math.max(1, approvedCount);
    await match.save();

    await User.findByIdAndUpdate(userId, { $inc: { matchesCount: 1 } }).catch(() => {});

    if (match.hostId && String(match.hostId) !== userId) {
      await Notification.create({
        userId: String(match.hostId),
        type: 'match_payment_confirmed',
        title: `${user.name} confirmou o pagamento da partida! 💳✅`,
        message: `O pagamento da cota (R$ ${
          match.pricePerPlayer || 20
        },00) de ${user.name} foi confirmado pelo gateway e ele já entrou no elenco confirmado de "${
          match.title
        }".`,
        matchId: String(match._id),
        arenaName: match.arena || '',
        matchTitle: match.title || '',
        dateLabel: match.time || '',
        read: false,
      }).catch(() => {});

      if (approvedCount === (match.totalSlots || 14)) {
        await Notification.create({
          userId: String(match.hostId),
          type: 'match_full',
          title: 'Sua partida completou todos os jogadores! ⚽🔥',
          message: `A partida "${match.title}" em ${match.arena} (${match.time}) atingiu a lotação máxima de ${
            match.totalSlots || 14
          }/${match.totalSlots || 14} atletas confirmados!`,
          matchId: String(match._id),
          arenaName: match.arena || '',
          matchTitle: match.title || '',
          dateLabel: match.time || '',
          read: false,
        }).catch(() => {});
      }
    }

    return res.json({
      ok: true,
      message: 'Pagamento confirmado! Sua vaga na partida está garantida.',
      match: formatMatchForClient(match, userId),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Erro ao processar pagamento da partida.',
    });
  }
});

// POST /api/matches/:id/invite/:targetUserId - Convida um amigo para a partida enviando notificação
app.post('/api/matches/:id/invite/:targetUserId', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const sender = await User.findById(decoded.sub);
    const match = await Match.findById(req.params.id);
    const targetUserId = String(req.params.targetUserId);

    if (!sender || !match) {
      return res.status(404).json({ message: 'Partida ou usuário não encontrado.' });
    }

    const statusLower = String(match.status || '').toLowerCase();
    if (statusLower.includes('cancelad') || statusLower.includes('encerrad')) {
      return res.status(400).json({
        message: 'Não é possível convidar jogadores para uma partida já encerrada ou cancelada.',
      });
    }

    if (!Array.isArray(match.invitedUserIds)) {
      match.invitedUserIds = [];
    }
    if (!match.invitedUserIds.map(String).includes(targetUserId)) {
      match.invitedUserIds.push(targetUserId);
      await match.save();
    }

    await Notification.create({
      userId: targetUserId,
      type: 'match_invite',
      title: `${sender.name} convidou você para uma partida!`,
      message: `Você foi convocado para jogar "${match.title}" em ${match.arena} (${match.time}). Valor: R$ ${match.pricePerPlayer || 20},00 por atleta.`,
      matchId: String(match._id),
      arenaName: match.arena || '',
      matchTitle: match.title || '',
      dateLabel: match.time || '',
      read: false,
    });

    return res.json({
      ok: true,
      message: 'Convite enviado para o seu amigo!',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao enviar convite.' });
  }
});

// DELETE /api/matches/:id - Cancela (Host) ou sai de uma partida (Participante)
app.delete('/api/matches/:id', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const userId = String(decoded.sub);
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.json({ ok: true });
    }

    if (String(match.hostId) === userId) {
      // Verifica se a arena estabeleceu um período máximo para cancelamento antes da partida
      if (match.arenaId && mongoose.Types.ObjectId.isValid(match.arenaId)) {
        const linkedArena = await Arena.findById(match.arenaId)
          .select('name cancellationDeadlineHours')
          .lean();
        const deadlineHours = Number(linkedArena?.cancellationDeadlineHours || 0);
        if (deadlineHours > 0) {
          const matchStartDate = parseServerMatchDate(match.time, match.createdAt);
          if (matchStartDate) {
            const msUntilStart = matchStartDate.getTime() - Date.now();
            const hoursUntilStart = msUntilStart / (60 * 60 * 1000);
            if (hoursUntilStart < deadlineHours) {
              return res.status(400).json({
                message: `Cancelamento bloqueado: a arena ${
                  linkedArena.name || match.arena
                } permite cancelar apenas até ${deadlineHours} ${
                  deadlineHours === 1 ? 'hora' : 'horas'
                } antes do início da partida.`,
              });
            }
          }
        }
      }

      // Marca a partida como cancelada pelo organizador para que apareça na aba "Canceladas" de todos os envolvidos
      match.status = 'Cancelada pelo Organizador';
      match.isPublicLobby = false;

      const affectedUserIds = new Set();
      if (Array.isArray(match.participants)) {
        match.participants.forEach((p) => {
          const pid = String(p.userId || '');
          if (pid && pid !== userId) {
            affectedUserIds.add(pid);
          }
          p.status = 'Cancelada pelo Organizador';
        });
        match.markModified('participants');
      }

      if (Array.isArray(match.invitedUserIds)) {
        match.invitedUserIds.forEach((invId) => {
          const idStr = String(invId || '');
          if (idStr && idStr !== userId) {
            affectedUserIds.add(idStr);
          }
        });
      }

      await match.save();

      // Libera o horário na arena cancelando a reserva vinculada (por bookingId ou por arenaId + data + horário)
      let releasedSlotTime = '';
      if (match.bookingId && mongoose.Types.ObjectId.isValid(match.bookingId)) {
        const cancelledBooking = await Booking.findByIdAndUpdate(
          match.bookingId,
          { bookingStatus: 'cancelled' },
          { new: true }
        ).catch(() => null);
        if (cancelledBooking?.slotTime) {
          releasedSlotTime = cancelledBooking.slotTime;
        }
      }

      // Fallback para partidas sem bookingId ou criadas anteriormente: busca reserva ativa pelo mesmo arenaId + data ISO + horário
      const timeMatch = String(match.time || '').match(/(\d{1,2}:\d{2})/);
      const matchSlotTime = releasedSlotTime || (timeMatch ? timeMatch[1].padStart(5, '0') : '');
      if (match.arenaId && matchSlotTime) {
        const matchIsoDate = resolveBookingIsoDate(match.time, match.createdAt);
        const activeSameSlot = await Booking.find({
          arenaId: String(match.arenaId),
          slotTime: matchSlotTime,
          bookingStatus: { $ne: 'cancelled' },
        });
        for (const b of activeSameSlot) {
          if (resolveBookingIsoDate(b.dateLabel, b.createdAt) === matchIsoDate) {
            b.bookingStatus = 'cancelled';
            await b.save().catch(() => {});
          }
        }

        if (mongoose.Types.ObjectId.isValid(match.arenaId)) {
          const arenaDoc = await Arena.findById(match.arenaId).catch(() => null);
          if (arenaDoc && Array.isArray(arenaDoc.slots)) {
            const slotIdx = arenaDoc.slots.findIndex((s) => s.time === matchSlotTime);
            if (slotIdx >= 0 && arenaDoc.slots[slotIdx].status !== 'available') {
              arenaDoc.slots[slotIdx].status = 'available';
              await arenaDoc.save().catch(() => {});
            }
          }
        }
      }

      invalidateServerArenasCache();

      // Envia notificação para todos os participantes e convidados avisando do cancelamento
      const hostDisplayName = match.hostName || 'O organizador';
      const notifDocs = Array.from(affectedUserIds).map((uid) => ({
        userId: uid,
        type: 'match_cancelled',
        title: 'Partida cancelada pelo organizador',
        message: `${hostDisplayName} cancelou a partida "${match.title}" agendada em ${match.arena} (${match.time}). A partida foi movida para a sua aba de Partidas Canceladas.`,
        matchId: String(match._id),
        arenaName: match.arena || '',
        matchTitle: match.title || '',
        dateLabel: match.time || '',
        read: false,
      }));

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs).catch(() => {});
      }

      return res.json({
        ok: true,
        cancelled: true,
        match: formatMatchForClient(match, userId),
      });
    } else {
      match.participants = match.participants.filter((p) => String(p.userId) !== userId);
      const approvedCount = match.participants.filter(
        (p) => (p.requestStatus || 'approved') === 'approved'
      ).length;
      match.filledSlots = Math.max(1, approvedCount);
      match.markModified('participants');
      await match.save();

      return res.json({
        ok: true,
        left: true,
      });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao cancelar partida.' });
  }
});

// POST /api/evaluations - Computa avaliação real da Arena (1 a 5 estrelas + comentário) e notas dos Jogadores (0 a 10)
app.post('/api/evaluations', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    const {
      matchId,
      arenaId,
      arenaName,
      arenaStars,
      arenaTierLabel,
      arenaComment,
      mvpPlayerId,
      playerRatings = [],
    } = req.body || {};

    let evaluatorUser = null;
    if (decoded?.sub && mongoose.Types.ObjectId.isValid(decoded.sub)) {
      evaluatorUser = await User.findById(decoded.sub);
    }

    let updatedArena = null;
    if (typeof arenaStars === 'number' && arenaStars >= 1 && arenaStars <= 5) {
      let arena = null;
      if (arenaId && mongoose.Types.ObjectId.isValid(arenaId)) {
        arena = await Arena.findById(arenaId);
      }
      if (!arena && arenaName) {
        const cleanArenaName = arenaName
          .split('•')[0]
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        arena = await Arena.findOne({
          name: { $regex: new RegExp(cleanArenaName, 'i') },
        });
      }

      if (arena) {
        const currentReviews = Array.isArray(arena.reviews) ? arena.reviews : [];
        currentReviews.unshift({
          userId: evaluatorUser ? String(evaluatorUser._id) : '',
          userName: evaluatorUser?.name || 'Atleta Verificado',
          userAvatar: evaluatorUser?.avatar || '',
          stars: arenaStars,
          tierLabel: arenaTierLabel || `${arenaStars} Estrelas`,
          comment: (arenaComment || '').trim(),
          createdAt: new Date(),
        });

        arena.reviews = currentReviews;
        const newCount = currentReviews.length;
        const sumStars = currentReviews.reduce((acc, r) => acc + (Number(r.stars) || 0), 0);
        const newRating = Number((sumStars / newCount).toFixed(1));

        arena.reviewsCount = newCount;
        arena.rating = newRating;
        await arena.save();
        invalidateServerArenasCache();

        updatedArena = {
          _id: String(arena._id),
          id: String(arena._id),
          name: arena.name,
          rating: arena.rating,
          reviewsCount: arena.reviewsCount,
          reviews: arena.reviews,
        };
      }
    }

    // Marca a partida como avaliada para o usuário atual, salva notas/MVP e verifica se todos os jogadores já avaliaram
    if (matchId && mongoose.Types.ObjectId.isValid(matchId) && decoded?.sub) {
      const match = await Match.findById(matchId);
      if (match) {
        const part = match.participants.find((p) => String(p.userId) === String(decoded.sub));
        if (part) {
          part.evaluated = true;
          part.evaluationStars = arenaStars || 5;
        }

        if (Array.isArray(playerRatings) && playerRatings.length > 0) {
          for (const pr of playerRatings) {
            const targetPart = match.participants.find(
              (p) => String(p.userId) === String(pr.id) || p.name === pr.name
            );
            if (targetPart && typeof pr.score === 'number') {
              targetPart.matchScore =
                typeof targetPart.matchScore === 'number'
                  ? Number(((targetPart.matchScore + pr.score) / 2).toFixed(1))
                  : Number(pr.score.toFixed(1));
              if (Array.isArray(pr.badges) && pr.badges.length > 0) {
                targetPart.matchBadges = Array.from(
                  new Set([...(targetPart.matchBadges || []), ...pr.badges])
                );
              }
            }
          }

          const sortedRatings = [...playerRatings].sort(
            (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
          );
          const mvpEntry =
            playerRatings.find((p) => String(p.id) === String(mvpPlayerId)) ||
            sortedRatings[0];

          match.evaluationSummary = {
            arenaStars: arenaStars || match.evaluationSummary?.arenaStars || 5,
            arenaTierLabel:
              arenaTierLabel || match.evaluationSummary?.arenaTierLabel || 'Arena Verificada',
            arenaComment:
              (arenaComment || '').trim() || match.evaluationSummary?.arenaComment || '',
            mvpPlayerId: mvpEntry ? String(mvpEntry.id || '') : '',
            mvpPlayerName: mvpEntry?.name || '',
            mvpPlayerAvatar: mvpEntry?.avatar || '',
            mvpScore: typeof mvpEntry?.score === 'number' ? Number(mvpEntry.score.toFixed(1)) : 9.5,
            playerRatings: playerRatings.map((pr) => ({
              id: String(pr.id || ''),
              name: pr.name || 'Atleta',
              avatar: pr.avatar || '',
              score: typeof pr.score === 'number' ? Number(pr.score.toFixed(1)) : 8.5,
              badges: Array.isArray(pr.badges) ? pr.badges : [],
            })),
          };
        }

        const approved = (match.participants || []).filter(
          (p) => (p.requestStatus || 'approved') === 'approved'
        );
        if (approved.length > 0 && approved.every((p) => Boolean(p.evaluated))) {
          match.status = 'Partida Encerrada • Avaliações Concluídas';
        }
        await match.save();
      }
    }

    // Atualiza notas reais dos jogadores avaliados na partida
    if (Array.isArray(playerRatings)) {
      for (const pr of playerRatings) {
        if (pr.id && mongoose.Types.ObjectId.isValid(pr.id) && typeof pr.score === 'number') {
          const targetUser = await User.findById(pr.id);
          if (targetUser) {
            const scaled = Math.min(100, Math.max(0, Math.round(pr.score * 10)));
            const prevMatches = targetUser.matchesCount || 0;
            const prevOvr = targetUser.ovr || 0;
            const newOvr =
              prevOvr === 0
                ? scaled
                : Math.round((prevOvr * Math.max(1, prevMatches) + scaled) / (Math.max(1, prevMatches) + 1));
            targetUser.ovr = newOvr;
            targetUser.fairPlay = Number(((pr.score / 2)).toFixed(2));
            targetUser.stats = {
              ritmo: scaled,
              finalizacao: scaled,
              passe: scaled,
              defesa: scaled,
              fisico: scaled,
              fairPlay: scaled,
            };
            await targetUser.save();
          }
        }
      }
    }

    // Incrementa MVP se o mvpPlayerId for um usuário válido do banco
    if (mvpPlayerId && mongoose.Types.ObjectId.isValid(mvpPlayerId)) {
      await User.findByIdAndUpdate(mvpPlayerId, { $inc: { mvpCount: 1 } });
    }

    return res.json({
      ok: true,
      message: 'Avaliação computada com sucesso!',
      updatedArena,
      computedPlayersCount: Array.isArray(playerRatings) ? playerRatings.length : 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao computar avaliação.' });
  }
});

// ============================================================================
// ENDPOINTS DE NOTIFICAÇÕES DO USUÁRIO (CANCELAMENTOS, REEMBOLSOS, ETC.)
// ============================================================================

app.get('/api/notifications', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const userId = String(decoded.sub);
    const list = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = list.map((n) => ({
      ...n,
      id: String(n._id),
    }));
    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar notificações.' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: String(decoded.sub) },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: 'Notificação não encontrada.' });
    }

    return res.json({ notification: { ...notif.toObject(), id: String(notif._id) } });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao marcar notificação.' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    await Notification.updateMany(
      { userId: String(decoded.sub), read: false },
      { $set: { read: true } }
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao marcar notificações como lidas.' });
  }
});

// ============================================================================
// MODELO E ROTAS DE CARTAS PERSONALIZADAS (CARD TEMPLATES) NO MONGODB
// ============================================================================
const CardTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'custom', trim: true },
    imageUrl: { type: String, required: true },
    isPro: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'card_templates' }
);

const CardTemplate =
  mongoose.models.CardTemplate || mongoose.model('CardTemplate', CardTemplateSchema);

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await CardTemplate.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, cards });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao listar cartas.' });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { name, category, imageUrl, isPro } = req.body || {};
    if (!name || !imageUrl) {
      return res.status(400).json({ message: 'Nome e imageUrl são obrigatórios.' });
    }
    const card = await CardTemplate.create({
      name,
      category: category || 'custom',
      imageUrl,
      isPro: Boolean(isPro),
    });
    return res.status(201).json({ ok: true, card });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao salvar carta.' });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await CardTemplate.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao remover carta.' });
  }
});

export async function startServer() {
  try {
    await connectDB();
    console.log(
      `✅ Conectado ao MongoDB Atlas: footplus.yliizzy.mongodb.net/${mongoose.connection.name}`
    );

    app.listen(PORT, () => {
      console.log(`🚀 Servidor Auth + MongoDB rodando em http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar no MongoDB Atlas:', error.message);
    app.listen(PORT, () => {
      console.log(`⚠️ Servidor rodando em modo degradado na porta ${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
