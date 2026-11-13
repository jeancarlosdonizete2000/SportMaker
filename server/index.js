import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { hashPassword, verifyPassword, signJwtToken, verifyJwtToken } from './security.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

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
    positionRole: { type: String, default: 'Atacante / Ala • Futebol Society' },
    customTag: { type: String, default: 'Capitão & Artilheiro' },
    ovr: { type: Number, default: 88 },
    pixKey: { type: String, default: '' },
    avatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
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
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

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
      ovr: role === 'player' ? 88 : null,
      avatar:
        avatar ||
        (role === 'owner'
          ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'),
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
    if (typeof avatar === 'string' && avatar.trim()) updates.avatar = avatar.trim();
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

// Helper: Inicializa Arena padrão e Agendamentos iniciais no MongoDB caso o proprietário ainda não tenha nenhum
async function ensureOwnerDefaultArenaAndBookings(ownerUser) {
  const ownerId = String(ownerUser._id);
  let arenas = await Arena.find({ ownerId }).sort({ createdAt: -1 });

  if (arenas.length === 0) {
    const defaultArena = await Arena.create({
      ownerId,
      ownerEmail: ownerUser.email,
      name: ownerUser.arenaName || 'Arena Prime Sports & Lounge',
      cnpj: ownerUser.cnpj || '41.892.310/0001-19',
      sport: 'society',
      sportLabel: 'Futebol Society • Grama FIFA Pro',
      distance: '1.2 km',
      neighborhood: 'Vila Olímpia, SP',
      address: 'Av. Dr. Cardoso de Melo, 1450 - Vila Olímpia, São Paulo - SP',
      openingHours: 'Seg a Dom • 07:00 às 00:00',
      description:
        'Complexo esportivo premium com quadras de grama sintética padrão FIFA Quality Pro, amortecimento de impacto, vestiários climatizados e gastrobar completo com vista panorâmica para os jogos.',
      rating: 4.9,
      reviewsCount: 328,
      pricePerHour: 220,
      pricePerPlayer: 18,
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      ],
      amenities: [
        'Estacionamento c/ Manobrista',
        'Churrasqueira Gourmet',
        'Bar & Restaurante',
        'Vestiário VIP',
        'Wi-Fi 6',
      ],
      onSiteServices: [
        {
          title: 'Restaurante & Sports Bar no Local',
          description:
            'Porções, hambúrgueres artesanais, espetinhos, chopp trincando, isotônicos e energéticos.',
          badge: 'Gastronomia & Bebidas',
        },
        {
          title: 'Quiosques de Churrasco Pós-Jogo',
          description:
            '4 churrasqueiras privativas equipadas com cervejeira, som Bluetooth e TV 65".',
          badge: '3º Tempo',
        },
      ],
      courts: [
        {
          id: 'c1',
          name: 'Quadra 1 • Stadium FIFA Pro',
          sport: 'Futebol Society (7x7)',
          surface: 'Grama Sintética 60mm c/ Shockpad',
          covered: true,
          pricePerHour: 220,
        },
        {
          id: 'c2',
          name: 'Quadra 2 • Arena Speed',
          sport: 'Futebol Society (6x6)',
          surface: 'Grama Sintética Monofilamento',
          covered: true,
          pricePerHour: 200,
        },
        {
          id: 'c3',
          name: 'Quadra 3 • Areia Lounge',
          sport: 'Futevôlei & Beach Tennis',
          surface: 'Areia Branca Quartzo Fina',
          covered: false,
          pricePerHour: 150,
        },
      ],
      products: [
        { id: 'p1', name: 'Kit Churrasco Pós-Jogo (Carvão + Gelo)', price: 65, tag: 'Mais pedido' },
        { id: 'p2', name: 'Locação Bola Oficial Penalty S11', price: 15, tag: 'Equipamento' },
        { id: 'p3', name: 'Combo 6x Isotônicos Gelados', price: 48, tag: 'Bebidas' },
      ],
      slots: [
        { time: '17:00', status: 'available', highlight: '', discount: '' },
        { time: '18:00', status: 'booked', highlight: '', discount: '' },
        { time: '19:00', status: 'booked', highlight: 'Horário Nobre', discount: '' },
        { time: '20:00', status: 'available', highlight: 'Horário Nobre', discount: '' },
        { time: '21:00', status: 'booked', highlight: '', discount: '' },
        { time: '22:00', status: 'available', highlight: '', discount: '-15%' },
        { time: '23:00', status: 'available', highlight: '', discount: '' },
      ],
    });

    arenas = [defaultArena];

    // Popula reservas iniciais reais no MongoDB para alimentar o Painel de Ganhos e Quadro de Horários
    const arenaIdStr = String(defaultArena._id);
    await Booking.insertMany([
      {
        arenaId: arenaIdStr,
        ownerId,
        arenaName: defaultArena.name,
        courtId: 'c1',
        courtName: 'Quadra 1 • Stadium FIFA Pro',
        surface: 'Grama Sintética 60mm c/ Shockpad',
        sport: 'Futebol Society (7x7)',
        dateLabel: 'Hoje',
        slotTime: '18:00',
        customerName: 'Gabriel "Flash" Silva',
        customerPhone: '(11) 99412-8831',
        customerEmail: 'gabriel.flash@sportmaker.app',
        isProCustomer: true,
        courtAmount: 187,
        productsAmount: 65,
        totalAmount: 252,
        productsList: ['Kit Churrasco Pós-Jogo (Carvão + Gelo)', 'Bola Oficial Grátis (PRO)'],
        paymentMethod: 'Pix',
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        notes: 'Check-in automático PRO confirmado',
      },
      {
        arenaId: arenaIdStr,
        ownerId,
        arenaName: defaultArena.name,
        courtId: 'c1',
        courtName: 'Quadra 1 • Stadium FIFA Pro',
        surface: 'Grama Sintética 60mm c/ Shockpad',
        sport: 'Futebol Society (7x7)',
        dateLabel: 'Hoje',
        slotTime: '19:00',
        customerName: 'Lucas Mendes',
        customerPhone: '(11) 98211-4090',
        customerEmail: 'lucas@sportmaker.app',
        isProCustomer: false,
        courtAmount: 220,
        productsAmount: 63,
        totalAmount: 283,
        productsList: ['Locação Bola Oficial Penalty S11', 'Combo 6x Isotônicos Gelados'],
        paymentMethod: 'Pix',
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        notes: 'Dividido entre 14 atletas via Pix Split',
      },
      {
        arenaId: arenaIdStr,
        ownerId,
        arenaName: defaultArena.name,
        courtId: 'c2',
        courtName: 'Quadra 2 • Arena Speed',
        surface: 'Grama Sintética Monofilamento',
        sport: 'Futebol Society (6x6)',
        dateLabel: 'Hoje',
        slotTime: '21:00',
        customerName: 'Rodrigo Alencar',
        customerPhone: '(11) 97102-3319',
        customerEmail: 'rodrigo@empresa.com.br',
        isProCustomer: false,
        courtAmount: 200,
        productsAmount: 65,
        totalAmount: 265,
        productsList: ['Kit Churrasco Pós-Jogo (Carvão + Gelo)'],
        paymentMethod: 'Cartão',
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        notes: 'Reserva mensal corporativa',
      },
      {
        arenaId: arenaIdStr,
        ownerId,
        arenaName: defaultArena.name,
        courtId: 'c3',
        courtName: 'Quadra 3 • Areia Lounge',
        surface: 'Areia Branca Quartzo Fina',
        sport: 'Futevôlei & Beach Tennis',
        dateLabel: 'Amanhã',
        slotTime: '19:00',
        customerName: 'Camila Rocha',
        customerPhone: '(11) 98872-1104',
        customerEmail: 'camila.bt@sportmaker.app',
        isProCustomer: true,
        courtAmount: 150,
        productsAmount: 48,
        totalAmount: 198,
        productsList: ['Combo 6x Isotônicos Gelados'],
        paymentMethod: 'Pix',
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        notes: 'Torneio Rei da Quadra Beach Tennis',
      },
    ]);
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

// POST /api/evaluations - Computa avaliação da Arena (1 a 5 estrelas) e notas dos Jogadores (0 a 10)
app.post('/api/evaluations', async (req, res) => {
  try {
    const { arenaName, arenaStars, playerRatings = [] } = req.body || {};

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
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado ao MongoDB Atlas: footplus.yliizzy.mongodb.net/sport_maker_db');

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

startServer();
