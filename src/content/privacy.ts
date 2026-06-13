export type PrivacySection = { heading: string; body: string };
export type PrivacyDoc = { updated: string; intro: string; sections: PrivacySection[] };

/**
 * In-app privacy policy text. Not run through i18next (it is long-form prose,
 * not UI strings) — the screen picks the doc by the current language.
 */
export const PRIVACY_POLICY: Record<'en' | 'pt-BR', PrivacyDoc> = {
  en: {
    updated: 'Last updated: June 13, 2026',
    intro:
      'Log My Dance is private by design. Your dance journal lives only on your device.',
    sections: [
      {
        heading: 'Data we store',
        body: 'Everything you create — classes, movements, videos, templates, tags, and notes — is stored locally on your device in an on-device database and file storage. We have no servers and never receive a copy of this content.',
      },
      {
        heading: 'No account, no tracking',
        body: 'There is no sign-up and no login. We do not use advertising or behavioral analytics, we do not build a profile of you, and we do not sell any data.',
      },
      {
        heading: 'Crash reporting',
        body: 'If enabled by the developer, the app may send anonymous crash and error reports (via Sentry) to help fix bugs. These contain only technical details about the failure — never your notes, names, locations, filenames, or any content you entered.',
      },
      {
        heading: 'Videos and photos',
        body: 'When you import a video, it is copied into private app storage on your device. Media never leaves your device unless you choose to export a backup or share it yourself.',
      },
      {
        heading: 'Backups',
        body: 'You can export a .zip backup of your data. The file is created on your device and only goes where you send it (for example, your own cloud drive or another app). We are not involved in that transfer and cannot access it.',
      },
      {
        heading: 'Permissions',
        body: 'The app requests access to your photo and media library only so you can import videos. It does not access anything else.',
      },
      {
        heading: 'Children',
        body: 'The app is suitable for all ages and does not knowingly collect personal data from anyone.',
      },
      {
        heading: 'Changes',
        body: 'If this policy changes, the date above will change with it. Continued use means you accept the current policy.',
      },
      {
        heading: 'Contact',
        body: 'Questions? Use “Send feedback” in Settings.',
      },
    ],
  },
  'pt-BR': {
    updated: 'Última atualização: 13 de junho de 2026',
    intro:
      'O Log My Dance é privado por padrão. Seu diário de dança fica apenas no seu device.',
    sections: [
      {
        heading: 'Dados que guardamos',
        body: 'Tudo que você cria — aulas, movimentos, vídeos, modelos, tags e notas — é guardado localmente no seu device, em um banco de dados e armazenamento de arquivos no próprio aparelho. Não temos servidores e nunca recebemos uma cópia desse conteúdo.',
      },
      {
        heading: 'Sem conta, sem rastreamento',
        body: 'Não há cadastro nem login. Não usamos publicidade nem análise de comportamento, não criamos um perfil seu e não vendemos nenhum dado.',
      },
      {
        heading: 'Relatório de falhas',
        body: 'Se o desenvolvedor habilitar, o app pode enviar relatórios anônimos de falhas e erros (via Sentry) para ajudar a corrigir bugs. Eles contêm apenas detalhes técnicos da falha — nunca suas notas, nomes, locais, nomes de arquivo ou qualquer conteúdo que você inseriu.',
      },
      {
        heading: 'Vídeos e fotos',
        body: 'Ao importar um vídeo, ele é copiado para o armazenamento privado do app no seu device. A mídia nunca sai do seu aparelho, a menos que você exporte um backup ou compartilhe por conta própria.',
      },
      {
        heading: 'Backups',
        body: 'Você pode exportar um backup .zip dos seus dados. O arquivo é criado no seu device e só vai para onde você enviar (por exemplo, sua própria nuvem ou outro app). Não participamos dessa transferência e não temos acesso a ela.',
      },
      {
        heading: 'Permissões',
        body: 'O app pede acesso à sua galeria de fotos e mídia apenas para você importar vídeos. Não acessa mais nada.',
      },
      {
        heading: 'Crianças',
        body: 'O app é adequado para todas as idades e não coleta dados pessoais de ninguém de forma consciente.',
      },
      {
        heading: 'Alterações',
        body: 'Se esta política mudar, a data acima muda junto. Continuar usando significa que você aceita a política atual.',
      },
      {
        heading: 'Contato',
        body: 'Dúvidas? Use “Enviar feedback” nas Configurações.',
      },
    ],
  },
};
