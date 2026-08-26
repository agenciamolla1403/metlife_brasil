#!/usr/bin/env python3
"""
wrap_adsplay.py — aplica o wrapper da Central do Cliente num HTML de proposta
da Adsplay, preservando 100% do design interno.

Uso:
    python3 docs/scripts/wrap_adsplay.py <proposta_bruta.html> <destino.html>

Cada passo é idempotente na prática porque roda sempre sobre o arquivo BRUTO
que a Adsplay manda — nunca sobre um arquivo já wrapado. Se um passo não
encontrar exatamente 1 ocorrência do alvo, o script aborta em vez de gerar
saída silenciosamente errada (o HTML da Adsplay muda de versão pra versão).

Passos:
  1. favicon
  2. topbar da proposta assenta abaixo do header global (sticky offset)
  3. topbar: nav rola em vez de espremer o selo de periodo
  4. assets globais DEPOIS do <style> da proposta (especificidade)
  5. <body data-proposta-id> + breadcrumb .page-subbar + download do xlsx
  6. remove "Preparado por · Vinicius Carleto" do hero
  7. troca o rodape de contatos da Adsplay pelo rodape padrao da Central
"""
import sys
import io

PROPOSTA_ID = 'nfl'
BREADCRUMB_LABEL = 'Campanha NFL'
XLSX = '/adsplay/plano-nfl.xlsx'
XLSX_DOWNLOAD = 'Plano_Adsplay_NFL_MetLife_2026.xlsx'


def main(src, dst):
    s = io.open(src, encoding='utf8').read()

    def rep(old, new, label):
        nonlocal s
        n = s.count(old)
        if n != 1:
            sys.exit(f'ABORTADO no passo "{label}": esperava 1 ocorrencia, achei {n}.\n'
                     f'O HTML da Adsplay provavelmente mudou. Ajuste o script.')
        s = s.replace(old, new)

    # 1. favicon
    rep('<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<link rel="icon" type="image/png" href="/img/favicon.png">',
        'favicon')

    # 2. topbar sticky abaixo do header global
    rep('  header.topbar{\n    position:sticky;top:0;z-index:50;',
        '  header.topbar{\n'
        '    /* Wrapper: fica abaixo do header global da Central do Cliente */\n'
        '    position:sticky;top:var(--mlh-header-h,60px);z-index:30;',
        'topbar-sticky')

    # 3. topbar: nav rola, selo de periodo nao quebra
    rep('  header.topbar .wrap{\n'
        '    display:flex;align-items:center;justify-content:space-between;\n'
        '    height:64px;\n'
        '  }',
        '  header.topbar .wrap{\n'
        '    display:flex;align-items:center;justify-content:space-between;\n'
        '    height:64px;\n'
        '    gap:24px; /* Wrapper: separa nav do selo de periodo */\n'
        '  }',
        'topbar-wrap')

    rep('  header.topbar nav{display:flex;gap:28px;font-size:13px;font-weight:500;}',
        '  header.topbar nav{\n'
        '    display:flex;gap:20px;font-size:13px;font-weight:500;\n'
        '    /* Wrapper: em telas medias a nav rola em vez de espremer o selo */\n'
        '    min-width:0;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;\n'
        '  }\n'
        '  header.topbar nav::-webkit-scrollbar{display:none;}',
        'topbar-nav')

    rep('  header.topbar nav a{\n'
        '    text-decoration:none;color:var(--muted);\n'
        '    transition:color .2s;\n'
        '    white-space:nowrap;\n'
        '    margin-left:14px;\n'
        '  }\n'
        '  header.topbar nav a:first-child{margin-left:0;}',
        '  header.topbar nav a{\n'
        '    text-decoration:none;color:var(--muted);\n'
        '    transition:color .2s;\n'
        '    white-space:nowrap;\n'
        '    flex-shrink:0;\n'
        '  }',
        'topbar-links')

    rep('  .topbar-meta{font-size:11px;color:var(--muted);text-transform:uppercase;'
        'letter-spacing:.12em;font-weight:600;}',
        '  .topbar-meta{font-size:11px;color:var(--muted);text-transform:uppercase;'
        'letter-spacing:.12em;font-weight:600;flex-shrink:0;white-space:nowrap;}',
        'topbar-meta')

    # 4. assets globais DEPOIS do <style> da proposta
    rep('</style>\n\n</head>',
        '''</style>

<!-- ============ WRAPPER CENTRAL DO CLIENTE ============ -->
<!-- Carregado DEPOIS do <style> da proposta de proposito: em empate de -->
<!-- especificidade o CSS global vence os seletores nus (a, img, section, footer). -->
<link rel="stylesheet" href="/assets/header.css">
<link rel="stylesheet" href="/assets/breadcrumb.css">
<link rel="stylesheet" href="/assets/footer.css">
<script src="/assets/auth.js"></script>
<script src="/assets/header.js"></script>
<style>
  .subbar-dl{
    display:inline-flex;align-items:center;gap:7px;flex-shrink:0;
    font-size:12.5px;font-weight:700;text-decoration:none;
    color:#003B5C;background:#fff;
    border:1px solid rgba(0,59,92,.14);border-radius:999px;
    padding:7px 14px;transition:all 180ms ease;
  }
  .subbar-dl:hover{background:rgba(127,212,239,.18);border-color:#2DB5DF;transform:translateY(-1px);}
  @media (max-width:760px){.subbar-dl span:last-child{display:none;}}
</style>

</head>''',
        'assets-globais')

    # 5. body + breadcrumb
    rep('<body>\n\n<!-- ============ HEADER ============ -->',
        f'''<body data-proposta-id="{PROPOSTA_ID}">

<div class="page-subbar">
  <div class="page-subbar-inner">
    <span class="crumb"><a href="/">Central do Cliente</a> &nbsp;/&nbsp; <span class="crumb-group">Mídia</span> &nbsp;/&nbsp; <a href="/adsplay">Adsplay</a> &nbsp;/&nbsp; <strong>{BREADCRUMB_LABEL}</strong></span>
    <a href="{XLSX}" class="subbar-dl" download="{XLSX_DOWNLOAD}">
      <span>⬇</span><span>Baixar plano (.xlsx)</span>
    </a>
  </div>
</div>

<!-- ============ HEADER ============ -->''',
        'body-breadcrumb')

    # 6. remove "Preparado por · Vinicius Carleto" do hero
    rep('''        <div>
          <div>Preparado por</div>
          <span>Adsplay · Vinicius Carleto</span>
        </div>
''', '', 'hero-preparado-por')

    # 7. rodape padrao da Central no lugar dos contatos da Adsplay
    ini = s.find('<footer id="contato">')
    fim = s.find('</footer>', ini)
    if ini == -1 or fim == -1:
        sys.exit('ABORTADO no passo "rodape": <footer id="contato"> nao encontrado.')
    s = s[:ini] + '''<footer id="contato" class="site-footer">
  <h2>Vamos colocar essa estratégia em ação?</h2>
  <p>Proposta Adsplay de mídia programática para a Campanha NFL, integrando a estratégia geral da campanha MetLife Brasil 2026. Fale com o time da Molla para detalhar qualquer cenário.</p>
  <div class="brand-footer-row">
    <img src="/img/logo_molla.svg" alt="Molla" class="brand-logo-footer" />
    <p class="brand-footer-text">Agência Molla</p>
  </div>
''' + s[fim:]

    io.open(dst, 'w', encoding='utf8').write(s)

    # Guarda-corpo: nenhum vestigio de contato pessoal deve sobrar
    baixo = s.lower()
    for termo in ['vinicius', 'carleto', 'wa.me', '99430-8721', '@adsplay.com.br']:
        if termo in baixo:
            sys.exit(f'ABORTADO: "{termo}" ainda aparece no HTML final.')

    print(f'ok — {dst} ({len(s.splitlines())} linhas)')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
