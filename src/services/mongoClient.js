/**
 * Configuração de conexão do Frontend com o Backend.
 * Nenhuma credencial de banco, senha, usuário de banco ou API Key secreta
 * fica armazenada no código do frontend.
 */
export const MONGO_CONFIG = {
  restApiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  database: 'sport_maker_db',
};
