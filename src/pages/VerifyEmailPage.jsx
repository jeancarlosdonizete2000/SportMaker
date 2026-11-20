import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Confirmando seu endereço de e-mail...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link de confirmação inválido ou incompleto.');
      return;
    }

    authService
      .verifyEmailToken(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'E-mail confirmado com sucesso!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Não foi possível confirmar o e-mail.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 border border-white/15 text-center space-y-5">
        <div className="flex justify-center">
          {status === 'loading' ? (
            <div className="w-14 h-14 rounded-2xl bg-neon/15 border border-neon/30 flex items-center justify-center text-neon">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          ) : status === 'success' ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h1 className="font-display font-black text-2xl text-white">
          {status === 'loading'
            ? 'Verificando E-mail...'
            : status === 'success'
              ? 'E-mail Confirmado!'
              : 'Falha na Confirmação'}
        </h1>

        <p className="text-sm text-slate-300">{message}</p>

        {status !== 'loading' && (
          <button
            type="button"
            onClick={() => navigate('/app/arenas')}
            className="w-full py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-sm shadow-neon transition-all flex items-center justify-center gap-2"
          >
            <span>Ir para o Sport Maker</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
