/**
 * Configuração de conexão do Frontend com o Backend.
 * Nenhuma credencial de banco, senha, usuário de banco ou API Key secreta
 * fica armazenada no código do frontend.
 */
const envApiUrl = import.meta.env.VITE_API_URL;
const isLocalhostUrl = envApiUrl && /localhost|127\.0\.0\.1/.test(envApiUrl);

export const MONGO_CONFIG = {
  restApiUrl:
    import.meta.env.PROD && (!envApiUrl || isLocalhostUrl)
      ? '/api'
      : envApiUrl || 'http://localhost:5000/api',
  database: 'sport_maker_db',
};
