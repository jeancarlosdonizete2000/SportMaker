import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { hashPassword, verifyPassword, signJwtToken, verifyJwtToken } from './security.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Garante conexão com o MongoDB em ambientes Serverless (Vercel) e força o banco oficial `sport_maker_db`
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sport_maker_db';
let isConnected = false;
async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Erro ao conectar no MongoDB Atlas:', err.message);
    res.status(500).json({ message: 'Erro de conexão com o banco de dados.' });
  }
});

const PORT = process.env.PORT || 5000;
const EXPECTED_API_KEY = process.env.MONGODB_API_KEY || process.env.VITE_MONGODB_API_KEY;

const rawMongoUri = process.env.MONGODB_URI;
if (!rawMongoUri) {
  console.error('❌ Erro: MONGODB_URI não definida nas variáveis de ambiente.');
  process.exit(1);
}
const MONGODB_URI = rawMongoUri.replace(/:<([^>]+)>@/, ':$1@');

// Schema Mongoose para Atletas e Proprietários de Arena com `passwordHash` criptografado e Assinatura PRO
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['player', 'owner'], default: 'player', required: true },
    arenaName: { type: String, default: null },
    cnpj: { type: String, default: null },
    favoriteSport: { type: String, default: 'society' },
    positionRole: { type: String, default: 'Atleta Sport Maker' },
    customTag: { type: String, default: 'Atleta Iniciante' },
    ovr: { type: Number, default: 0 },
    pixKey: { type: String, default: '' },
    avatar: { type: String, default: '' },
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
    status: { type: String, default: 'Confirmada' },
    participants: {
      type: [
        {
          userId: { type: String },
          name: { type: String },
          avatar: { type: String },
          ovr: { type: Number, default: 88 },
          role: { type: String, default: 'Solicitante' },
          status: { type: String, default: 'Confirmada' },
          evaluated: { type: Boolean, default: false },
          evaluationStars: { type: Number, default: null },
        },
      ],
      default: [],
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
    rating: { type: Number, default: 4.9 },
    reviewsCount: { type: Number, default: 42 },
    pricePerHour: { type: Number, default: 200 },
    pricePerPlayer: { type: Number, default: 20 },
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

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'player',
      arenaName: role === 'owner' ? arenaName : null,
      cnpj: role === 'owner' ? cnpj : null,
      favoriteSport: role === 'player' ? favoriteSport || 'society' : null,
      ovr: 0,
      avatar: avatar || '',
    });

    const token = signJwtToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
      mode: 'mongodb_atlas_live',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao registrar no MongoDB.' });
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
      avatar,
      positionRole,
      customTag,
      pixKey,
      locationConsentAccepted,
      userLocation,
    } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof nickname === 'string') updates.nickname = nickname.trim();
    if (typeof avatar === 'string') updates.avatar = avatar.trim();
    if (typeof positionRole === 'string') updates.positionRole = positionRole;
    if (typeof customTag === 'string') updates.customTag = customTag;
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
      rating: 5.0,
      reviewsCount: 0,
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

// GET /api/arenas - Lista arenas cadastradas no MongoDB (público + usado pelos atletas)
app.get('/api/arenas', async (req, res) => {
  try {
    const arenas = await Arena.find().sort({ createdAt: -1 });
    return res.json({ arenas });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao buscar arenas.' });
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
      pricePerHour: Number(payload.pricePerHour) || 180,
      pricePerPlayer: Number(payload.pricePerPlayer) || 20,
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
    return res.json({ arena, message: 'Configurações da arena salvas no MongoDB com sucesso!' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao atualizar arena.' });
  }
});

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

    const parsedCourtAmount = Number(courtAmount) || arena.pricePerHour || 200;
    const parsedProductsAmount = Number(productsAmount) || 0;

    const newBooking = await Booking.create({
      arenaId: String(arena._id),
      ownerId: String(arena.ownerId),
      arenaName: arena.name,
      courtId: courtId || 'c1',
      courtName: courtName || arena.courts?.[0]?.name || 'Quadra Principal',
      surface: surface || arena.courts?.[0]?.surface || 'Grama Sintética',
      sport: sport || arena.courts?.[0]?.sport || 'Futebol Society',
      dateLabel: dateLabel || 'Hoje',
      slotTime: slotTime || '19:00',
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

    // Marca o horário como ocupado na grade da arena se for para Hoje
    if ((dateLabel || 'Hoje') === 'Hoje') {
      const slotIndex = arena.slots.findIndex((s) => s.time === slotTime);
      if (slotIndex >= 0) {
        arena.slots[slotIndex].status = 'booked';
      } else {
        arena.slots.push({ time: slotTime, status: 'booked', highlight: '', discount: '' });
      }
      await arena.save();
    }

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

    // Se cancelado, libera o horário na arena
    if (req.body.bookingStatus === 'cancelled') {
      const arena = await Arena.findById(booking.arenaId);
      if (arena) {
        const slotIdx = arena.slots.findIndex((s) => s.time === booking.slotTime);
        if (slotIdx >= 0) {
          arena.slots[slotIdx].status = 'available';
          await arena.save();
        }
      }
    }

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
    ovr: u.ovr ?? 0,
    avatar: u.avatar || '',
    isPro: Boolean(u.isPro && u.proStatus === 'active'),
    matchesCount: u.matchesCount || 0,
    mvpCount: u.mvpCount || 0,
    status: 'Atleta Cadastrado',
    isOnline: true,
    mutualMatches: 0,
  };
}

// GET /api/friends - Retorna a lista real de amigos do usuário autenticado (vazia para novas contas)
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

    const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];
    const validObjectIds = friendIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const friendDocs =
      validObjectIds.length > 0
        ? await User.find({ _id: { $in: validObjectIds } })
        : [];

    // Sugestões reais: outros usuários cadastrados no banco que ainda não são amigos
    const suggestionsDocs = await User.find({
      _id: { $nin: [currentUser._id, ...validObjectIds] },
      role: 'player',
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      friends: friendDocs.map(formatPublicPlayer),
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

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const foundUsers = await User.find({
      _id: { $ne: decoded.sub },
      $or: [{ name: regex }, { nickname: regex }, { email: regex }],
    })
      .sort({ name: 1 })
      .limit(20);

    return res.json({
      users: foundUsers.map((u) => ({
        ...formatPublicPlayer(u),
        isFriend: friendSet.has(String(u._id)),
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao pesquisar usuários.' });
  }
});

// POST /api/friends/:targetId - Adiciona um usuário à lista de amigos (vínculo mútuo no MongoDB)
app.post('/api/friends/:targetId', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const targetId = String(req.params.targetId);
    if (!mongoose.Types.ObjectId.isValid(targetId) || targetId === String(decoded.sub)) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await User.findByIdAndUpdate(decoded.sub, {
      $addToSet: { friends: targetId },
    });
    await User.findByIdAndUpdate(targetId, {
      $addToSet: { friends: String(decoded.sub) },
    });

    return res.json({
      message: `${targetUser.name} adicionado aos seus amigos!`,
      friend: formatPublicPlayer(targetUser),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao adicionar amigo.' });
  }
});

// DELETE /api/friends/:targetId - Remove um usuário da lista de amigos
app.delete('/api/friends/:targetId', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    const targetId = String(req.params.targetId);
    await User.findByIdAndUpdate(decoded.sub, {
      $pull: { friends: targetId },
    });
    await User.findByIdAndUpdate(targetId, {
      $pull: { friends: String(decoded.sub) },
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
  const participant = (m.participants || []).find(
    (p) => String(p.userId) === String(currentUserId)
  );
  const isHost = String(m.hostId) === String(currentUserId);
  return {
    id: String(m._id),
    _id: String(m._id),
    hostId: m.hostId,
    title: m.title,
    arenaId: m.arenaId,
    arena: m.arena,
    neighborhood: m.neighborhood || 'Região Verificada',
    distance: m.distance || '1.5 km',
    time: m.time,
    date: m.time,
    totalSlots: m.totalSlots || 14,
    filledSlots: m.filledSlots || (m.participants?.length || 1),
     playersCount: `${m.filledSlots || 1}/${m.totalSlots || 14}`,
    pricePerPlayer: m.pricePerPlayer || 20,
    neededPositions: m.neededPositions || [],
    extras: m.extras || [],
    role: isHost ? 'Organizador (Host)' : participant?.role || 'Atleta Participante',
    status: participant?.status || m.status || 'Confirmada',
    evaluated: Boolean(participant?.evaluated),
    evaluationStars: participant?.evaluationStars || null,
    isProHost: Boolean(m.isProHost),
    freeBallIncluded: Boolean(m.freeBallIncluded),
    host: {
      id: m.hostId,
      name: m.hostName,
      rating: m.hostRating ?? 0,
      isPro: Boolean(m.isProHost),
      avatar: m.hostAvatar || '',
    },
    participants: m.participants || [],
  };
}

// GET /api/lobbies - Lista partidas públicas abertas reais do MongoDB
app.get('/api/lobbies', async (req, res) => {
  try {
    const matches = await Match.find({ isPublicLobby: true }).sort({ createdAt: -1 }).limit(30);
    return res.json({
      lobbies: matches.map((m) => formatMatchForClient(m, null)),
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
      status: payload.status || 'Confirmada',
      participants: [
        {
          userId: String(user._id),
          name: user.name,
          avatar: user.avatar,
          ovr: user.ovr || 88,
          role: payload.role || 'Organizador (Host)',
          status: payload.status || 'Confirmada',
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
      match.filledSlots = Math.max(1, match.participants.length);
      await match.save();
      return res.json({
        joined: false,
        match: formatMatchForClient(match, userId),
      });
    }

    if (existingIdx < 0) {
      match.participants.push({
        userId,
        name: user.name,
        avatar: user.avatar,
        ovr: user.ovr || 88,
        role: isPro
          ? `⚡ Prioridade PRO na Fila (Host: ${match.hostName})`
          : `Solicitante (Host: ${match.hostName})`,
        status: isPro
          ? 'Prioridade VIP Confirmada • Topo da Fila'
          : 'Solicitação Enviada • Aguardando Host',
        evaluated: false,
      });
      match.filledSlots = match.participants.length;
      await match.save();
    }

    return res.json({
      joined: true,
      match: formatMatchForClient(match, userId),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao participar da partida.' });
  }
});

// DELETE /api/matches/:id - Cancela ou sai de uma partida
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
      await Match.findByIdAndDelete(match._id);
    } else {
      match.participants = match.participants.filter((p) => String(p.userId) !== userId);
      match.filledSlots = Math.max(1, match.participants.length);
      await match.save();
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Erro ao cancelar partida.' });
  }
});

// POST /api/evaluations - Computa avaliação da Arena (1 a 5 estrelas) e notas dos Jogadores (0 a 10)
app.post('/api/evaluations', async (req, res) => {
  try {
    const decoded = getAuthenticatedUserFromReq(req);
    const { matchId, arenaName, arenaStars, mvpPlayerId, playerRatings = [] } = req.body || {};

    let updatedArena = null;
    if (arenaName && typeof arenaStars === 'number') {
      const arena = await Arena.findOne({
        name: { $regex: new RegExp(arenaName.split('•')[0].trim(), 'i') },
      });
      if (arena) {
        const currentCount = arena.reviewsCount || 0;
        const currentRating = arena.rating || 5.0;
        const newCount = currentCount + 1;
        const newRating = Number(
          ((currentRating * currentCount + arenaStars) / newCount).toFixed(1)
        );
        arena.reviewsCount = newCount;
        arena.rating = newRating;
        await arena.save();
        updatedArena = {
          name: arena.name,
          rating: arena.rating,
          reviewsCount: arena.reviewsCount,
        };
      }
    }

    // Marca a partida como avaliada para o usuário atual
    if (matchId && mongoose.Types.ObjectId.isValid(matchId) && decoded?.sub) {
      const match = await Match.findById(matchId);
      if (match) {
        const part = match.participants.find((p) => String(p.userId) === String(decoded.sub));
        if (part) {
          part.evaluated = true;
          part.evaluationStars = arenaStars || 5;
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
