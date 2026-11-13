/**
 * ============================================================================
 * ESTRUTURA DE REFERÊNCIA BACKEND (Node.js + Express + Mongoose / MongoDB)
 * ============================================================================
 * Este arquivo documenta e exporta o schema esperado pela camada `authService.js`
 * para quando você conectar sua instância MongoDB Atlas ou local (`mongodb://...`).
 *
 * Exemplo de Model Mongoose (`models/User.js` no backend):
 *
 * import mongoose from 'mongoose';
 *
 * const UserSchema = new mongoose.Schema(
 *   {
 *     name: { type: String, required: true, trim: true },
 *     email: { type: String, required: true, unique: true, lowercase: true },
 *     passwordHash: { type: String, required: true },
 *     role: {
 *       type: String,
 *       enum: ['player', 'owner'],
 *       default: 'player',
 *       required: true,
 *     },
 *     // Campos exclusivos para Atletas (role === 'player')
 *     favoriteSport: { type: String, default: 'society' },
 *     ovr: { type: Number, default: 85 },
 *     matchesPlayed: { type: Number, default: 0 },
 *
 *     // Campos exclusivos para Proprietários de Arena (role === 'owner')
 *     arenaName: { type: String, default: null },
 *     cnpj: { type: String, default: null },
 *     phone: { type: String, default: null },
 *   },
 *   { timestamps: true }
 * );
 *
 * export default mongoose.model('User', UserSchema);
 */

export const MONGODB_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  MATCHES: '/api/matches',
  ARENAS: '/api/arenas',
};

