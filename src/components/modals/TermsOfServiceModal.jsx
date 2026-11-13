import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

const STORAGE_TERMS_KEY = 'sportmaker_terms_accepted_v1';

export default function TermsOfServiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState('terms'); // 'terms' | 'privacy' | 'community'
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TERMS_KEY);
      if (!saved) {
        setIsOpen(true);
      } else {
        const parsed = JSON.parse(saved);
        if (!parsed?.accepted) setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (!checked) return;
    localStorage.setItem(
      STORAGE_TERMS_KEY,
      JSON.stringify({
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: '1.0',
      })
    );
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-dark-900 border border-white/15 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-dark-950/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
              <ShieldCheck className="w-4 h-4" /> Bem-vindo ao Sport Maker
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Termos de Uso, Privacidade (LGPD) & Diretrizes
            </h2>
            <p className="text-xs text-slate-400">
              Para acessar e utilizar o aplicativo Sport Maker, leia e aceite os documentos abaixo.
            </p>
          </div>
        </div>

        {/* Document Switcher Tabs */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-dark-950/40 border-b border-white/10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeDoc === 'terms'
                ? 'bg-neon text-dark-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Termos de Uso
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeDoc === 'privacy'
                ? 'bg-emerald-400 text-dark-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Política de Privacidade (LGPD)
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('community')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeDoc === 'community'
                ? 'bg-amber-400 text-dark-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Diretrizes da Comunidade
          </button>
        </div>

        {/* Scrollable Legal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed flex-1">
          {activeDoc === 'terms' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg text-white">
                TERMOS DE USO DO APLICATIVO SPORT MAKER
              </h3>
              <p>
                Estes Termos de Uso regulam o acesso e a utilização do aplicativo Sport Maker, uma plataforma tecnológica que atua como intermediadora entre usuários desportistas e proprietários de espaços esportivos. Ao acessar, cadastrar-se ou utilizar nossos serviços, você concorda expressamente com as condições aqui estabelecidas, em conformidade com o Marco Civil da Internet (Lei nº 12.965/2014) e demais legislações brasileiras aplicáveis.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Natureza do Serviço e Papel da Plataforma</h4>
                <p>
                  O Sport Maker é estritamente uma plataforma de tecnologia (Software as a Service - SaaS e Marketplace) que oferece infraestrutura digital para agendamentos online, gestão financeira de locais esportivos e um feed social para descoberta de jogadores.
                </p>
                <p>
                  <strong>1.1.</strong> O aplicativo não é proprietário, administrador ou fiador de nenhuma das quadras, complexos esportivos ou instalações físicas listadas na plataforma.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">2. Pagamentos, Taxas e Transações Financeiras</h4>
                <p>
                  <strong>2.1. Processamento de Pagamentos:</strong> Todos os pagamentos de reservas realizados via aplicativo são processados por gateways de pagamento parceiros. O Sport Maker atua apenas na facilitação do repasse de valores.
                </p>
                <p>
                  <strong>2.2. Taxa de Serviço:</strong> Poderá ser aplicada uma taxa de serviço ou conveniência sobre o valor do agendamento, cujo percentual ou valor fixo será claramente exibido no momento do checkout, antes da confirmação da reserva.
                </p>
                <p>
                  <strong>2.3. Repasses aos Proprietários:</strong> O repasse dos valores referentes aos agendamentos para os proprietários das quadras seguirá o cronograma de liquidação do painel financeiro, descontadas as taxas de intermediação acordadas em contrato específico (B2B).
                </p>
                <p>
                  <strong>2.4. Política de Cancelamento e Estorno:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Cancelamentos solicitados pelo usuário com a antecedência mínima estipulada pelo proprietário do local no momento da reserva darão direito ao estorno integral, abatidas eventuais taxas de transação da operadora do cartão.
                  </li>
                  <li>
                    O processo de reembolso será efetuado no mesmo método de pagamento utilizado, respeitando os prazos das instituições financeiras envolvidas.
                  </li>
                </ul>
                <p>
                  <strong>2.5. No-Show (Não Comparecimento):</strong> O não comparecimento do usuário no horário agendado, sem o cancelamento prévio dentro da janela permitida, configurará "no-show". Nestes casos, não haverá reembolso do valor pago, e o repasse ao proprietário será efetuado integralmente.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">3. Direitos de Imagem e Propriedade Intelectual</h4>
                <p>
                  <strong>3.1. Conteúdo Gerado pelo Usuário:</strong> Ao criar um perfil, publicar fotos, vídeos ou textos no feed de descoberta do Sport Maker, o usuário declara ser o titular dos direitos autorais e de imagem sobre tal conteúdo ou possuir as devidas autorizações legais.
                </p>
                <p>
                  <strong>3.2. Licença de Uso:</strong> O usuário concede ao Sport Maker uma licença não exclusiva, gratuita, transferível e global para armazenar, exibir, reproduzir e distribuir os conteúdos publicados exclusivamente para fins de operação, melhoria e promoção da própria plataforma.
                </p>
                <p>
                  <strong>3.3. Violações:</strong> O Sport Maker não corrobora violações de propriedade intelectual e removerá prontamente qualquer conteúdo mediante denúncia fundamentada, isentando-se de responsabilidade por infrações cometidas diretamente por seus usuários.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">4. Limitação e Isenção de Responsabilidade</h4>
                <p>
                  <strong>4.1. Danos e Acidentes:</strong> Por ser uma plataforma estritamente tecnológica de intermediação, o Sport Maker não se responsabiliza por quaisquer lesões físicas, acidentes, fatalidades ou problemas de saúde que venham a ocorrer com os usuários durante as partidas e eventos organizados através do aplicativo.
                </p>
                <p>
                  <strong>4.2. Segurança e Furtos:</strong> O Sport Maker não possui controle ou responsabilidade sobre a segurança dos complexos esportivos. Furtos, roubos, danos a veículos ou perda de objetos pessoais nas dependências físicas dos parceiros são de responsabilidade exclusiva dos respectivos locais e/ou dos próprios indivíduos.
                </p>
                <p>
                  <strong>4.3. Infraestrutura:</strong> A manutenção, limpeza, adequação estrutural e disponibilidade física das quadras são de total e exclusiva responsabilidade dos proprietários e administradores locais.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg text-emerald-400">
                POLÍTICA DE PRIVACIDADE DO APLICATIVO SPORT MAKER
              </h3>
              <p>
                Esta Política de Privacidade foi elaborada em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018), detalhando como o Sport Maker coleta, utiliza, armazena e protege os seus dados pessoais.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Dados Pessoais Coletados e Base Legal</h4>
                <p>
                  <strong>1.1. Dados de Cadastro:</strong> Coletamos seu nome completo, e-mail, telefone, CPF (para emissão de recibos e segurança transacional) e foto de perfil. A base legal para o tratamento destes dados é a Execução de Contrato (Art. 7º, V, da LGPD).
                </p>
                <p>
                  <strong>1.2. Dados de Utilização e Histórico:</strong> Armazenamos seu histórico de partidas, interações no feed, preferências de esportes e nível de habilidade para personalizar sua experiência.
                </p>
                <p>
                  <strong>1.3. Dados Financeiros:</strong> Não armazenamos dados completos de cartão de crédito. As transações são tokenizadas e processadas diretamente por adquirentes certificadas sob padrões de segurança PCI-DSS.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">2. Tratamento de Dados de Localização (Geolocalização)</h4>
                <p>
                  <strong>2.1. Finalidade:</strong> O Sport Maker utiliza o GPS do seu dispositivo móvel para mapear e sugerir quadras esportivas próximas a você, bem como para conectá-lo a partidas e jogadores em sua região geográfica através do feed social.
                </p>
                <p>
                  <strong>2.2. Base Legal:</strong> O processamento da geolocalização é baseado no seu Consentimento explícito (Art. 7º, I, da LGPD).
                </p>
                <p>
                  <strong>2.3. Controle do Usuário:</strong> O usuário pode, a qualquer momento, conceder, limitar (apenas durante o uso do app) ou revogar a permissão de acesso à geolocalização diretamente nas configurações do sistema operacional do seu dispositivo móvel. A revogação poderá limitar funcionalidades como a descoberta de quadras e jogadores nas proximidades.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">3. Direitos do Titular dos Dados (LGPD)</h4>
                <p>
                  Em conformidade com o Artigo 18 da LGPD, garantimos aos nossos usuários, de forma gratuita e facilitada, os seguintes direitos:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Confirmação e Acesso:</strong> Obter a confirmação de que tratamos seus dados e solicitar uma cópia dos mesmos.
                  </li>
                  <li>
                    <strong>Retificação:</strong> Corrigir dados incompletos, inexatos ou desatualizados diretamente no painel do seu perfil.
                  </li>
                  <li>
                    <strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar a exclusão de seus dados pessoais, ressalvados os dados cuja guarda seja obrigatória por lei (ex: registros de acesso exigidos pelo Marco Civil da Internet por 6 meses, ou dados de transações financeiras para fins fiscais).
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Requisitar a exportação dos seus dados cadastrais em formato estruturado.
                  </li>
                  <li>
                    <strong>Revogação do Consentimento:</strong> Retirar permissões previamente concedidas, como recebimento de marketing ou rastreamento de GPS.
                  </li>
                </ul>
                <p>
                  Para exercer seus direitos, o usuário deve enviar um e-mail para o canal do Encarregado de Dados (DPO) disponibilizado na seção de Ajuda do aplicativo.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'community' && (
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg text-amber-400">
                DIRETRIZES DA COMUNIDADE SPORT MAKER
              </h3>
              <p>
                O Sport Maker foi criado para promover o esporte, a saúde e a integração social de forma respeitosa e segura. Estas Diretrizes de Comunidade aplicam-se a todas as interações no aplicativo (feed, chats, avaliações) e ao comportamento offline durante os eventos agendados.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Regras de Conduta e Convivência</h4>
                <p>
                  <strong>1.1. Ambiente Respeitoso:</strong> Trate todos os usuários, adversários, parceiros de equipe e funcionários dos complexos esportivos com respeito. A rivalidade esportiva deve se limitar ao jogo, preservando o espírito de fair play.
                </p>
                <p>
                  <strong>1.2. Veracidade das Informações:</strong> É proibido criar perfis falsos (fakes), utilizar imagens de terceiros sem autorização ou fornecer dados incorretos com a finalidade de fraudar o sistema de agendamento.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> 2. Tolerância Zero
                </h4>
                <p>
                  O Sport Maker mantém uma política de tolerância zero para as seguintes infrações, tanto no ambiente virtual (app) quanto no presencial (quadras):
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Discurso de Ódio e Discriminação:</strong> Qualquer forma de racismo, homofobia, machismo, xenofobia ou intolerância religiosa é estritamente proibida.
                  </li>
                  <li>
                    <strong>Assédio e Bullying:</strong> Perseguições, ameaças, intimidações ou assédio moral e sexual a qualquer usuário.
                  </li>
                  <li>
                    <strong>Violência Física:</strong> Brigas, agressões e comportamentos violentos nas instalações físicas parceiras.
                  </li>
                  <li>
                    <strong>Inadimplência Intencional e Fraude ("Calote"):</strong> Recusar-se a pagar a sua cota da quadra (em rateios organizados pelos jogadores), fraudar comprovantes de pagamento PIX ou abusar do sistema de chargeback do cartão de crédito indevidamente.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">3. Aplicação de Penalidades</h4>
                <p>
                  A violação de qualquer termo destas Diretrizes resultará em ações disciplinares imediatas, analisadas por nossa equipe de moderação:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Advertência:</strong> Aviso formal no aplicativo exigindo adequação de conduta.
                  </li>
                  <li>
                    <strong>Suspensão Temporária:</strong> Bloqueio do acesso ao aplicativo e impossibilidade de realizar novos agendamentos por um período determinado (ex: 7 a 30 dias).
                  </li>
                  <li>
                    <strong>Bloqueio Financeiro:</strong> Retenção temporária de funcionalidades financeiras para usuários que apresentem comportamento suspeito de fraude ou reincidência de cancelamentos abusivos.
                  </li>
                  <li>
                    <strong>Banimento Definitivo:</strong> Exclusão permanente da conta e retenção dos dados atrelados ao CPF para evitar recadastramento do infrator. Em casos de fraude ou violência, os dados poderão ser compartilhados com as autoridades policiais competentes.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Acceptance */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-dark-950/90 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-neon cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
              Li e concordo integralmente com os <strong>Termos de Uso</strong>, a{' '}
              <strong>Política de Privacidade (LGPD)</strong> e as{' '}
              <strong>Diretrizes da Comunidade</strong> do Sport Maker.
            </span>
          </label>

          <button
            type="button"
            disabled={!checked}
            onClick={handleAccept}
            className={`w-full py-3.5 px-6 rounded-xl font-display font-black text-sm flex items-center justify-center gap-2 transition-all ${
              checked
                ? 'bg-emerald-500 hover:bg-emerald-400 text-dark-950'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aceitar e Continuar para o Sport Maker</span>
          </button>
        </div>
      </div>
    </div>
  );
}

