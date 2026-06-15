
// ─── State ───────────────────────────────────────────────────────────────────
let sessionToken = localStorage.getItem("SESSION_TOKEN") || "";
let currentRole  = "";
let currentUser  = "";
let statsTimer   = null, usersTimer = null, xrayTimer = null;
let formCollapsed = true;
let tlsForwardersState = [];
let managedTlsForwardersState = [];
let editingXrayClientId = null;
let wzInbounds = [];
let wzLoadedFullConfig = null;
let wzLoadedConfigText = "";
let wzLoadedServerID = null;
let wzDirty = false;
let dashboardCache = { sshUsers: [], xrayInbounds: [], me: null };
let currentTab = "dashboard";
let inboundsRefreshInFlight = false;
let lastInboundsStructure = "";
let serversCache = [];
let selectedSSHServerID = localStorage.getItem("SSH_SERVER_ID") || "local";
let selectedXrayServerID = localStorage.getItem("XRAY_SERVER_ID") || "local";
let configuringServerID = "";


// ─── Language / i18n ─────────────────────────────────────────────────────────
const SUPPORTED_LANGS = ["pt-BR", "en-US"];
const LANG_STORAGE_KEY = "PANEL_LANG";
const I18N_TEXT = {
  "en-US": {
    "Dashboard":"Dashboard","Overview":"Overview","Accounts":"Accounts","Administration":"Administration","Server":"Server","System":"System","Settings":"Settings","Traffic":"Traffic","Monitoring":"Monitoring",
    "SSH / SlowDNS":"SSH / SlowDNS","Xray Users":"Xray Users","Resellers":"Resellers","Logs":"Logs","VnStat":"VnStat","VPN Control":"VPN Control","DragonCore":"DragonCore",
    "SSH Panel":"SSH Panel","Sign in with your admin or reseller credentials.":"Sign in with your admin or reseller credentials.","Username":"Username","Password":"Password","Sign in":"Sign in","Logout":"Logout","Open menu":"Open menu","Toggle theme":"Toggle theme","Language":"Language",
    "Total accounts":"Total accounts","active":"active","expired":"expired","available limit":"Available limit","Loading quota…":"Loading quota…","Active connections":"Active connections","SSH + Xray online now":"SSH + Xray online now","Ready for resellers":"Ready for resellers","Server monitoring in real time":"real-time monitoring","CPU":"CPU","RAM":"RAM","Network":"Network","Processor load":"Processor load","Memory used":"Memory used","Total":"Total","Total --":"Total --","RX -- · TX -- Mb/s":"RX -- · TX -- Mb/s",
    "Quick actions":"Quick actions","simple":"simple","Create SSH":"Create SSH","Create Xray":"Create Xray","New reseller":"New reseller","Configure services":"Configure services","User, password, expiry and limit.":"User, password, expiry and limit.","UUID, label, expiry and connections.":"UUID, label, expiry and connections.","Plan, expiry and account limit.":"Plan, expiry and account limit.","Ports, DNSTT, UDPGW and TLS.":"Ports, DNSTT, UDPGW and TLS.","My quota":"My quota","Loading…":"Loading…","Loading...":"Loading...",
    "My Account":"My Account","Users (used / max)":"Users (used / max)","Users (used/max)":"Users (used/max)","Expires":"Expires","Status":"Status","Users":"Users","User":"User","Auth":"Auth","Conn":"Conn","Max":"Max","Up":"Up","Dn":"Dn","Owner":"Owner","Actions":"Actions","Create / update user":"Create / update user","Create / edit user form":"Create / edit user form","Show form":"Show form","Hide form":"Hide form","TOTP Secret":"TOTP Secret","TOTP Period (s)":"TOTP Period (s)","TOTP Window":"TOTP Window","TOTP Digits":"TOTP Digits","Allow static password too":"Allow static password too","Max connections":"Max connections","Expires at":"Expires at","Max Upload (Mb/s)":"Max Upload (Mb/s)","Max Download (Mb/s)":"Max Download (Mb/s)","Save user":"Save user","Cancel":"Cancel","Gen":"Gen","Copy":"Copy","Edit":"Edit","Del":"Del","Reload":"Reload","Refresh":"Refresh","+ New":"+ New","+ Add":"+ Add","Add":"Add","Remove":"Remove",
    "Running":"Running","Stopped":"Stopped","running":"running","stopped":"stopped","disabled":"disabled","Counters API":"Counters API","Repair counters":"Repair counters","Start":"Start","Stop":"Stop","Restart":"Restart","Inbounds & Clients":"Inbounds & Clients","Inbounds & clients":"Inbounds & clients","Xray Config":"Xray Config","Visual":"Visual","JSON":"JSON","Config editor":"Config editor","Load JSON":"Load JSON","Save & Restart":"Save & Restart","System Logs":"System Logs","last 200 lines":"last 200 lines","Xray clients":"Xray clients","Xray Core":"Xray Core","Enabled":"Enabled","Online":"Online","PID":"PID","Uptime":"Uptime","Counters API ready.":"Counters API ready.","Counters API ready at {server}.":"Counters API ready at {server}.","Online counters need Stats API repair.":"Online counters need Stats API repair.","Online counters: {error}":"Online counters: {error}","Needs repair":"Needs repair","OK":"OK",
    "UUID":"UUID","Email":"Email","Email / label":"Email / label","Display Name":"Display Name","Expiry Date":"Expiry Date","Max Connections":"Max Connections","(0 = unlimited)":"(0 = unlimited)","auto-generate":"auto-generate","Name":"Name","Expiry":"Expiry","Online":"Online","Traffic":"Traffic","No clients.":"No clients.","No VLESS/VMess/Trojan inbounds found.":"No VLESS/VMess/Trojan inbounds found.","Add Client":"Add Client","+ Add Client":"+ Add Client","Copied client ID.":"Copied client ID.","UUID required.":"UUID required.","Client {id}… added. Restarting Xray…":"Client {id}… added. Restarting Xray…","Client removed. Restarting Xray…":"Client removed. Restarting Xray…","Remove client {id}… from {tag}?":"Remove client {id}… from {tag}?","New client data is available; editing was preserved.":"New client data is available; editing was preserved.","Config loaded.":"Config loaded.","Invalid JSON: {error}":"Invalid JSON: {error}","Saved. Restarting Xray…":"Saved. Restarting Xray…","Saved.":"Saved.","Saving…":"Saving…","Error: {error}":"Error: {error}","Error loading inbounds.":"Error loading inbounds.",
    "Active":"Active","Suspended":"Suspended","Expired":"Expired","Unlimited":"Unlimited","No expiration":"No expiration","Idle":"idle","online":"online","offline":"offline","idle":"idle","ago":"ago","Active ({days}d)":"Active ({days}d)","No limit set by admin":"No limit set by admin","{remaining} accounts available · {pct}% used":"{remaining} accounts available · {pct}% used","{used} used · unlimited":"{used} used · unlimited","{used}/{max} used · {pct}% of plan":"{used}/{max} used · {pct}% of plan","SSH {ssh} · Xray {xray}":"SSH {ssh} · Xray {xray}","{ssh} SSH · {xray} Xray online":"{ssh} SSH · {xray} Xray online","{online} online · {active} active · {expired} expired · Core: {core}":"{online} online · {active} active · {expired} expired · Core: {core}","{count} online":"{count} online","{count} total · {active} active · {online} online":"{count} total · {active} active · {online} online",
    "New user.":"New user.","TOTP secret generated.":"TOTP secret generated.","Loaded.":"Loaded.","Last reload: {time}":"Last reload: {time}","Error loading users.":"Error loading users.","Editing {name}":"Editing {name}","Deleting {name}…":"Deleting {name}…","Deleted.":"Deleted.","Error deleting.":"Error deleting.","Delete user \"{name}\"?":"Delete user \"{name}\"?","Invalid credentials.":"Invalid credentials.","Account suspended or expired.":"Account suspended or expired.","Login failed.":"Login failed.","Network error.":"Network error.","Session expired — please sign in again.":"Session expired — please sign in again.",
    "Create Reseller":"Create Reseller","Create / edit reseller form":"Create / edit reseller form","Save reseller":"Save reseller","New reseller.":"New reseller.","Edit: {name}":"Edit: {name}","Editing {name}.":"Editing {name}.","Deleting {name}…":"Deleting {name}…","Error loading.":"Error loading.","Resellers list":"Resellers list","Max SSH users (0 = unlimited)":"Max SSH users (0 = unlimited)",
    "Server Load":"Server Load","Interfaces":"Interfaces","Interface":"Interface","Rx Mbps":"Rx Mbps","Tx Mbps":"Tx Mbps","Rx Total":"Rx Total","Tx Total":"Tx Total","Updated: {time}":"Updated: {time}","Error loading stats.":"Error loading stats.","Normal load":"Normal load","Moderate load":"Moderate load","High load":"High load","Cleaning interface totals…":"Cleaning interface totals…","Interface totals cleaned. Auto-clean remains every 30 days.":"Interface totals cleaned. Auto-clean remains every 30 days.","Error cleaning totals: {error}":"Error cleaning totals: {error}",
    "VnStat Usage":"VnStat Usage","Today total":"Today total","This month total":"This month total","Interfaces tracked":"Interfaces tracked","daily / monthly":"daily / monthly","Daily usage":"Daily usage","Monthly usage":"Monthly usage","Day":"Day","Month":"Month","Clean usage":"Clean usage","Clean VnStat history":"Clean VnStat history","VnStat history does not auto-clean. Use the button when you want to reset it.":"VnStat history does not auto-clean. Use the button when you want to reset it.","Totals can be cleaned here and auto-clean every 30 days. VnStat history is separate.":"Totals can be cleaned here and auto-clean every 30 days. VnStat history is separate.","Loading VnStat usage…":"Loading VnStat usage…","VnStat history cleaned.":"VnStat history cleaned.","Error loading VnStat usage: {error}":"Error loading VnStat usage: {error}","Error cleaning VnStat history: {error}":"Error cleaning VnStat history: {error}",
    "Panel / system":"Panel / system","Select a log source and click Refresh.":"Select a log source and click Refresh.","Clean panel log":"Clean panel log","No log lines yet.":"No log lines yet.","Panel log cleaned · {path} · max {max}":"Panel log cleaned · {path} · max {max}","Cleaning panel log…":"Cleaning panel log…",
    "Network":"Network","Main Listen (SSH / HTTP)":"Main Listen (SSH / HTTP)","Extra Listen Addresses":"Extra Listen Addresses","(one per line, e.g. 0.0.0.0:8080)":"(one per line, e.g. 0.0.0.0:8080)","SSH & General":"SSH & General","Default Upload Limit (Mbps)":"Default Upload Limit (Mbps)","Default Download Limit (Mbps)":"Default Download Limit (Mbps)","Quiet Logs":"Quiet Logs","User Count Display":"User Count Display","SSH Banner":"SSH Banner","Banner Text":"Banner Text","(shown to connecting SSH clients)":"(shown to connecting SSH clients)","DNSTT Tunnel":"DNSTT Tunnel","Domain":"Domain","UDP Listen":"UDP Listen","Private Key":"Private Key","Public Key":"Public Key","Disable Stats Log":"Disable Stats Log","Disable Console Log":"Disable Console Log","UDP Gateway":"UDP Gateway","Listen":"Listen","Idle Timeout":"Idle Timeout","Map TTL":"Map TTL","Debug Logging":"Debug Logging","TLS Forwarders":"TLS Forwarders","Listen Address":"Listen Address","Certificate":"Certificate","Generate Self-Signed":"Generate Self-Signed","Let's Encrypt (certbot)":"Let's Encrypt (certbot)","Paste PEM text":"Paste PEM text","Custom file paths":"Custom file paths","Cert File":"Cert File","Key File":"Key File","Certificate PEM":"Certificate PEM","Private Key PEM":"Private Key PEM","Add Forwarder":"Add Forwarder","Save Config":"Save Config","All service changes apply live.":"All service changes apply live.","Saved and applied live.":"Saved and applied live.","Saved live with warnings: {warnings}":"Saved live with warnings: {warnings}","Processing…":"Processing…","Listen address required.":"Listen address required.","Domain required.":"Domain required.","Domain and email required.":"Domain and email required.","Cert and key paths required.":"Cert and key paths required.","Added. Save config to apply.":"Added. Save config to apply.","Generating…":"Generating…","Generated ✓ paths set.":"Generated ✓ paths set.","Generating key…":"Generating key…","Key generated. Save config to apply.":"Key generated. Save config to apply.","Loading public key…":"Loading public key…","Self-signed cert generated.":"Self-signed cert generated.","Let's Encrypt cert issued.":"Let's Encrypt cert issued.","PEM saved.":"PEM saved.","Saved ✓ paths set.":"Saved ✓ paths set.","Name, cert PEM, and key PEM required.":"Name, cert PEM, and key PEM required.","Name, cert, and key required.":"Name, cert, and key required.","Name, cert PEM, and key PEM required.":"Name, cert PEM, and key PEM required.","Save Changes":"Save Changes"
  },
  "pt-BR": {
    "Dashboard":"Painel","Overview":"Visão geral","Accounts":"Contas","Administration":"Administração","Server":"Servidor","System":"Sistema","Settings":"Configurações","Traffic":"Tráfego","Monitoring":"Monitoramento",
    "SSH / SlowDNS":"SSH / SlowDNS","Xray Users":"Usuários Xray","Resellers":"Revendedores","Logs":"Logs","VnStat":"VnStat","VPN Control":"Controle VPN","DragonCore":"DragonCore",
    "SSH Panel":"Painel SSH","Sign in with your admin or reseller credentials.":"Entre com suas credenciais de admin ou revendedor.","Username":"Usuário","Password":"Senha","Sign in":"Entrar","Logout":"Sair","Open menu":"Abrir menu","Toggle theme":"Alternar tema","Language":"Idioma",
    "Total accounts":"Total de contas","active":"ativas","expired":"expiradas","available limit":"Limite disponível","Loading quota…":"Carregando cota…","Active connections":"Conexões ativas","SSH + Xray online now":"SSH + Xray online agora","Ready for resellers":"Pronto para revendedores","Server monitoring in real time":"monitoramento em tempo real","CPU":"CPU","RAM":"RAM","Network":"Rede","Processor load":"Carga do processador","Memory used":"Memória usada","Total":"Total","Total --":"Total --","RX -- · TX -- Mb/s":"RX -- · TX -- Mb/s",
    "Quick actions":"Ações rápidas","simple":"simples","Create SSH":"Criar SSH","Create Xray":"Criar Xray","New reseller":"Novo revendedor","Configure services":"Configurar serviços","User, password, expiry and limit.":"Usuário, senha, validade e limite.","UUID, label, expiry and connections.":"UUID, label, validade e conexões.","Plan, expiry and account limit.":"Plano, validade e limite de contas.","Ports, DNSTT, UDPGW and TLS.":"Portas, DNSTT, UDPGW e TLS.","My quota":"Minha cota","Loading…":"Carregando…","Loading...":"Carregando...",
    "My Account":"Minha conta","Users (used / max)":"Usuários (usado / máximo)","Users (used/max)":"Usuários (usado/máximo)","Expires":"Vence em","Status":"Status","Users":"Usuários","User":"Usuário","Auth":"Autenticação","Conn":"Conexões","Max":"Máximo","Up":"Upload","Dn":"Download","Owner":"Dono","Actions":"Ações","Create / update user":"Criar / atualizar usuário","Create / edit user form":"Formulário de criar / editar usuário","Show form":"Mostrar formulário","Hide form":"Ocultar formulário","TOTP Secret":"Segredo TOTP","TOTP Period (s)":"Período TOTP (s)","TOTP Window":"Janela TOTP","TOTP Digits":"Dígitos TOTP","Allow static password too":"Permitir senha estática também","Max connections":"Máx. conexões","Expires at":"Vence em","Max Upload (Mb/s)":"Upload máx. (Mb/s)","Max Download (Mb/s)":"Download máx. (Mb/s)","Save user":"Salvar usuário","Cancel":"Cancelar","Gen":"Gerar","Copy":"Copiar","Edit":"Editar","Del":"Excluir","Reload":"Recarregar","Refresh":"Atualizar","+ New":"+ Novo","+ Add":"+ Adicionar","Add":"Adicionar","Remove":"Remover",
    "Running":"Rodando","Stopped":"Parado","running":"rodando","stopped":"parado","disabled":"desativado","Counters API":"API de contadores","Repair counters":"Reparar contadores","Start":"Iniciar","Stop":"Parar","Restart":"Reiniciar","Inbounds & Clients":"Inbounds e clientes","Inbounds & clients":"Inbounds e clientes","Xray Config":"Configuração Xray","Visual":"Visual","JSON":"JSON","Config editor":"Editor de configuração","Load JSON":"Carregar JSON","Save & Restart":"Salvar e reiniciar","System Logs":"Logs do sistema","last 200 lines":"últimas 200 linhas","Xray clients":"Clientes Xray","Xray Core":"Núcleo Xray","Enabled":"Ativado","Online":"Online","PID":"PID","Uptime":"Tempo ativo","Counters API ready.":"API de contadores pronta.","Counters API ready at {server}.":"API de contadores pronta em {server}.","Online counters need Stats API repair.":"Contadores online precisam de reparo da Stats API.","Online counters: {error}":"Contadores online: {error}","Needs repair":"Precisa de reparo","OK":"OK",
    "UUID":"UUID","Email":"Email","Email / label":"Email / label","Display Name":"Nome de exibição","Expiry Date":"Data de vencimento","Max Connections":"Máx. conexões","(0 = unlimited)":"(0 = ilimitado)","auto-generate":"gerar automaticamente","Name":"Nome","Expiry":"Vencimento","Online":"Online","Traffic":"Tráfego","No clients.":"Nenhum cliente.","No VLESS/VMess/Trojan inbounds found.":"Nenhum inbound VLESS/VMess/Trojan encontrado.","Add Client":"Adicionar cliente","+ Add Client":"+ Adicionar cliente","Copied client ID.":"ID do cliente copiado.","UUID required.":"UUID obrigatório.","Client {id}… added. Restarting Xray…":"Cliente {id}… adicionado. Reiniciando Xray…","Client removed. Restarting Xray…":"Cliente removido. Reiniciando Xray…","Remove client {id}… from {tag}?":"Remover cliente {id}… de {tag}?","New client data is available; editing was preserved.":"Novos dados de cliente disponíveis; sua edição foi preservada.","Config loaded.":"Configuração carregada.","Invalid JSON: {error}":"JSON inválido: {error}","Saved. Restarting Xray…":"Salvo. Reiniciando Xray…","Saved.":"Salvo.","Saving…":"Salvando…","Error: {error}":"Erro: {error}","Error loading inbounds.":"Erro ao carregar inbounds.",
    "Active":"Ativo","Suspended":"Suspenso","Expired":"Expirado","Unlimited":"Ilimitado","No expiration":"Sem vencimento","Idle":"ocioso","online":"online","offline":"offline","idle":"ocioso","ago":"atrás","Active ({days}d)":"Ativo ({days}d)","No limit set by admin":"Sem limite definido pelo admin","{remaining} accounts available · {pct}% used":"{remaining} contas disponíveis · {pct}% usado","{used} used · unlimited":"{used} usadas · sem limite","{used}/{max} used · {pct}% of plan":"{used}/{max} usadas · {pct}% do plano","SSH {ssh} · Xray {xray}":"SSH {ssh} · Xray {xray}","{ssh} SSH · {xray} Xray online":"{ssh} SSH · {xray} Xray online","{online} online · {active} active · {expired} expired · Core: {core}":"{online} online · {active} ativos · {expired} expirados · Core: {core}","{count} online":"{count} online","{count} total · {active} active · {online} online":"{count} total · {active} ativas · {online} online",
    "New user.":"Novo usuário.","TOTP secret generated.":"Segredo TOTP gerado.","Loaded.":"Carregado.","Last reload: {time}":"Último reload: {time}","Error loading users.":"Erro ao carregar usuários.","Editing {name}":"Editando {name}","Deleting {name}…":"Excluindo {name}…","Deleted.":"Excluído.","Error deleting.":"Erro ao excluir.","Delete user \"{name}\"?":"Excluir usuário \"{name}\"?","Invalid credentials.":"Credenciais inválidas.","Account suspended or expired.":"Conta suspensa ou expirada.","Login failed.":"Falha no login.","Network error.":"Erro de rede.","Session expired — please sign in again.":"Sessão expirada — faça login novamente.",
    "Create Reseller":"Criar revendedor","Create / edit reseller form":"Formulário de criar / editar revendedor","Save reseller":"Salvar revendedor","New reseller.":"Novo revendedor.","Edit: {name}":"Editar: {name}","Editing {name}.":"Editando {name}.","Deleting {name}…":"Excluindo {name}…","Error loading.":"Erro ao carregar.","Resellers list":"Lista de revendedores","Max SSH users (0 = unlimited)":"Máximo de usuários SSH (0 = ilimitado)",
    "Server Load":"Carga do servidor","Interfaces":"Interfaces","Interface":"Interface","Rx Mbps":"Rx Mbps","Tx Mbps":"Tx Mbps","Rx Total":"Rx Total","Tx Total":"Tx Total","Updated: {time}":"Atualizado: {time}","Error loading stats.":"Erro ao carregar stats.","Normal load":"Carga normal","Moderate load":"Carga moderada","High load":"Carga alta","Cleaning interface totals…":"Limpando totais das interfaces…","Interface totals cleaned. Auto-clean remains every 30 days.":"Totais das interfaces limpos. A limpeza automática continua a cada 30 dias.","Error cleaning totals: {error}":"Erro ao limpar totais: {error}",
    "VnStat Usage":"Uso do VnStat","Today total":"Total hoje","This month total":"Total este mês","Interfaces tracked":"Interfaces monitoradas","daily / monthly":"diário / mensal","Daily usage":"Uso diário","Monthly usage":"Uso mensal","Day":"Dia","Month":"Mês","Clean usage":"Limpar uso","Clean VnStat history":"Limpar histórico VnStat","VnStat history does not auto-clean. Use the button when you want to reset it.":"O histórico VnStat não é limpo automaticamente. Use o botão quando quiser resetar.","Totals can be cleaned here and auto-clean every 30 days. VnStat history is separate.":"Os totais podem ser limpos aqui e têm limpeza automática a cada 30 dias. O histórico VnStat é separado.","Loading VnStat usage…":"Carregando uso do VnStat…","VnStat history cleaned.":"Histórico VnStat limpo.","Error loading VnStat usage: {error}":"Erro ao carregar uso do VnStat: {error}","Error cleaning VnStat history: {error}":"Erro ao limpar histórico VnStat: {error}",
    "Panel / system":"Painel / sistema","Select a log source and click Refresh.":"Selecione uma fonte de log e clique em Atualizar.","Clean panel log":"Limpar log do painel","No log lines yet.":"Ainda não há linhas de log.","Panel log cleaned · {path} · max {max}":"Log do painel limpo · {path} · máx {max}","Cleaning panel log…":"Limpando log do painel…",
    "Network":"Rede","Main Listen (SSH / HTTP)":"Listen principal (SSH / HTTP)","Extra Listen Addresses":"Endereços extras de listen","(one per line, e.g. 0.0.0.0:8080)":"(um por linha, ex. 0.0.0.0:8080)","SSH & General":"SSH e geral","Default Upload Limit (Mbps)":"Limite padrão de upload (Mbps)","Default Download Limit (Mbps)":"Limite padrão de download (Mbps)","Quiet Logs":"Logs silenciosos","User Count Display":"Exibir contagem de usuários","SSH Banner":"Banner SSH","Banner Text":"Texto do banner","(shown to connecting SSH clients)":"(mostrado aos clientes SSH ao conectar)","DNSTT Tunnel":"Túnel DNSTT","Domain":"Domínio","UDP Listen":"Listen UDP","Private Key":"Chave privada","Public Key":"Chave pública","Disable Stats Log":"Desativar log de stats","Disable Console Log":"Desativar log do console","UDP Gateway":"Gateway UDP","Listen":"Listen","Idle Timeout":"Timeout ocioso","Map TTL":"TTL do mapa","Debug Logging":"Log de debug","TLS Forwarders":"Encaminhadores TLS","Listen Address":"Endereço de listen","Certificate":"Certificado","Generate Self-Signed":"Gerar autoassinado","Let's Encrypt (certbot)":"Let's Encrypt (certbot)","Paste PEM text":"Colar texto PEM","Custom file paths":"Caminhos personalizados","Cert File":"Arquivo cert","Key File":"Arquivo key","Certificate PEM":"Certificado PEM","Private Key PEM":"Chave privada PEM","Add Forwarder":"Adicionar forwarder","Save Config":"Salvar config","All service changes apply live.":"Todas as mudanças de serviço aplicam ao vivo.","Saved and applied live.":"Salvo e aplicado ao vivo.","Saved live with warnings: {warnings}":"Salvo ao vivo com avisos: {warnings}","Processing…":"Processando…","Listen address required.":"Endereço de listen obrigatório.","Domain required.":"Domínio obrigatório.","Domain and email required.":"Domínio e email obrigatórios.","Cert and key paths required.":"Caminhos do certificado e da chave obrigatórios.","Added. Save config to apply.":"Adicionado. Salve a config para aplicar.","Generating…":"Gerando…","Generated ✓ paths set.":"Gerado ✓ caminhos definidos.","Generating key…":"Gerando chave…","Key generated. Save config to apply.":"Chave gerada. Salve a config para aplicar.","Loading public key…":"Carregando chave pública…","Self-signed cert generated.":"Certificado autoassinado gerado.","Let's Encrypt cert issued.":"Certificado Let's Encrypt emitido.","PEM saved.":"PEM salvo.","Saved ✓ paths set.":"Salvo ✓ caminhos definidos.","Name, cert PEM, and key PEM required.":"Nome, cert PEM e chave PEM obrigatórios.","Name, cert, and key required.":"Nome, cert e chave obrigatórios.","Save Changes":"Salvar alterações"
  }
};
const I18N_ALIASES = {
  "Painel":"Dashboard","Visão geral":"Overview","Contas":"Accounts","Administração":"Administration","Servidor":"Server","Sistema":"System","Configurações":"Settings","Tráfego":"Traffic","Revendedores":"Resellers","Usuários Xray":"Xray Users","Controle VPN":"VPN Control","Sair":"Logout",
  "Total de contas":"Total accounts","ativas":"active","expiradas":"expired","Limite disponível":"available limit","Carregando cota…":"Loading quota…","Conexões ativas":"Active connections","SSH + Xray online agora":"SSH + Xray online now","Pronto para revendedores":"Ready for resellers","monitoramento em tempo real":"Server monitoring in real time","Carga do processador":"Processor load","Memória usada":"Memory used",
  "Ações rápidas":"Quick actions","Criar SSH":"Create SSH","Criar Xray":"Create Xray","Novo revendedor":"New reseller","Configurar serviços":"Configure services","Usuário, senha, validade e limite.":"User, password, expiry and limit.","UUID, label, validade e conexões.":"UUID, label, expiry and connections.","Plano, validade e limite de contas.":"Plan, expiry and account limit.","Portas, DNSTT, UDPGW e TLS.":"Ports, DNSTT, UDPGW and TLS.","Minha cota":"My quota","Carregando…":"Loading…",
  "Minha conta":"My Account","Usuários":"Users","Usuário":"User","Autenticação":"Auth","Conexões":"Conn","Máximo":"Max","Dono":"Owner","Ações":"Actions","Criar / atualizar usuário":"Create / update user","Mostrar formulário":"Show form","Ocultar formulário":"Hide form","Salvar usuário":"Save user","Cancelar":"Cancel","Gerar":"Gen","Copiar":"Copy","Editar":"Edit","Excluir":"Del","Recarregar":"Reload","Atualizar":"Refresh",
  "Rodando":"Running","Parado":"Stopped","rodando":"running","parado":"stopped","desativado":"disabled","API de contadores":"Counters API","Reparar contadores":"Repair counters","Iniciar":"Start","Parar":"Stop","Reiniciar":"Restart","Inbounds e clientes":"Inbounds & Clients","Configuração Xray":"Xray Config","Editor de configuração":"Config editor","Carregar JSON":"Load JSON","Salvar e reiniciar":"Save & Restart","Logs do sistema":"System Logs","últimas 200 linhas":"last 200 lines","Clientes Xray":"Xray clients","Núcleo Xray":"Xray Core","Ativado":"Enabled","Tempo ativo":"Uptime","Precisa de reparo":"Needs repair",
  "Nome":"Name","Nome de exibição":"Display Name","Data de vencimento":"Expiry Date","Máx. conexões":"Max Connections","Ilimitado":"Unlimited","Ativo":"Active","Suspenso":"Suspended","Expirado":"Expired","Sem vencimento":"No expiration","ocioso":"idle","Nenhum cliente.":"No clients.","Adicionar cliente":"Add Client","Novo usuário.":"New user.","Carregado.":"Loaded.","Salvo.":"Saved.","Salvando…":"Saving…","Erro ao carregar usuários.":"Error loading users.","Erro ao excluir.":"Error deleting.","Credenciais inválidas.":"Invalid credentials.","Conta suspensa ou expirada.":"Account suspended or expired.","Falha no login.":"Login failed.","Erro de rede.":"Network error.","Sessão expirada — faça login novamente.":"Session expired — please sign in again.",
  "Rede":"Network","Listen principal (SSH / HTTP)":"Main Listen (SSH / HTTP)","Endereços extras de listen":"Extra Listen Addresses","SSH e geral":"SSH & General","Limite padrão de upload (Mbps)":"Default Upload Limit (Mbps)","Limite padrão de download (Mbps)":"Default Download Limit (Mbps)","Logs silenciosos":"Quiet Logs","Exibir contagem de usuários":"User Count Display","Banner SSH":"SSH Banner","Texto do banner":"Banner Text","Túnel DNSTT":"DNSTT Tunnel","Domínio":"Domain","Chave privada":"Private Key","Chave pública":"Public Key","Gateway UDP":"UDP Gateway","Endereço de listen":"Listen Address","Certificado":"Certificate","Gerar autoassinado":"Generate Self-Signed","Colar texto PEM":"Paste PEM text","Caminhos personalizados":"Custom file paths","Arquivo cert":"Cert File","Arquivo key":"Key File","Adicionar forwarder":"Add Forwarder","Salvar config":"Save Config","Todas as mudanças de serviço aplicam ao vivo.":"All service changes apply live."
};

Object.assign(I18N_TEXT["en-US"], {
  "Servers":"Servers","Reseller area":"Reseller area","shared quota":"shared quota","available":"available","used":"used","breakdown":"breakdown",
  "Create Xray clients with the same experience as the main panel. Each Xray client uses the same limit shared with SSH accounts.":"Create Xray clients with the same experience as the main panel. Each Xray client uses the same limit shared with SSH accounts.",
  "Loading inbounds…":"Loading inbounds…","SSH -- · Xray --":"SSH -- · Xray --","active ·":"active ·","expired":"expired",
  "Binary: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Online counters use Xray Stats API on 127.0.0.1:10085":"Binary: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Online counters use Xray Stats API on 127.0.0.1:10085",
  "Public Key — share with dnstt clients":"Public Key — share with DNSTT clients","auto-saved to /opt/sshpanel/dnstt.key":"auto-saved to /opt/sshpanel/dnstt.key",
  "Max UDP Sessions Per Client":"Max UDP Sessions Per Client","(not total server users)":"(not total server users)","Service Name":"Service Name","Mode":"Mode","Protocol":"Protocol","Port":"Port","Tag":"Tag","Listen IP":"Listen IP","Method":"Method","Host":"Host","Path":"Path","Dest":"Dest","Short ID":"Short ID","Server Name":"Server Name","Cert File Path":"Cert File Path","Key File Path":"Key File Path","Certificate source:":"Certificate source:","Self-Signed":"Self-Signed","Paste PEM":"Paste PEM","File Path":"File Path","Save PEM":"Save PEM","Generate":"Generate","Public Key":"Public Key","Debug Logging":"Debug Logging","Name":"Name","Private Key PEM":"Private Key PEM","Certificate PEM":"Certificate PEM","Domain Name":"Domain Name"
});
Object.assign(I18N_TEXT["pt-BR"], {
  "Servers":"Servidores","Reseller area":"Área do revendedor","shared quota":"cota única","available":"disponíveis","used":"usadas","breakdown":"divisão",
  "Create Xray clients with the same experience as the main panel. Each Xray client uses the same limit shared with SSH accounts.":"Crie clientes Xray com a mesma experiência do painel principal. Cada cliente Xray desconta do mesmo limite usado pelas contas SSH.",
  "Loading inbounds…":"Carregando inbounds…","SSH -- · Xray --":"SSH -- · Xray --","active ·":"ativas ·","expired":"expiradas",
  "Binary: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Online counters use Xray Stats API on 127.0.0.1:10085":"Binário: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Contadores online usam a Xray Stats API em 127.0.0.1:10085",
  "Public Key — share with dnstt clients":"Chave pública — compartilhe com clientes DNSTT","auto-saved to /opt/sshpanel/dnstt.key":"salva automaticamente em /opt/sshpanel/dnstt.key",
  "Max UDP Sessions Per Client":"Máx. sessões UDP por cliente","(not total server users)":"(não é o total de usuários do servidor)","Service Name":"Nome do serviço","Mode":"Modo","Protocol":"Protocolo","Port":"Porta","Tag":"Tag","Listen IP":"IP de listen","Method":"Método","Host":"Host","Path":"Caminho","Dest":"Destino","Short ID":"ID curto","Server Name":"Nome do servidor","Cert File Path":"Caminho do arquivo cert","Key File Path":"Caminho do arquivo key","Certificate source:":"Fonte do certificado:","Self-Signed":"Autoassinado","Paste PEM":"Colar PEM","File Path":"Caminho do arquivo","Save PEM":"Salvar PEM","Generate":"Gerar","Public Key":"Chave pública","Debug Logging":"Log de debug","Name":"Nome","Private Key PEM":"Chave privada PEM","Certificate PEM":"Certificado PEM","Domain Name":"Nome do domínio"
});
Object.assign(I18N_ALIASES, {
  "Servidores":"Servers","Área do revendedor":"Reseller area","cota única":"shared quota","disponíveis":"available","usadas":"used","divisão":"breakdown",
  "Crie clientes Xray com a mesma experiência do painel principal. Cada cliente Xray desconta do mesmo limite usado pelas contas SSH.":"Create Xray clients with the same experience as the main panel. Each Xray client uses the same limit shared with SSH accounts.",
  "Carregando inbounds…":"Loading inbounds…","Loading inbounds…":"Loading inbounds…","ativas ·":"active ·","expiradas":"expired",
  "Binário: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Contadores online usam a Xray Stats API em 127.0.0.1:10085":"Binary: /opt/sshpanel/xray · Config: /opt/sshpanel/xray_config.json · Online counters use Xray Stats API on 127.0.0.1:10085",
  "Public Key — share with dnstt clients":"Public Key — share with dnstt clients","Chave pública — compartilhe com clientes DNSTT":"Public Key — share with dnstt clients",
  "Máx. sessões UDP por cliente":"Max UDP Sessions Per Client","(não é o total de usuários do servidor)":"(not total server users)","Nome do serviço":"Service Name","Modo":"Mode","Protocolo":"Protocol","Porta":"Port","IP de listen":"Listen IP","Método":"Method","Caminho":"Path","Destino":"Dest","ID curto":"Short ID","Nome do servidor":"Server Name","Caminho do arquivo cert":"Cert File Path","Caminho do arquivo key":"Key File Path","Fonte do certificado:":"Certificate source:","Autoassinado":"Self-Signed","Colar PEM":"Paste PEM","Caminho do arquivo":"File Path","Salvar PEM":"Save PEM","Chave pública":"Public Key","Nome do domínio":"Domain Name"
});
const I18N_REVERSE = Object.fromEntries(SUPPORTED_LANGS.map(lang => [lang, Object.fromEntries(Object.entries(I18N_TEXT[lang] || {}).map(([k, v]) => [v, k]))]));
let currentLang = detectInitialLanguage();
let i18nTranslating = false;
let i18nQueued = false;

function detectInitialLanguage() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (SUPPORTED_LANGS.includes(saved)) return saved;
  const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]).join(" ").toLowerCase();
  return langs.includes("pt") ? "pt-BR" : "en-US";
}
function normalizeI18nText(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function i18nCanonicalKey(value) {
  const text = normalizeI18nText(value);
  if (!text) return "";
  if (Object.prototype.hasOwnProperty.call(I18N_TEXT["en-US"], text)) return text;
  if (I18N_ALIASES[text]) return I18N_ALIASES[text];
  for (const lang of SUPPORTED_LANGS) {
    if (I18N_REVERSE[lang][text]) return I18N_REVERSE[lang][text];
  }
  return "";
}
function t(key, vars = {}) {
  const dict = I18N_TEXT[currentLang] || I18N_TEXT["en-US"];
  let out = dict[key] || I18N_TEXT["en-US"][key] || key;
  return out.replace(/\{(\w+)\}/g, (_, name) => Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : "");
}
function shouldSkipI18n(el) {
  return !el || !el.closest || !!el.closest("script,style,textarea,pre,code,[data-no-i18n]");
}
function translateTextNode(node) {
  const raw = node.nodeValue || "";
  const key = i18nCanonicalKey(raw);
  if (!key) return;
  const translated = t(key);
  const lead = raw.match(/^\s*/)?.[0] || "";
  const tail = raw.match(/\s*$/)?.[0] || "";
  const next = lead + translated + tail;
  if (node.nodeValue !== next) node.nodeValue = next;
}
function translateStatic(root = document.body) {
  if (!root) return;
  i18nTranslating = true;
  try {
    if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
    const base = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    if (!base) return;
    const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipI18n(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    base.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el => {
      if (shouldSkipI18n(el)) return;
      ["placeholder", "title", "aria-label"].forEach(attr => {
        const value = el.getAttribute(attr);
        const key = i18nCanonicalKey(value);
        if (key) el.setAttribute(attr, t(key));
      });
    });
  } finally {
    i18nTranslating = false;
  }
}
function queueI18nRefresh() {
  if (i18nTranslating || i18nQueued) return;
  i18nQueued = true;
  requestAnimationFrame(() => {
    i18nQueued = false;
    translateStatic(document.body);
  });
}
function startI18nObserver() {
  if (!document.body || window.__dragonI18nObserver) return;
  window.__dragonI18nObserver = new MutationObserver(() => queueI18nRefresh());
  window.__dragonI18nObserver.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
}
function applyLanguage(lang, options = {}) {
  currentLang = SUPPORTED_LANGS.includes(lang) ? lang : "en-US";
  if (options.persist !== false) localStorage.setItem(LANG_STORAGE_KEY, currentLang);
  document.documentElement.lang = currentLang.toLowerCase();
  if (languageSelect) languageSelect.value = currentLang;
  updatePageHeading();
  translateStatic(document.body);
  document.documentElement.classList.remove("i18n-pending");
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const loginOverlay  = document.getElementById("loginOverlay");
const loginUser     = document.getElementById("loginUser");
const loginPass     = document.getElementById("loginPass");
const loginBtn      = document.getElementById("loginBtn");
const loginErr      = document.getElementById("loginErr");
const mainApp       = document.getElementById("mainApp");
const meUsername    = document.getElementById("meUsername");
const roleChip      = document.getElementById("roleChip");
const logoutBtn     = document.getElementById("logoutBtn");
const menuToggle    = document.getElementById("menuToggle");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const languageSelect = document.getElementById("languageSelect");
const pageTitle     = document.getElementById("pageTitle");
const pageEyebrow   = document.getElementById("pageEyebrow");
const dashTotalUsers = document.getElementById("dashTotalUsers");
const dashActiveUsers = document.getElementById("dashActiveUsers");
const dashExpiredUsers = document.getElementById("dashExpiredUsers");
const dashAccountBreakdown = document.getElementById("dashAccountBreakdown");
const dashConnections = document.getElementById("dashConnections");
const dashConnectionsText = document.getElementById("dashConnectionsText");
const dashServers = document.getElementById("dashServers");
const dashServerStatus = document.getElementById("dashServerStatus");
const dashXrayClients = document.getElementById("dashXrayClients");
const dashXrayStatus = document.getElementById("dashXrayStatus");
const dashCpuVal = document.getElementById("dashCpuVal");
const dashCpuText = document.getElementById("dashCpuText");
const dashCpuBar = document.getElementById("dashCpuBar");
const dashRamVal = document.getElementById("dashRamVal");
const dashRamText = document.getElementById("dashRamText");
const dashRamBar = document.getElementById("dashRamBar");
const dashNetVal = document.getElementById("dashNetVal");
const dashNetText = document.getElementById("dashNetText");
const dashNetTotal = document.getElementById("dashNetTotal");
const dashQuotaChip = document.getElementById("dashQuotaChip");
const dashQuotaBar = document.getElementById("dashQuotaBar");
const dashQuotaText = document.getElementById("dashQuotaText");
const dashQuotaBreakdown = document.getElementById("dashQuotaBreakdown");
const dashQuotaRemaining = document.getElementById("dashQuotaRemaining");
const dashQuotaSummaryText = document.getElementById("dashQuotaSummaryText");
const dashQuotaMiniBar = document.getElementById("dashQuotaMiniBar");
const xrayResellerQuotaUsed = document.getElementById("xrayResellerQuotaUsed");
const xrayResellerQuotaRemaining = document.getElementById("xrayResellerQuotaRemaining");
const xrayResellerQuotaMix = document.getElementById("xrayResellerQuotaMix");
const dashboardQuotaCard = document.getElementById("dashboardQuotaCard");

// Users
const usersBody      = document.getElementById("usersBody");
const userCountChip  = document.getElementById("userCountChip");
const userStatus     = document.getElementById("userStatus");
const lastReload     = document.getElementById("lastReload");
const ownerColHead   = document.getElementById("ownerColHead");
const resellerInfoCard = document.getElementById("resellerInfoCard");
const rUsedMax       = document.getElementById("rUsedMax");
const rExpiry        = document.getElementById("rExpiry");
const rStatus        = document.getElementById("rStatus");

// User form
const userForm       = document.getElementById("userForm");
const userFormWrap   = document.getElementById("userFormWrap");
const toggleFormBtn  = document.getElementById("toggleFormBtn");
const cancelUserBtn  = document.getElementById("cancelUserBtn");
const newUserBtn     = document.getElementById("newUserBtn");
const saveUserBtn    = document.getElementById("saveUserBtn");
const fUsername      = document.getElementById("fUsername");
const fPassword      = document.getElementById("fPassword");
const fTotpSecret    = document.getElementById("fTotpSecret");
const fTotpPeriod    = document.getElementById("fTotpPeriod");
const fTotpWindow    = document.getElementById("fTotpWindow");
const fTotpDigits    = document.getElementById("fTotpDigits");
const fAllowStatic   = document.getElementById("fAllowStatic");
const fMaxConn       = document.getElementById("fMaxConn");
const fExpires       = document.getElementById("fExpires");
const fUp            = document.getElementById("fUp");
const fDown          = document.getElementById("fDown");

// Xray
const xrayChip       = document.getElementById("xrayChip");
const xRunning       = document.getElementById("xRunning");
const xPID           = document.getElementById("xPID");
const xUptime        = document.getElementById("xUptime");
const xStatus        = document.getElementById("xStatus");
const xOnlineUsers   = document.getElementById("xOnlineUsers");
const xCfgEditor     = document.getElementById("xCfgEditor");
const xCfgStatus     = document.getElementById("xCfgStatus");
const xLogsBox       = document.getElementById("xLogsBox");
const inboundsContainer = document.getElementById("inboundsContainer");
const sshServerPickerCard = document.getElementById("sshServerPickerCard");
const xrayServerPickerCard = document.getElementById("xrayServerPickerCard");
const sshServerSelect = document.getElementById("sshServerSelect");
const xrayServerSelect = document.getElementById("xrayServerSelect");
const sshServerHint = document.getElementById("sshServerHint");
const xrayServerHint = document.getElementById("xrayServerHint");

// Resellers
const resellersBody     = document.getElementById("resellersBody");
const resellerCountChip = document.getElementById("resellerCountChip");
const resellerStatus    = document.getElementById("resellerStatus");
const resellerFormTitle = document.getElementById("resellerFormTitle");
const resellerForm      = document.getElementById("resellerForm");
const rUsername         = document.getElementById("rUsername");
const rPassword         = document.getElementById("rPassword");
const rMaxUsers         = document.getElementById("rMaxUsers");
const rExpires          = document.getElementById("rExpires");
const rActive           = document.getElementById("rActive");

// Managed servers
const serversBody = document.getElementById("serversBody");
const serversCountChip = document.getElementById("serversCountChip");
const serversStatus = document.getElementById("serversStatus");
const serverForm = document.getElementById("serverForm");
const serverFormTitle = document.getElementById("serverFormTitle");
const srvID = document.getElementById("srvID");
const srvName = document.getElementById("srvName");
const srvBaseURL = document.getElementById("srvBaseURL");
const srvAdminUser = document.getElementById("srvAdminUser");
const srvAdminKey = document.getElementById("srvAdminKey");
const srvEnableSSH = document.getElementById("srvEnableSSH");
const srvEnableXray = document.getElementById("srvEnableXray");
const srvIsActive = document.getElementById("srvIsActive");
const serverFormStatus = document.getElementById("serverFormStatus");
const serversListView = document.getElementById("serversListView");
const serverConfigSubpage = document.getElementById("serverConfigSubpage");
const cfgServerName = document.getElementById("cfgServerName");
const managedConfigEditor = document.getElementById("managedConfigEditor");
const managedConfigStatus = document.getElementById("managedConfigStatus");
const serversStatusGrid = document.getElementById("serversStatusGrid");
const serversStatusPageStatus = document.getElementById("serversStatusPageStatus");
const serversStatusCountChip = document.getElementById("serversStatusCountChip");

// Stats
const cpuVal     = document.getElementById("cpuVal");
const cpuBar     = document.getElementById("cpuBar");
const memVal     = document.getElementById("memVal");
const memBar     = document.getElementById("memBar");
const memDetail  = document.getElementById("memDetail");
const ifaceBody  = document.getElementById("ifaceBody");
const ifaceSummary = document.getElementById("ifaceSummary");
const statsUpdated = document.getElementById("statsUpdated");
const resetIfaceStatsBtn = document.getElementById("resetIfaceStatsBtn");

// VnStat
const vnstatDailyBody = document.getElementById("vnstatDailyBody");
const vnstatMonthlyBody = document.getElementById("vnstatMonthlyBody");
const vnstatStatus = document.getElementById("vnstatStatus");
const vnTodayTotal = document.getElementById("vnTodayTotal");
const vnMonthTotal = document.getElementById("vnMonthTotal");
const vnIfaceCount = document.getElementById("vnIfaceCount");
const reloadVnstatBtn = document.getElementById("reloadVnstatBtn");
const resetVnstatBtn = document.getElementById("resetVnstatBtn");

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const o = Object.assign({ headers: {} }, opts);
  o.headers = Object.assign({}, o.headers, {
    "Content-Type": "application/json",
    "X-Session-Token": sessionToken,
  });
  const res = await fetch(path, o);
  if (res.status === 401 || res.status === 403) throw new Error("auth");
  return res;
}
function withServerParam(path, serverID) {
  serverID = serverID || "local";
  if (!serverID || serverID === "local") return path;
  return path + (path.includes("?") ? "&" : "?") + "server_id=" + encodeURIComponent(serverID);
}
function selectedSSHServer() { return sshServerSelect?.value || selectedSSHServerID || "local"; }
function selectedXrayServer() { return xrayServerSelect?.value || selectedXrayServerID || "local"; }
function serverByID(id) { return serversCache.find(s => String(s.id) === String(id)); }
function selectedXrayServerLabel() {
  const id = selectedXrayServer();
  const srv = serverByID(id);
  if (srv) return srv.name || srv.base_url || id;
  return id === "local" ? "Master node" : id;
}
function reloadXrayConfigForSelectedServer() {
  const wizPane = document.getElementById("xrayWizardPane");
  const jsonPane = document.getElementById("xrayCfgPaneJson");
  if (jsonPane && !jsonPane.classList.contains("hidden")) return loadXrayCfg();
  if (wizPane && !wizPane.classList.contains("hidden")) return loadWizardFromConfig();
}

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtPct   = n => (n == null || isNaN(n)) ? "--%"  : n.toFixed(1)+"%";
const fmtMbps  = n => (n == null || isNaN(n)) ? "--"   : n.toFixed(2);
function fmtBytes(n) {
  if (!Number.isFinite(n)) return "--";
  if (n<1024) return n+" B";
  const k=n/1024; if(k<1024) return k.toFixed(1)+" KiB";
  const m=k/1024; if(m<1024) return m.toFixed(1)+" MiB";
  return (m/1024).toFixed(1)+" GiB";
}
function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString()+" "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function isoFromLocal(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
function localFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function genBase32(len=20) {
  const alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes=new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let bits=0,val=0,out="";
  for(const b of bytes){val=(val<<8)|b;bits+=8;while(bits>=5){out+=alpha[(val>>>(bits-5))&31];bits-=5;}}
  if(bits>0) out+=alpha[(val<<(5-bits))&31];
  return out;
}
function genUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[ch]));
}

function isVisible(el) {
  return !!el && !el.classList.contains("hidden") && getComputedStyle(el).display !== "none";
}

function isXrayClientEditorActive() {
  const active = document.activeElement;
  if (active && active.closest && (active.closest("#inboundsContainer") || active.closest("#editXrayClientPanel"))) return true;
  if (isVisible(document.getElementById("editXrayClientPanel"))) return true;
  return Array.from(document.querySelectorAll('#inboundsContainer [id^="add-form-"]')).some(isVisible);
}

function inboundStructure(inbounds = []) {
  return JSON.stringify((inbounds || []).map(ib => ({
    tag: ib.tag || "",
    protocol: ib.protocol || "",
    port: ib.port ?? "",
    clients: (ib.clients || []).map(c => c.id || ""),
  })));
}

function clientStatusHTML(c) {
  const exp = c.expires_at ? new Date(c.expires_at) : null;
  const daysLeft = c.expiration_days;
  if (c.expired) return `<span style="color:var(--danger);font-size:.68rem;">${t("Expired")}</span>`;
  if (daysLeft === -1 || !exp) return `<span style="color:var(--success);font-size:.68rem;">${t("Active")}</span>`;
  return `<span style="color:var(--success);font-size:.68rem;">${t("Active ({days}d)", {days: escapeHTML(daysLeft)})}</span>`;
}

function clientExpiryLabel(c) {
  const exp = c.expires_at ? new Date(c.expires_at) : null;
  return exp ? exp.toLocaleDateString() : t("Unlimited");
}

function clientOnlineHTML(c) {
  return `${c.online ? `<span class="badge-on">${t("online")}</span>` : `<span class="badge-off">${t("offline")}</span>`}<div class="hint">${escapeHTML(formatLastActive(c.last_active))}</div>`;
}

function updateCell(row, name, html) {
  const cell = row?.querySelector?.(`[data-cell="${name}"]`);
  if (cell && cell.innerHTML !== html) cell.innerHTML = html;
}

function patchRenderedInbounds(inbounds) {
  const sections = Array.from(inboundsContainer.querySelectorAll("[data-inbound-tag]"));
  if (sections.length !== inbounds.length) return false;

  for (const ib of inbounds) {
    const tag = String(ib.tag || "");
    const section = sections.find(el => el.dataset.inboundTag === tag);
    if (!section) return false;
    if (section.dataset.inboundProtocol !== String(ib.protocol || "") || section.dataset.inboundPort !== String(ib.port ?? "")) return false;

    const clients = ib.clients || [];
    const rows = Array.from(section.querySelectorAll("tr[data-client-id]"));
    if (rows.length !== clients.length) return false;

    const onlineCount = clients.filter(c => !!c.online).length;
    const chip = section.querySelector('[data-role="inbound-online-chip"]');
    if (chip) {
      chip.textContent = t("{count} online", {count: onlineCount});
      chip.classList.toggle("green", onlineCount > 0);
    }

    for (const c of clients) {
      const row = rows.find(el => el.dataset.clientId === String(c.id || ""));
      if (!row) return false;
      updateCell(row, "name", escapeHTML(c.name || "—"));
      updateCell(row, "uuid", escapeHTML(c.id || "—"));
      updateCell(row, "email", escapeHTML(c.email || "—"));
      updateCell(row, "expiry", escapeHTML(clientExpiryLabel(c)));
      updateCell(row, "status", clientStatusHTML(c));
      updateCell(row, "online", clientOnlineHTML(c));
      updateCell(row, "traffic", escapeHTML(formatBytes(c.total_bytes)));
      updateCell(row, "max", escapeHTML(c.max_conns || "∞"));
    }
  }
  return true;
}

// ─── Navigation / shell ──────────────────────────────────────────────────────
const tabTitles = {
  dashboard: ["Dashboard", "Overview"],
  ssh: ["Accounts", "SSH / SlowDNS"],
  xray: ["Accounts", "Xray Users"],
  resellers: ["Administration", "Resellers"],
  servers: ["Administration", "Servers"],
  "servers-status": ["Administration", "Servers Status"],
  stats: ["Server", "Monitoring"],
  vnstat: ["Traffic", "VnStat"],
  logs: ["System", "Logs"],
  server: ["System", "Settings"],
};
function updatePageHeading() {
  const [eyebrow, title] = tabTitles[currentTab] || ["Dashboard", currentTab];
  if (pageEyebrow) pageEyebrow.textContent = t(eyebrow);
  if (pageTitle) pageTitle.textContent = t(title);
}

function selectTab(tab) {
  currentTab = tab;
  const pane = document.getElementById("tab-" + tab);
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (!pane || !btn) return;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  pane.classList.add("active");
  updatePageHeading();
  document.body.classList.remove("sidebar-open");

  if (tab === "dashboard") refreshDashboard();
  if (tab === "xray") {
    loadXrayStatus();
    loadInbounds({ silent: true });
    if (currentRole === "superadmin") loadWizardFromConfig();
  }
  if (tab === "stats" && currentRole === "superadmin") loadStats();
  if (tab === "servers-status" && currentRole === "superadmin") loadServersStatus();
  if (tab === "resellers" && currentRole === "superadmin") loadResellers();
  if (tab === "servers" && currentRole === "superadmin") loadServers();
}

document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => selectTab(btn.dataset.tab)));
menuToggle?.addEventListener("click", () => document.body.classList.add("sidebar-open"));
drawerBackdrop?.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
languageSelect?.addEventListener("change", () => { applyLanguage(languageSelect.value); renderDashboardCounters(); });
document.querySelectorAll(".quick-action[data-jump]").forEach(btn => btn.addEventListener("click", () => selectTab(btn.dataset.jump)));
applyLanguage(currentLang, { persist: false });
startI18nObserver();

// ─── Login / Logout ───────────────────────────────────────────────────────────
loginBtn.addEventListener("click", doLogin);
loginPass.addEventListener("keydown", e => { if (e.key==="Enter") doLogin(); });
logoutBtn.addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST" }); } catch {}
  sessionToken = "";
  localStorage.removeItem("SESSION_TOKEN");
  clearTimers();
  mainApp.classList.add("hidden");
  loginOverlay.classList.remove("hidden");
  loginErr.textContent = "";
  loginUser.value = loginPass.value = "";
});

async function doLogin() {
  loginErr.textContent = "";
  loginBtn.disabled = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: loginUser.value.trim(), password: loginPass.value }),
    });
    if (!res.ok) {
      loginErr.textContent = res.status === 401 ? t("Invalid credentials.") :
                             res.status === 403 ? t("Account suspended or expired.") :
                             t("Login failed.");
      return;
    }
    const data = await res.json();
    sessionToken = data.token;
    currentRole  = data.role;
    currentUser  = data.username;
    localStorage.setItem("SESSION_TOKEN", sessionToken);
    loginOverlay.classList.add("hidden");
    mainApp.classList.remove("hidden");
    initAfterLogin();
  } catch (e) {
    loginErr.textContent = t("Network error.");
  } finally {
    loginBtn.disabled = false;
  }
}

// ─── Init after login ─────────────────────────────────────────────────────────
function clearTimers() {
  [statsTimer, usersTimer, xrayTimer].forEach(t => t && clearInterval(t));
  statsTimer = usersTimer = xrayTimer = null;
}

function initAfterLogin() {
  meUsername.textContent = currentUser;
  mainApp.classList.remove("role-superadmin", "role-reseller");
  mainApp.classList.add(currentRole === "superadmin" ? "role-superadmin" : "role-reseller");
  roleChip.innerHTML = currentRole === "superadmin"
    ? `<span class="chip green">superadmin</span>`
    : `<span class="chip warn">reseller</span>`;

  document.querySelectorAll(".superadmin-only").forEach(el => {
    el.classList.toggle("hidden", currentRole !== "superadmin");
  });
  document.querySelectorAll(".reseller-only").forEach(el => {
    el.classList.toggle("hidden", currentRole !== "reseller");
  });
  document.querySelectorAll(".xray-admin-only").forEach(el => {
    el.classList.toggle("hidden", currentRole !== "superadmin");
  });

  resellerInfoCard.classList.toggle("hidden", currentRole !== "reseller");
  dashboardQuotaCard?.classList.toggle("hidden", currentRole !== "reseller");

  selectTab("dashboard");
  loadServers();

  if (currentRole === "superadmin") {
    loadDashboardStats();
    statsTimer = setInterval(() => {
      loadDashboardStats();
      if (currentTab === "stats") loadStats();
      if (currentTab === "servers-status") loadServersStatus({ silent: true });
    }, 2000);
  } else {
    loadMe();
  }
  xrayTimer = setInterval(() => {
    loadXrayStatus();
    if (currentTab === "xray") loadInbounds({ silent: true });
  }, 7000);

  loadUsers();
  loadXrayStatus();
  loadInbounds({ silent: true });
  usersTimer = setInterval(() => loadUsersSilent(), 3000);
}

// ─── Me (reseller info) ───────────────────────────────────────────────────────
async function loadMe() {
  try {
    const res = await api("/api/auth/me");
    const d   = await res.json();
    dashboardCache.me = d;
    const used = d.used_users ?? 0;
    const max = d.max_users || 0;
    rUsedMax.textContent = used + " / " + (max || "∞");
    rExpiry.textContent  = d.expires_at ? fmtDate(d.expires_at) : t("No expiration");
    rStatus.textContent  = d.is_active  ? t("Active") : t("Suspended");
    rStatus.style.color  = d.is_active  ? "var(--success)" : "var(--danger)";
    updateQuotaCard(used, max, d.used_ssh_users || 0, d.used_xray_users || 0);
    renderDashboardCounters();
  } catch {}
}

function quotaToneClass(pct, remaining) {
  if (remaining === 0 || pct >= 90) return "quota-danger";
  if (pct >= 75) return "quota-warn";
  return "quota-good";
}

function setQuotaTone(el, tone) {
  if (!el) return;
  el.classList.remove("quota-good", "quota-warn", "quota-danger");
  el.classList.add(tone);
}

function updateQuotaCard(used, max, sshUsed = 0, xrayUsed = 0) {
  if (!dashQuotaText) return;
  const unlimited = !max;
  const remaining = unlimited ? "∞" : Math.max(0, max - used);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const tone = quotaToneClass(pct, remaining === "∞" ? 999999 : remaining);
  const labelMax = unlimited ? "∞" : max;

  dashQuotaChip.textContent = `${used} / ${labelMax}`;
  dashQuotaChip.className = `chip ${pct >= 90 ? "red" : pct >= 75 ? "warn" : "green"}`;
  dashQuotaText.textContent = unlimited
    ? t("No limit set by admin")
    : t("{remaining} accounts available · {pct}% used", {remaining, pct});
  dashQuotaBreakdown.textContent = t("SSH {ssh} · Xray {xray}", {ssh: sshUsed, xray: xrayUsed});
  dashQuotaBar.style.width = `${pct}%`;

  if (dashQuotaRemaining) {
    dashQuotaRemaining.textContent = String(remaining);
    setQuotaTone(dashQuotaRemaining, tone);
  }
  if (dashQuotaSummaryText) {
    dashQuotaSummaryText.textContent = unlimited
      ? t("{used} used · unlimited", {used})
      : t("{used}/{max} used · {pct}% of plan", {used, max, pct});
  }
  if (dashQuotaMiniBar) dashQuotaMiniBar.style.width = `${pct}%`;
  if (xrayResellerQuotaUsed) xrayResellerQuotaUsed.textContent = `${used}/${labelMax}`;
  if (xrayResellerQuotaRemaining) {
    xrayResellerQuotaRemaining.textContent = String(remaining);
    setQuotaTone(xrayResellerQuotaRemaining, tone);
  }
  if (xrayResellerQuotaMix) xrayResellerQuotaMix.textContent = t("SSH {ssh} · Xray {xray}", {ssh: sshUsed, xray: xrayUsed});
}

function flattenXrayClients(inbounds = []) {
  return inbounds.flatMap(ib => (ib.clients || []).map(c => Object.assign({ inbound_tag: ib.tag }, c)));
}

function isExpiredDate(value) {
  return !!value && new Date(value) < new Date();
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v >= 10 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

function formatLastActive(value) {
  if (!value) return "--";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ${t("ago")}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${t("ago")}`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ${t("ago")}`;
  return new Date(value).toLocaleString();
}

function renderDashboardCounters() {
  if (!dashTotalUsers) return;
  const sshUsers = dashboardCache.sshUsers || [];
  const xrayClients = flattenXrayClients(dashboardCache.xrayInbounds || []);
  const sshExpired = sshUsers.filter(u => isExpiredDate(u.expires_at)).length;
  const xrayExpired = xrayClients.filter(c => c.expired || isExpiredDate(c.expires_at)).length;
  const sshActive = Math.max(0, sshUsers.length - sshExpired);
  const xrayActive = Math.max(0, xrayClients.length - xrayExpired);
  const total = sshUsers.length + xrayClients.length;
  const active = sshActive + xrayActive;
  const expired = sshExpired + xrayExpired;
  const sshConns = sshUsers.reduce((sum, u) => sum + Number(u.active_conns || 0), 0);
  const xrayOnline = xrayClients.filter(c => !!c.online).length;
  const liveTotal = sshConns + xrayOnline;

  dashTotalUsers.textContent = total;
  dashActiveUsers.textContent = active;
  dashExpiredUsers.textContent = expired;
  if (dashAccountBreakdown) dashAccountBreakdown.textContent = `SSH ${sshUsers.length} · Xray ${xrayClients.length}`;
  dashConnections.textContent = liveTotal;
  if (dashConnectionsText) dashConnectionsText.textContent = t("{ssh} SSH · {xray} Xray online", {ssh: sshConns, xray: xrayOnline});
  if (dashXrayClients) dashXrayClients.textContent = xrayClients.length;
  if (dashXrayStatus) {
    const running = xrayChip?.textContent || "--";
    dashXrayStatus.textContent = t("{online} online · {active} active · {expired} expired · Core: {core}", {online: xrayOnline, active: xrayActive, expired: xrayExpired, core: running});
  }

  const me = dashboardCache.me;
  if (currentRole === "reseller" && me) {
    updateQuotaCard(me.used_users ?? total, me.max_users || 0, me.used_ssh_users ?? sshUsers.length, me.used_xray_users ?? xrayClients.length);
  }
}

function updateDashboardFromUsers(users = []) {
  dashboardCache.sshUsers = users || [];
  renderDashboardCounters();
}

function updateDashboardXray(inbounds = []) {
  dashboardCache.xrayInbounds = inbounds || [];
  renderDashboardCounters();
}

function refreshDashboard() {
  loadUsersSilent();
  loadInbounds({ silent: true });
  loadXrayStatus();
  if (currentRole === "superadmin") loadStats();
  if (currentRole === "reseller") loadMe();
}

// ─── SSH Users ────────────────────────────────────────────────────────────────
document.getElementById("reloadUsersBtn").addEventListener("click", loadUsers);
newUserBtn.addEventListener("click", () => {
  setFormCollapsed(false);
  userForm.reset();
  fTotpPeriod.value = 60; fTotpWindow.value = 1; fTotpDigits.value = 6;
  userStatus.textContent = t("New user.");
  fUsername.focus();
});
cancelUserBtn.addEventListener("click", () => setFormCollapsed(true));
toggleFormBtn.addEventListener("click", () => setFormCollapsed(!formCollapsed));
document.getElementById("genTotpBtn").addEventListener("click", () => {
  fTotpSecret.value = genBase32();
  if (!fTotpPeriod.value) fTotpPeriod.value = 60;
  if (!fTotpWindow.value) fTotpWindow.value = 1;
  if (!fTotpDigits.value) fTotpDigits.value = 6;
  userStatus.textContent = t("TOTP secret generated.");
});
document.getElementById("clearTotpBtn").addEventListener("click", () => { fTotpSecret.value = ""; });

function setFormCollapsed(v) {
  formCollapsed = v;
  userFormWrap.classList.toggle("collapsed", v);
  toggleFormBtn.textContent = v ? t("Show form") : t("Hide form");
}

async function loadUsers() {
  userStatus.textContent = t("Loading…");
  try {
    const res  = await api(withServerParam("/api/users", selectedSSHServer()));
    const data = await res.json();
    renderUsers(data || []);
    userStatus.textContent = t("Loaded.");
    lastReload.textContent = t("Last reload: {time}", {time: new Date().toLocaleTimeString()});
  } catch (e) {
    if (e.message==="auth") { doAuthError(); } else { userStatus.textContent = t("Error loading users."); }
  }
}
async function loadUsersSilent() {
  try {
    const res  = await api(withServerParam("/api/users", selectedSSHServer()));
    const data = await res.json();
    renderUsers(data || []);
  } catch (e) {
    if (e.message==="auth") doAuthError();
  }
}

function renderUsers(users) {
  updateDashboardFromUsers(users);
  const isSA = currentRole === "superadmin";
  userCountChip.textContent = users.length;
  if (isSA) ownerColHead.classList.remove("hidden");
  usersBody.innerHTML = "";
  let online = 0;
  let expiredCount = 0;
  users.forEach(u => {
    const on = (u.active_conns || 0) > 0;
    if (on) online++;
    if (isExpiredDate(u.expires_at)) expiredCount++;
    const tr = document.createElement("tr");
    const cells = [
      u.username,
      on ? `<span class="badge-on">${t("online")}</span>` : `<span class="badge-off">${t("idle")}</span>`,
      u.totp_enabled ? (u.allow_static_password ? "TOTP+pw" : "TOTP") : "Password",
      u.active_conns ?? 0,
      u.max_connections || 0,
      u.limit_mbps_up || 0,
      u.limit_mbps_down || 0,
      u.expires_at ? fmtDate(u.expires_at) : "—",
    ];
    if (isSA) cells.push(u.owner_username || "—");
    cells.forEach((c, i) => {
      const td = document.createElement("td");
      if (i === 1) td.innerHTML = c; else td.textContent = c;
      tr.appendChild(td);
    });
    const tdA = document.createElement("td");
    const editBtn = Object.assign(document.createElement("button"), {
      className:"btn btn-ghost btn-sm", textContent:t("Edit"),
      onclick: () => fillUserForm(u),
    });
    const delBtn = Object.assign(document.createElement("button"), {
      className:"btn btn-danger btn-sm", textContent:t("Del"),
      style: "margin-left:4px;",
      onclick: () => deleteUser(u.username),
    });
    tdA.append(editBtn, delBtn);
    tr.appendChild(tdA);
    usersBody.appendChild(tr);
  });
  const activeCount = Math.max(0, users.length - expiredCount);
  userCountChip.textContent = t("{count} total · {active} active · {online} online", {count: users.length, active: activeCount, online});
}

function fillUserForm(u) {
  setFormCollapsed(false);
  fUsername.value       = u.username || "";
  fPassword.value       = "";
  fTotpSecret.value     = u.totp_secret || "";
  fTotpPeriod.value     = u.totp_period || 60;
  fTotpWindow.value     = u.totp_window ?? 1;
  fTotpDigits.value     = u.totp_digits || 6;
  fAllowStatic.checked  = !!u.allow_static_password;
  fMaxConn.value        = u.max_connections || "";
  fUp.value             = u.limit_mbps_up || "";
  fDown.value           = u.limit_mbps_down || "";
  fExpires.value        = u.expires_at ? localFromISO(u.expires_at) : "";
  userStatus.textContent = t("Editing {name}", {name: u.username});
}

userForm.addEventListener("submit", async e => {
  e.preventDefault();
  saveUserBtn.disabled = true;
  userStatus.textContent = t("Saving…");
  const payload = {
    username: fUsername.value.trim(),
    password: fPassword.value || undefined,
    totp_secret: fTotpSecret.value.trim(),
    totp_period: parseInt(fTotpPeriod.value||"60",10),
    totp_window: parseInt(fTotpWindow.value||"1",10),
    totp_digits: parseInt(fTotpDigits.value||"6",10),
    allow_static_password: !!fAllowStatic.checked,
    max_connections: parseInt(fMaxConn.value||"0",10),
    expires_at: isoFromLocal(fExpires.value),
    limit_mbps_up:   parseInt(fUp.value||"0",10),
    limit_mbps_down: parseInt(fDown.value||"0",10),
    server_id: selectedSSHServer(),
  };
  try {
    const res = await api("/api/users/create", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    userStatus.textContent = t("Saved.");
    fPassword.value = "";
    loadUsers();
    if (currentRole === "reseller") loadMe();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else userStatus.textContent = t("Error: {error}", {error: e.message});
  } finally {
    saveUserBtn.disabled = false;
  }
});

async function deleteUser(username) {
  if (!confirm(t("Delete user \"{name}\"?", {name: username}))) return;
  userStatus.textContent = t("Deleting {name}…", {name: username});
  try {
    const res = await api(withServerParam(`/api/users/delete?username=${encodeURIComponent(username)}`, selectedSSHServer()), { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("delete failed");
    userStatus.textContent = t("Deleted.");
    loadUsers();
    if (currentRole === "reseller") loadMe();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else userStatus.textContent = t("Error deleting.");
  }
}

// ─── Xray ─────────────────────────────────────────────────────────────────────
document.getElementById("xStartBtn").addEventListener("click", () => xrayCtrl("start"));
document.getElementById("xStopBtn").addEventListener("click", () => xrayCtrl("stop"));
document.getElementById("xRestartBtn").addEventListener("click", () => xrayCtrl("restart"));
document.getElementById("xRepairStatsBtn")?.addEventListener("click", repairXrayStats);
document.getElementById("xRefreshBtn").addEventListener("click", () => { loadXrayStatus(); loadInbounds({ force: true }); });
document.getElementById("xLoadInboundsBtn").addEventListener("click", () => loadInbounds({ force: true }));
document.getElementById("xLoadCfgBtn").addEventListener("click", loadXrayCfg);
document.getElementById("xSaveCfgBtn").addEventListener("click", saveXrayCfg);
document.getElementById("xLoadLogsBtn").addEventListener("click", loadXrayLogs);


async function loadXrayStatus() {
  try {
    const res = await api(withServerParam("/api/xray/status", selectedXrayServer()));
    const s   = await res.json();
    const run = !!s.running;
    xrayChip.textContent  = run ? t("running") : (s.enabled ? t("stopped") : t("disabled"));
    xrayChip.className    = "chip " + (run ? "green" : "red");
    xRunning.textContent  = run ? t("Running") : t("Stopped");
    xRunning.style.color  = run ? "var(--success)" : "var(--danger)";
    xPID.textContent      = s.pid    || "--";
    xUptime.textContent   = s.uptime || "--";
    const statsCfgEl = document.getElementById("xStatsConfig");
    const repairBtn = document.getElementById("xRepairStatsBtn");
    if (statsCfgEl) {
      statsCfgEl.textContent = s.stats_configured ? t("OK") : t("Needs repair");
      statsCfgEl.style.color = s.stats_configured ? "var(--success)" : "var(--warning)";
    }
    if (repairBtn) repairBtn.style.display = s.stats_configured ? "none" : "";
    if (xOnlineUsers) xOnlineUsers.textContent = String(s.online_users ?? 0);
    if (!s.stats_configured && xStatus) {
      const missing = Array.isArray(s.stats_missing) && s.stats_missing.length ? ` Missing: ${s.stats_missing.join(", ")}.` : "";
      xStatus.textContent = t("Online counters need Stats API repair.") + missing;
    } else if (s.stats_error && xStatus) {
      xStatus.textContent = t("Online counters: {error}", {error: s.stats_error});
    } else if (xStatus) {
      xStatus.textContent = s.api_server ? t("Counters API ready at {server}.", {server: s.api_server}) : t("Counters API ready.");
    }
    if (dashServers) dashServers.textContent = String((serversCache || []).filter(n => n.is_active !== false).length || (s.enabled ? 1 : 0));
    if (dashServerStatus) dashServerStatus.textContent = (serversCache || []).length > 1 ? `${(serversCache || []).filter(n => n.is_active !== false).length} nodes configured` : (run ? t("{count} online", {count: 1}) : (s.enabled ? t("stopped") : t("disabled")));
    renderDashboardCounters();
    if (s.error) xStatus.textContent = t("Error: {error}", {error: s.error});
  } catch (e) { if (e.message==="auth") doAuthError(); }
}

async function repairXrayStats() {
  const btn = document.getElementById("xRepairStatsBtn");
  if (btn) btn.disabled = true;
  xStatus.textContent = currentLang === "pt-BR" ? "Verificando e reparando a API de contadores do Xray…" : "Checking and repairing Xray counters API…";
  try {
    const res = await api(withServerParam("/api/xray/stats/repair", selectedXrayServer()), { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    const d = await res.json().catch(() => ({}));
    xStatus.textContent = d.changed
      ? (d.restarted ? (currentLang === "pt-BR" ? "API de contadores reparada e Xray reiniciado." : "Counters API repaired and Xray restarted.") : (currentLang === "pt-BR" ? "API de contadores reparada. Reinicie o Xray para aplicar." : "Counters API repaired. Restart Xray to apply it."))
      : (currentLang === "pt-BR" ? "A API de contadores já parece correta." : "Counters API already looks correct.");
    setTimeout(loadXrayStatus, 700);
    setTimeout(() => loadInbounds({ force: true }), 1200);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = (currentLang === "pt-BR" ? "Erro ao reparar contadores: " : "Error repairing counters: ")+e.message;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function xrayCtrl(action) {
  xStatus.textContent = (currentLang === "pt-BR" ? "Processando Xray…" : action.charAt(0).toUpperCase()+action.slice(1)+"ing Xray…");
  try {
    const res = await api(withServerParam(`/api/xray/${action}`, selectedXrayServer()), { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    xStatus.textContent = currentLang === "pt-BR" ? "Xray OK." : "Xray "+action+" OK.";
    setTimeout(loadXrayStatus, 700);
    setTimeout(() => loadInbounds({ force: true }), 1200);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = t("Error: {error}", {error: e.message});
  }
}

async function loadInbounds(options = {}) {
  const { silent = false, force = false } = options || {};
  if (inboundsRefreshInFlight) return;
  inboundsRefreshInFlight = true;
  if (!silent) inboundsContainer.innerHTML = `<div class="hint" style="padding:8px 0;">${t("Loading…")}</div>`;
  else inboundsContainer.classList.add("xray-refreshing");
  try {
    const res      = await api(withServerParam("/api/xray/inbounds", selectedXrayServer()));
    if (!res.ok) throw new Error(await res.text());
    const inbounds = await res.json();
    renderInbounds(inbounds || [], { silent, force });
  } catch (e) {
    if (!silent) inboundsContainer.textContent = t("Error loading inbounds.");
    if (e.message==="auth") doAuthError();
  } finally {
    inboundsRefreshInFlight = false;
    inboundsContainer.classList.remove("xray-refreshing");
  }
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { return document.execCommand("copy"); }
  finally { document.body.removeChild(ta); }
}

function renderInbounds(inbounds, options = {}) {
  const { silent = false, force = false } = options || {};
  updateDashboardXray(inbounds);
  const nextStructure = inboundStructure(inbounds);

  if (silent && !force && nextStructure === lastInboundsStructure && patchRenderedInbounds(inbounds)) return;
  if (silent && !force && isXrayClientEditorActive()) {
    patchRenderedInbounds(inbounds);
    if (xStatus) xStatus.textContent = t("New client data is available; editing was preserved.");
    return;
  }

  if (!inbounds.length) {
    inboundsContainer.innerHTML = `<div class="hint" style="padding:8px 0;">${t("No VLESS/VMess/Trojan inbounds found.")}</div>`;
    lastInboundsStructure = nextStructure;
    return;
  }
  inboundsContainer.innerHTML = "";
  lastInboundsStructure = nextStructure;
  inbounds.forEach(ib => {
    const section = document.createElement("div");
    section.dataset.inboundTag = String(ib.tag || "");
    section.dataset.inboundProtocol = String(ib.protocol || "");
    section.dataset.inboundPort = String(ib.port ?? "");
    section.style = "margin-bottom:14px;";

    const hdr = document.createElement("div");
    hdr.className = "card-hdr";
    hdr.style = "margin-bottom:6px;";
    const clients = ib.clients || [];
    const onlineCount = clients.filter(c => !!c.online).length;
    hdr.innerHTML = `
      <div class="card-title" style="font-size:.8rem;">
        <span class="chip">${escapeHTML(ib.protocol)}</span>
        ${escapeHTML(ib.tag || "untagged")}
        <span class="hint">:${escapeHTML(ib.port ?? "?")}</span>
        <span class="chip ${onlineCount ? "green" : ""}" data-role="inbound-online-chip">${t("{count} online", {count: onlineCount})}</span>
      </div>
      <button class="btn btn-sm" onclick="openAddClient('${ib.tag}')">${t("+ Add Client")}</button>`;
    section.appendChild(hdr);

    // Add client mini-form (hidden by default)
    const addForm = document.createElement("div");
    addForm.id = `add-form-${ib.tag}`;
    addForm.className = "hidden";
    addForm.style = "background:rgba(15,23,42,.9);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;";
    addForm.innerHTML = `
      <div class="form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="field">
          <label>UUID</label>
          <div class="field-row">
            <input id="newUUID-${ib.tag}" placeholder="auto-generate" style="border-radius:6px;"/>
            <button class="btn btn-ghost btn-sm" type="button" onclick="document.getElementById('newUUID-${ib.tag}').value=genUUID()">Gen</button>
          </div>
        </div>
        <div class="field"><label>${t("Email / label")}</label><input id="newEmail-${ib.tag}" placeholder="user@example" style="border-radius:6px;"/></div>
        <div class="field"><label>${t("Display Name")}</label><input id="newName-${ib.tag}" placeholder="e.g. Maykinho01" style="border-radius:6px;"/></div>
        <div class="field"><label>${t("Expiry Date")}</label><input type="datetime-local" id="newExpiry-${ib.tag}" style="border-radius:6px;color-scheme:dark;"/></div>
        <div class="field"><label>${t("Max Connections")} <span class="hint">${t("(0 = unlimited)")}</span></label><input type="number" min="0" id="newMaxConns-${ib.tag}" placeholder="0" style="border-radius:6px;"/></div>
      </div>
      <div class="form-actions" style="margin-top:6px;">
        <button class="btn btn-sm" onclick="addClient('${ib.tag}')">${t("Add")}</button>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-form-${ib.tag}').classList.add('hidden')">${t("Cancel")}</button>
      </div>`;
    section.appendChild(addForm);

    // Clients table
    const tblWrap = document.createElement("div");
    tblWrap.className = "tbl-wrap";
    if (!clients.length) {
      tblWrap.innerHTML = `<div class="hint" style="padding:4px 0;">${t("No clients.")}</div>`;
    } else {
      const tbl = document.createElement("table");
      tbl.innerHTML = `<thead><tr><th>${t("Name")}</th><th>UUID</th><th>${t("Email")}</th><th>${t("Expiry")}</th><th>${t("Status")}</th><th>${t("Online")}</th><th>${t("Traffic")}</th><th>${t("Max")}</th><th>${t("Actions")}</th></tr></thead>`;
      const tbody = document.createElement("tbody");
      clients.forEach(c => {
        const tr = document.createElement("tr");
        tr.dataset.clientId = String(c.id || "");
        tr.innerHTML = `
          <td data-cell="name">${escapeHTML(c.name || "—")}</td>
          <td data-cell="uuid" style="font-family:monospace;font-size:.65rem;">${escapeHTML(c.id || "—")}</td>
          <td data-cell="email">${escapeHTML(c.email || "—")}</td>
          <td data-cell="expiry" style="font-size:.7rem;">${escapeHTML(clientExpiryLabel(c))}</td>
          <td data-cell="status">${clientStatusHTML(c)}</td>
          <td data-cell="online">${clientOnlineHTML(c)}</td>
          <td data-cell="traffic" style="font-size:.7rem;">${escapeHTML(formatBytes(c.total_bytes))}</td>
          <td data-cell="max" style="font-size:.7rem;">${escapeHTML(c.max_conns || "∞")}</td>`;
        const actTd = document.createElement("td");
        actTd.style.whiteSpace = "nowrap";
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-ghost btn-sm";
        copyBtn.textContent = t("Copy");
        copyBtn.onclick = async () => { await copyText(c.id); xStatus.textContent = t("Copied client ID."); };
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-warn btn-sm";
        editBtn.style.marginLeft = "4px";
        editBtn.textContent = t("Edit");
        editBtn.onclick = () => openEditXrayClient(ib.tag, c);
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger btn-sm";
        delBtn.style.marginLeft = "4px";
        delBtn.textContent = t("Del");
        delBtn.onclick = () => removeClient(ib.tag, c.id);
        actTd.append(copyBtn, editBtn, delBtn);
        tr.appendChild(actTd);
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tblWrap.appendChild(tbl);
    }
    section.appendChild(tblWrap);

    const divider = document.createElement("hr");
    divider.style = "border:none;border-top:1px solid var(--border);margin-top:10px;";
    section.appendChild(divider);

    inboundsContainer.appendChild(section);
  });
}

function openAddClient(tag) {
  const form = document.getElementById(`add-form-${tag}`);
  if (form) { form.classList.remove("hidden"); }
  const uuidField = document.getElementById(`newUUID-${tag}`);
  if (uuidField && !uuidField.value) uuidField.value = genUUID();
}

async function addClient(tag) {
  const uuidEl     = document.getElementById(`newUUID-${tag}`);
  const emailEl    = document.getElementById(`newEmail-${tag}`);
  const nameEl     = document.getElementById(`newName-${tag}`);
  const expiryEl   = document.getElementById(`newExpiry-${tag}`);
  const maxConnsEl = document.getElementById(`newMaxConns-${tag}`);
  const uuid       = (uuidEl?.value || "").trim();
  const email      = (emailEl?.value || "").trim();
  const name       = (nameEl?.value || "").trim();
  const expiresAt  = isoFromLocal(expiryEl?.value || "");
  const maxConns   = parseInt(maxConnsEl?.value || "0", 10) || 0;
  if (!uuid) { xStatus.textContent = t("UUID required."); return; }
  try {
    const res = await api("/api/xray/clients/add", {
      method: "POST",
      body: JSON.stringify({ inbound_tag: tag, uuid, email, name, expires_at: expiresAt, max_connections: maxConns, server_id: selectedXrayServer() }),
    });
    if (!res.ok) throw new Error(await res.text());
    xStatus.textContent = t("Client {id}… added. Restarting Xray…", {id: uuid.slice(0,8)});
    setTimeout(() => { loadInbounds({ force: true }); if (currentRole === "reseller") loadMe(); }, 1500);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = t("Error: {error}", {error: e.message});
  }
}

async function removeClient(tag, uuid) {
  if (!confirm(t("Remove client {id}… from {tag}?", {id: uuid.slice(0,8), tag}))) return;
  try {
    const res = await api(withServerParam(`/api/xray/clients/remove?inbound_tag=${encodeURIComponent(tag)}&uuid=${encodeURIComponent(uuid)}`, selectedXrayServer()), { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    xStatus.textContent = t("Client removed. Restarting Xray…");
    setTimeout(() => { loadInbounds({ force: true }); if (currentRole === "reseller") loadMe(); }, 1500);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = t("Error: {error}", {error: e.message});
  }
}

async function loadXrayCfg() {
  if (!xCfgEditor) return;
  const target = selectedXrayServerLabel();
  if (xCfgStatus) xCfgStatus.textContent = `Loading config from ${target}…`;
  try {
    const res  = await api(withServerParam("/api/xray/config", selectedXrayServer()));
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    try { xCfgEditor.value = JSON.stringify(JSON.parse(text), null, 2); }
    catch { xCfgEditor.value = text; }
    if (xCfgStatus) xCfgStatus.textContent = `Config loaded from ${target}.`;
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else if (xCfgStatus) xCfgStatus.textContent = t("Error: {error}", {error: e.message});
  }
}

async function saveXrayCfg() {
  const text = (xCfgEditor?.value || "").trim();
  const target = selectedXrayServerLabel();
  try { JSON.parse(text); } catch(e) { if (xCfgStatus) xCfgStatus.textContent = t("Invalid JSON: {error}", {error: e.message}); return; }
  if (xCfgStatus) xCfgStatus.textContent = `Saving config to ${target}…`;
  try {
    const res = await api(withServerParam("/api/xray/config", selectedXrayServer()), { method:"POST", body: text });
    if (!res.ok) throw new Error(await res.text());
    if (xCfgStatus) xCfgStatus.textContent = `Saved on ${target}. Restarting Xray…`;
    await xrayCtrl("restart");
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else if (xCfgStatus) xCfgStatus.textContent = t("Error: {error}", {error: e.message});
  }
}

async function loadXrayLogs() {
  try {
    const res  = await api(withServerParam("/api/xray/logs", selectedXrayServer()));
    const data = await res.json();
    xLogsBox.textContent = (data.lines||[]).join("\n");
    xLogsBox.scrollTop   = xLogsBox.scrollHeight;
  } catch (e) { if (e.message==="auth") doAuthError(); }
}

// ─── Resellers ────────────────────────────────────────────────────────────────
document.getElementById("reloadResellersBtn").addEventListener("click", loadResellers);
document.getElementById("newResellerBtn").addEventListener("click", () => {
  resellerFormTitle.textContent = "Create Reseller";
  resellerForm.reset();
  rActive.checked = true;
  resellerStatus.textContent = "New reseller.";
});
document.getElementById("cancelResellerBtn").addEventListener("click", () => {
  resellerForm.reset();
  rActive.checked = true;
  resellerFormTitle.textContent = "Create Reseller";
});

document.querySelector("[data-tab='resellers']")?.addEventListener("click", loadResellers);

async function loadResellers() {
  resellerStatus.textContent = "Loading…";
  try {
    const res  = await api("/api/resellers");
    const data = await res.json();
    renderResellers(data || []);
    resellerStatus.textContent = "Loaded.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error loading.";
  }
}

function renderResellers(list) {
  resellerCountChip.textContent = list.length;
  resellersBody.innerHTML = "";
  list.forEach(r => {
    const expired = r.expires_at && new Date(r.expires_at) < new Date();
    const max = r.max_users || 0;
    const used = r.used_users || 0;
    const remaining = max ? Math.max(0, max - used) : "∞";
    const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.username}</td>
      <td>
        <strong>${used} / ${max || "∞"}</strong>
        <div class="hint">Disponível ${remaining} · SSH ${r.used_ssh_users || 0} · Xray ${r.used_xray_users || 0}</div>
        <div class="table-meter"><span style="width:${pct}%"></span></div>
      </td>
      <td>${r.expires_at ? fmtDate(r.expires_at) : "—"}</td>
      <td><span class="${r.is_active && !expired ? 'badge-on' : 'badge-off'}">${r.is_active && !expired ? "Active" : expired ? "Expired" : "Suspended"}</span></td>
      <td></td>`;
    const tdA = tr.lastElementChild;
    const editBtn = Object.assign(document.createElement("button"),{
      className:"btn btn-ghost btn-sm", textContent:t("Edit"),
      onclick: () => fillResellerForm(r),
    });
    const delBtn = Object.assign(document.createElement("button"),{
      className:"btn btn-danger btn-sm", textContent:t("Del"),
      style: "margin-left:4px;",
      onclick: () => deleteReseller(r.username),
    });
    tdA.append(editBtn, delBtn);
    resellersBody.appendChild(tr);
  });
}

function fillResellerForm(r) {
  resellerFormTitle.textContent = `Edit: ${r.username}`;
  rUsername.value  = r.username;
  rPassword.value  = "";
  rMaxUsers.value  = r.max_users || 0;
  rExpires.value   = r.expires_at ? localFromISO(r.expires_at) : "";
  rActive.checked  = r.is_active;
  resellerStatus.textContent = `Editing ${r.username}.`;
}

resellerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("saveResellerBtn");
  btn.disabled = true;
  resellerStatus.textContent = "Saving…";
  const payload = {
    username:   rUsername.value.trim(),
    password:   rPassword.value || undefined,
    max_users:  parseInt(rMaxUsers.value||"0",10),
    expires_at: isoFromLocal(rExpires.value),
    is_active:  rActive.checked,
  };
  try {
    const res = await api("/api/resellers/create", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    resellerStatus.textContent = "Saved.";
    resellerForm.reset(); rActive.checked = true;
    resellerFormTitle.textContent = "Create Reseller";
    loadResellers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error: "+e.message;
  } finally { btn.disabled = false; }
});

async function deleteReseller(username) {
  if (!confirm(`Delete reseller "${username}"? All their SSH sessions will be disconnected.`)) return;
  resellerStatus.textContent = `Deleting ${username}…`;
  try {
    const res = await api(`/api/resellers/delete?username=${encodeURIComponent(username)}`, { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("failed");
    resellerStatus.textContent = "Deleted.";
    loadResellers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error deleting.";
  }
}

// ─── Managed Servers ─────────────────────────────────────────────────────────
sshServerSelect?.addEventListener("change", () => {
  selectedSSHServerID = selectedSSHServer();
  localStorage.setItem("SSH_SERVER_ID", selectedSSHServerID);
  loadUsers();
});
xrayServerSelect?.addEventListener("change", () => {
  selectedXrayServerID = selectedXrayServer();
  localStorage.setItem("XRAY_SERVER_ID", selectedXrayServerID);
  lastInboundsStructure = "";
  closeEditXrayClient?.();
  if (xStatus) xStatus.textContent = `Switched Xray target to ${selectedXrayServerLabel()}.`;
  loadXrayStatus();
  loadInbounds({ force: true });
  reloadXrayConfigForSelectedServer();
  loadXrayLogs();
});
document.getElementById("reloadServersBtn")?.addEventListener("click", loadServers);
document.getElementById("reloadServersBtn2")?.addEventListener("click", loadServers);
document.getElementById("refreshServersBtn")?.addEventListener("click", loadServers);
document.getElementById("refreshServersStatusBtn")?.addEventListener("click", () => loadServersStatus());
document.querySelector("[data-tab='servers']")?.addEventListener("click", loadServers);
document.querySelector("[data-tab='servers-status']")?.addEventListener("click", () => loadServersStatus());
document.getElementById("clearServerFormBtn")?.addEventListener("click", clearServerForm);
document.getElementById("testServerBtn")?.addEventListener("click", testServerForm);
document.getElementById("backToServersBtn")?.addEventListener("click", () => showServerListView());
document.getElementById("loadManagedConfigBtn")?.addEventListener("click", () => loadManagedServerConfig(configuringServerID));
document.getElementById("saveManagedConfigBtn")?.addEventListener("click", saveManagedServerConfig);
document.getElementById("saveManagedConfigBottomBtn")?.addEventListener("click", saveManagedServerConfig);
document.getElementById("reloadManagedConfigBottomBtn")?.addEventListener("click", () => loadManagedServerConfig(configuringServerID));
serverForm?.addEventListener("submit", async e => {
  e.preventDefault();
  await saveServerForm();
});

async function loadServers() {
  try {
    const res = await api("/api/servers");
    if (!res.ok) throw new Error(await res.text());
    serversCache = await res.json() || [];
  } catch (e) {
    serversCache = [{ id:"local", name:"Master node", base_url:"local", enable_ssh:true, enable_xray:true, is_active:true, is_local:true }];
    if (serversStatus) serversStatus.textContent = "Error loading servers: " + e.message;
    if (e.message === "auth") doAuthError();
  }
  renderServerSelectors();
  renderServersTable();
}


async function loadServersStatus(options = {}) {
  const silent = !!options.silent;
  if (!serversStatusGrid) return;
  try {
    if (!Array.isArray(serversCache) || serversCache.length === 0) await loadServers();
    const nodes = (serversCache || []).filter(Boolean);
    if (serversStatusCountChip) serversStatusCountChip.textContent = String(nodes.length);
    if (!silent) {
      serversStatusPageStatus && (serversStatusPageStatus.textContent = "Loading servers...");
      serversStatusGrid.innerHTML = `<div class="hint">Loading servers...</div>`;
    }
    const rows = await Promise.all(nodes.map(loadSingleServerStatus));
    renderServersStatusCards(rows);
    if (serversStatusPageStatus) {
      const online = rows.filter(r => r.ok).length;
      serversStatusPageStatus.textContent = `${online}/${rows.length} servers online - Updated ${new Date().toLocaleTimeString()}`;
    }
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else {
      serversStatusPageStatus && (serversStatusPageStatus.textContent = "Error loading server status: " + e.message);
      if (!silent) serversStatusGrid.innerHTML = `<div class="hint">Error loading server status.</div>`;
    }
  }
}

async function fetchJSONForServer(path, serverID) {
  const res = await api(withServerParam(path, serverID));
  if (!res.ok) throw new Error((await res.text()).trim() || `HTTP ${res.status}`);
  return await res.json();
}

async function loadSingleServerStatus(server) {
  const id = String(server.id || "local");
  const out = { server, ok: true, error: "", stats: null, users: [], inbounds: [], xray: null };
  if (server.is_active === false) { out.ok = false; out.error = "disabled"; return out; }
  try {
    out.stats = await fetchJSONForServer("/api/stats", id);
  } catch (e) {
    out.ok = false;
    out.error = e.message || "stats failed";
  }
  if (server.enable_ssh || server.is_local) {
    try { out.users = await fetchJSONForServer("/api/users", id) || []; }
    catch (e) { out.usersError = e.message || "users failed"; }
  }
  if (server.enable_xray || server.is_local) {
    try { out.xray = await fetchJSONForServer("/api/xray/status", id); }
    catch (e) { out.xrayError = e.message || "xray status failed"; }
    try { out.inbounds = await fetchJSONForServer("/api/xray/inbounds", id) || []; }
    catch (e) { out.inboundsError = e.message || "xray clients failed"; }
  }
  return out;
}

function renderServersStatusCards(rows = []) {
  if (!serversStatusGrid) return;
  if (!rows.length) {
    serversStatusGrid.innerHTML = `<div class="hint">No active servers configured.</div>`;
    return;
  }
  serversStatusGrid.innerHTML = rows.map(serverStatusCardHTML).join("");
}

function serverStatusCardHTML(row) {
  const s = row.server || {};
  const stats = row.stats || {};
  const ifaces = Array.isArray(stats.interfaces) ? stats.interfaces : [];
  let rx = 0, tx = 0, rxTotal = 0, txTotal = 0;
  ifaces.forEach(it => {
    rx += Number(it.rx_mbps || 0);
    tx += Number(it.tx_mbps || 0);
    rxTotal += Number(it.rx_bytes || 0);
    txTotal += Number(it.tx_bytes || 0);
  });
  const cpu = Number(stats.cpu_percent || 0);
  const mem = stats.mem_percent == null ? 0 : Number(stats.mem_percent || 0);
  const users = Array.isArray(row.users) ? row.users : [];
  const now = Date.now();
  const sshActive = users.filter(u => !u.expires_at || new Date(u.expires_at).getTime() > now).length;
  const sshExpired = Math.max(0, users.length - sshActive);
  const sshConns = users.reduce((sum, u) => sum + Number(u.active_conns || 0), 0);
  const clients = [];
  (Array.isArray(row.inbounds) ? row.inbounds : []).forEach(ib => (ib.clients || []).forEach(c => clients.push(c)));
  const xrayOnline = clients.filter(c => !!c.online).length;
  const xrayActive = clients.filter(c => !c.expired && (!c.expires_at || new Date(c.expires_at).getTime() > now)).length;
  const xrayExpired = Math.max(0, clients.length - xrayActive);
  const netNow = rx + tx;
  const running = row.xray ? !!row.xray.running : false;
  const nodeStatus = row.ok ? `<span class="badge-on">online</span>` : `<span class="badge-off">offline</span>`;
  const options = `${s.enable_ssh ? "SSH" : ""}${s.enable_ssh && s.enable_xray ? " / " : ""}${s.enable_xray ? "Xray" : ""}` || "disabled";
  const err = row.ok ? "" : `<div class="server-status-error">${escapeHTML(row.error || "connection failed")}</div>`;
  return `
    <article class="server-status-card ${row.ok ? "" : "server-status-offline"}">
      <div class="server-status-head">
        <div>
          <div class="server-status-title">${escapeHTML(s.name || "Server")}</div>
          <div class="server-status-url">${escapeHTML(s.base_url || "local")}</div>
        </div>
        <div class="server-status-badges">
          ${nodeStatus}
          <span class="chip">${escapeHTML(options)}</span>
        </div>
      </div>
      ${err}
      <div class="server-mini-grid">
        ${miniMetricHTML("CPU", fmtPct(cpu), cpu, cpu >= 85 ? "High load" : cpu >= 60 ? "Moderate load" : "Normal load")}
        ${miniMetricHTML("RAM", fmtPct(mem), mem, stats.mem_used_bytes && stats.mem_total_bytes ? `${fmtBytes(stats.mem_used_bytes)} / ${fmtBytes(stats.mem_total_bytes)}` : "Memory used")}
        ${miniMetricHTML("Network", `${fmtMbps(netNow)} Mb/s`, Math.min(100, netNow / 20), `RX ${fmtMbps(rx)} - TX ${fmtMbps(tx)}`)}
        ${miniMetricHTML("Accounts", String(users.length + clients.length), Math.min(100, (users.length + clients.length) * 3), `SSH ${users.length} - Xray ${clients.length}`)}
      </div>
      <div class="server-status-footer">
        <span>SSH: ${sshConns} online - ${sshActive} active - ${sshExpired} expired</span>
        <span>Xray: ${xrayOnline} online - ${xrayActive} active - ${xrayExpired} expired - Core ${running ? "running" : "stopped"}</span>
        <span>Total traffic: ${fmtBytes(rxTotal + txTotal)}</span>
      </div>
    </article>`;
}

function miniMetricHTML(label, value, pct, note) {
  const width = Math.min(100, Math.max(0, Number(pct) || 0));
  return `<div class="server-mini-metric">
    <div class="server-mini-label">${escapeHTML(label)}</div>
    <div class="server-mini-value">${escapeHTML(value)}</div>
    <div class="server-mini-note">${escapeHTML(note || "")}</div>
    <div class="server-mini-bar"><span style="width:${width}%"></span></div>
  </div>`;
}

function renderServerSelectors() {
  const active = serversCache.filter(s => s.is_active !== false);
  const sshServers = active.filter(s => s.enable_ssh || s.is_local);
  const xrayServers = active.filter(s => s.enable_xray || s.is_local);
  populateServerSelect(sshServerSelect, sshServers, selectedSSHServerID, "ssh");
  populateServerSelect(xrayServerSelect, xrayServers, selectedXrayServerID, "xray");
  const hasMultiSSH = sshServers.length > 1;
  const hasMultiXray = xrayServers.length > 1;
  sshServerPickerCard?.classList.toggle("hidden", !hasMultiSSH);
  xrayServerPickerCard?.classList.toggle("hidden", !hasMultiXray);
  if (sshServerHint) { sshServerHint.textContent = ""; sshServerHint.classList.add("hidden"); }
  if (xrayServerHint) { xrayServerHint.textContent = ""; xrayServerHint.classList.add("hidden"); }
  if (dashServers) dashServers.textContent = String(active.length || 1);
  if (dashServerStatus) dashServerStatus.textContent = active.length > 1 ? `${active.length} nodes configured` : "master only";
}

function populateServerSelect(select, list, selected, kind) {
  if (!select) return;
  const current = String(selected || select.value || "local");
  select.innerHTML = "";
  list.forEach(s => {
    const opt = document.createElement("option");
    opt.value = String(s.id);
    opt.textContent = `${s.name || s.base_url || s.id}${s.is_local ? " (master)" : ""}`;
    select.appendChild(opt);
  });
  const allowed = list.some(s => String(s.id) === current);
  select.value = allowed ? current : "local";
  if (kind === "ssh") {
    selectedSSHServerID = select.value || "local";
    localStorage.setItem("SSH_SERVER_ID", selectedSSHServerID);
  } else {
    selectedXrayServerID = select.value || "local";
    localStorage.setItem("XRAY_SERVER_ID", selectedXrayServerID);
  }
}

function renderServersTable() {
  if (!serversBody) return;
  const rows = serversCache || [];
  serversCountChip && (serversCountChip.textContent = String(Math.max(0, rows.length - 1)));
  serversBody.innerHTML = "";
  rows.forEach(s => {
    const tr = document.createElement("tr");
    const opts = `${s.enable_ssh ? "SSH" : ""}${s.enable_ssh && s.enable_xray ? " / " : ""}${s.enable_xray ? "Xray" : ""}` || "disabled";
    tr.innerHTML = `
      <td>${escapeHTML(s.name || "—")}${s.is_local ? ' <span class="chip">master</span>' : ""}</td>
      <td style="font-family:monospace;font-size:.68rem;">${escapeHTML(s.base_url || "local")}</td>
      <td>${escapeHTML(opts)}</td>
      <td>${s.is_active ? '<span class="badge-on">active</span>' : '<span class="badge-off">disabled</span>'}</td>`;
    const td = document.createElement("td");
    td.style.whiteSpace = "nowrap";
    const cfgBtn = document.createElement("button");
    cfgBtn.className = "btn btn-ghost btn-sm";
    cfgBtn.textContent = "Configure";
    cfgBtn.onclick = () => openManagedServerConfig(String(s.id));
    td.appendChild(cfgBtn);
    if (!s.is_local) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-warn btn-sm";
      editBtn.style.marginLeft = "4px";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => fillServerForm(s);
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.style.marginLeft = "4px";
      delBtn.textContent = "Del";
      delBtn.onclick = () => deleteServer(s);
      td.append(editBtn, delBtn);
    }
    tr.appendChild(td);
    serversBody.appendChild(tr);
  });
}

function clearServerForm() {
  if (!serverForm) return;
  srvID.value = "";
  srvName.value = "";
  srvBaseURL.value = "";
  srvAdminUser.value = "admin";
  srvAdminKey.value = "";
  srvEnableSSH.checked = true;
  srvEnableXray.checked = true;
  srvIsActive.checked = true;
  if (serverFormTitle) serverFormTitle.textContent = "Add / edit server";
  if (serverFormStatus) serverFormStatus.textContent = "";
}

function fillServerForm(s) {
  srvID.value = s.id || "";
  srvName.value = s.name || "";
  srvBaseURL.value = s.base_url || "";
  srvAdminUser.value = s.admin_username || "admin";
  srvAdminKey.value = "";
  srvEnableSSH.checked = !!s.enable_ssh;
  srvEnableXray.checked = !!s.enable_xray;
  srvIsActive.checked = s.is_active !== false;
  if (serverFormTitle) serverFormTitle.textContent = "Edit: " + (s.name || s.base_url);
  if (serverFormStatus) serverFormStatus.textContent = "Leave admin key blank to keep the saved key.";
}

function serverPayloadFromForm() {
  return {
    id: srvID?.value || "",
    name: srvName?.value.trim() || "",
    base_url: srvBaseURL?.value.trim() || "",
    admin_username: srvAdminUser?.value.trim() || "admin",
    admin_key: srvAdminKey?.value || "",
    enable_ssh: !!srvEnableSSH?.checked,
    enable_xray: !!srvEnableXray?.checked,
    is_active: !!srvIsActive?.checked,
  };
}

async function saveServerForm() {
  if (!serverFormStatus) return;
  serverFormStatus.textContent = "Saving…";
  try {
    const res = await api("/api/servers", { method:"POST", body: JSON.stringify(serverPayloadFromForm()) });
    if (!res.ok) throw new Error(await res.text());
    serverFormStatus.textContent = "Saved.";
    clearServerForm();
    await loadServers();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else serverFormStatus.textContent = "Error: " + e.message;
  }
}

async function testServerForm() {
  if (!serverFormStatus) return;
  serverFormStatus.textContent = "Testing remote login…";
  try {
    const res = await api("/api/servers/test", { method:"POST", body: JSON.stringify(serverPayloadFromForm()) });
    if (!res.ok) throw new Error(await res.text());
    serverFormStatus.textContent = "Connection OK.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else serverFormStatus.textContent = "Test failed: " + e.message;
  }
}

async function deleteServer(s) {
  if (!confirm(`Delete server "${s.name || s.base_url}"?`)) return;
  try {
    const res = await api(`/api/servers?id=${encodeURIComponent(s.id)}`, { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    await loadServers();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else serversStatus && (serversStatus.textContent = "Delete failed: " + e.message);
  }
}

function showServerListView() {
  serversListView?.classList.remove("hidden");
  serverConfigSubpage?.classList.add("hidden");
  configuringServerID = "";
}

function openManagedServerConfig(id) {
  configuringServerID = id || "local";
  const srv = serverByID(configuringServerID) || { name: "Master node" };
  if (cfgServerName) cfgServerName.textContent = srv.name || srv.base_url || configuringServerID;
  serversListView?.classList.add("hidden");
  serverConfigSubpage?.classList.remove("hidden");
  loadManagedServerConfig(configuringServerID);
}

function toggleManagedDnsttFields(on) {
  const el = document.getElementById("managedDnsttFields");
  if (!el) return;
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}
function toggleManagedUdpgwFields(on) {
  const el = document.getElementById("managedUdpgwFields");
  if (!el) return;
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}

async function loadManagedServerConfig(id) {
  if (!id) return;
  const st = document.getElementById("managedConfigStatus");
  if (st) st.textContent = "Loading config…";
  try {
    const res = await api(withServerParam("/api/servers/config", id));
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();

    document.getElementById("managedCfgListen").value = c.listen || "";
    document.getElementById("managedCfgExtraListen").value = (c.extra_listen || []).join("\n");

    document.getElementById("managedCfgLimitUp").value = c.default_limit_mbps_up || 0;
    document.getElementById("managedCfgLimitDown").value = c.default_limit_mbps_down || 0;
    document.getElementById("managedCfgQuiet").checked = !!c.quiet;
    document.getElementById("managedCfgUserCount").checked = !!c.user_count;
    document.getElementById("managedCfgBanner").value = c.banner || "";

    const hasDnstt = !!c.dnstt;
    document.getElementById("managedCfgDnsttEnabled").checked = hasDnstt;
    toggleManagedDnsttFields(hasDnstt);
    const d = c.dnstt || {};
    document.getElementById("managedCfgDnsttDomain").value = d.domain || "";
    document.getElementById("managedCfgDnsttUDP").value = d.udp_listen || "";
    document.getElementById("managedCfgDnsttKey").value = d.privkey_file || "/opt/sshpanel/dnstt.key";
    document.getElementById("managedCfgDnsttNoStats").checked = !!d.disable_stats_log;
    document.getElementById("managedCfgDnsttNoConsole").checked = !!d.disable_console_log;

    const hasUdpgw = !!c.udpgw;
    document.getElementById("managedCfgUdpgwEnabled").checked = hasUdpgw;
    toggleManagedUdpgwFields(hasUdpgw);
    const u = c.udpgw || {};
    document.getElementById("managedCfgUdpgwListen").value = u.listen || "";
    document.getElementById("managedCfgUdpgwMaxConns").value = u.max_client_conns || 0;
    document.getElementById("managedCfgUdpgwIdle").value = u.idle_timeout || "";
    document.getElementById("managedCfgUdpgwMapTTL").value = u.map_ttl || "";
    document.getElementById("managedCfgUdpgwDebug").checked = !!u.debug;

    managedTlsForwardersState = c.tls_forwarders || [];
    renderManagedTLSForwarders();

    const x = c.xray || {};
    document.getElementById("managedCfgXrayEnabled").checked = !!x.enabled;

    document.getElementById("managedDnsttPubkeyWrap")?.classList.add("hidden");
    if (st) st.textContent = "Config loaded.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  }
}

function managedConfigFromForm() {
  const extraLines = document.getElementById("managedCfgExtraListen").value
    .split("\n").map(s => s.trim()).filter(Boolean);
  return {
    listen: document.getElementById("managedCfgListen").value.trim(),
    extra_listen: extraLines,
    host_key_file: "/opt/sshpanel/ssh_host_rsa_key",
    admin_dir: "/opt/sshpanel/admin",
    default_limit_mbps_up: parseInt(document.getElementById("managedCfgLimitUp").value || "0", 10),
    default_limit_mbps_down: parseInt(document.getElementById("managedCfgLimitDown").value || "0", 10),
    quiet: document.getElementById("managedCfgQuiet").checked,
    user_count: document.getElementById("managedCfgUserCount").checked,
    banner: document.getElementById("managedCfgBanner").value,
    banner_file: "/opt/sshpanel/banner.txt",
    dnstt: document.getElementById("managedCfgDnsttEnabled").checked ? {
      domain: document.getElementById("managedCfgDnsttDomain").value.trim(),
      udp_listen: document.getElementById("managedCfgDnsttUDP").value.trim(),
      privkey_file: document.getElementById("managedCfgDnsttKey").value.trim(),
      disable_stats_log: document.getElementById("managedCfgDnsttNoStats").checked,
      disable_console_log: document.getElementById("managedCfgDnsttNoConsole").checked,
    } : null,
    udpgw: document.getElementById("managedCfgUdpgwEnabled").checked ? {
      listen: document.getElementById("managedCfgUdpgwListen").value.trim(),
      max_client_conns: parseInt(document.getElementById("managedCfgUdpgwMaxConns").value || "0", 10),
      idle_timeout: document.getElementById("managedCfgUdpgwIdle").value.trim(),
      map_ttl: document.getElementById("managedCfgUdpgwMapTTL").value.trim(),
      debug: document.getElementById("managedCfgUdpgwDebug").checked,
    } : null,
    tls_forwarders: managedTlsForwardersState,
    xray: {
      enabled: document.getElementById("managedCfgXrayEnabled").checked,
      bin_path: "/opt/sshpanel/xray",
      config_file: "/opt/sshpanel/xray_config.json",
      api_server: "127.0.0.1:10085",
      online_window_seconds: 90,
      stats_poll_seconds: 15,
    },
  };
}

async function saveManagedServerConfig() {
  if (!configuringServerID) return;
  const st = document.getElementById("managedConfigStatus");
  if (st) st.textContent = "Saving config…";
  try {
    const cfg = managedConfigFromForm();
    const res = await api(withServerParam("/api/servers/config", configuringServerID), { method:"POST", body: JSON.stringify(cfg) });
    if (!res.ok) throw new Error(await res.text());
    const report = await res.json().catch(() => null);
    const warnings = report?.warnings || [];
    const bad = Object.entries(report?.services || {}).filter(([_, v]) => v?.enabled && !v?.running);
    if (warnings.length || bad.length) {
      const badText = bad.map(([name, v]) => `${name}: ${v.error || "not running"}`).join(" | ");
      if (st) st.textContent = "Saved live with warnings: " + [...warnings, badText].filter(Boolean).join(" | ");
    } else if (st) {
      st.textContent = "Saved and applied live.";
    }
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  }
}

function renderManagedTLSForwarders() {
  const list = document.getElementById("managedTlsForwardersList");
  const chip = document.getElementById("managedTlsCountChip");
  if (!list) return;
  if (chip) chip.textContent = managedTlsForwardersState.length;
  if (!managedTlsForwardersState.length) {
    list.innerHTML = '<div class="hint" style="padding:4px 0;">No TLS forwarders configured.</div>';
    return;
  }
  list.innerHTML = "";
  managedTlsForwardersState.forEach((fw, i) => {
    const row = document.createElement("div");
    row.style = "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.73rem;";
    row.innerHTML = `<span style="flex:1;font-family:monospace;">${escapeHTML(fw.listen || "")}</span>
      <span class="hint">${escapeHTML(fw.cert_file ? fw.cert_file.split("/").pop() : "no cert")}</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => { managedTlsForwardersState.splice(i,1); renderManagedTLSForwarders(); };
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function toggleManagedAddTLSForm() {
  const panel = document.getElementById("managedAddTLSPanel");
  if (!panel) return;
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) {
    document.getElementById("managedTlsAddStatus").textContent = "";
    document.getElementById("managedTlsListenAddr").value = "";
    document.getElementById("managedTlsSSLDomain").value = "";
    document.getElementById("managedTlsCertType").value = "selfsigned";
    onManagedTLSTypeChange("selfsigned");
  }
}

function onManagedTLSTypeChange(val) {
  const setVisible = (id, on, display = "") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !on);
    el.style.display = on ? display : "none";
  };
  setVisible("managedTlsSSFields", val === "selfsigned", "");
  setVisible("managedTlsLEFields", val === "letsencrypt", "grid");
  setVisible("managedTlsPasteFields", val === "paste", "");
  setVisible("managedTlsCustomFields", val === "custom", "grid");
}

async function addManagedTLSForwarder() {
  const st = document.getElementById("managedTlsAddStatus");
  const listen = document.getElementById("managedTlsListenAddr").value.trim();
  const certType = document.getElementById("managedTlsCertType").value;
  if (!listen) { st.textContent = "Listen address required."; return; }
  let certFile = "", keyFile = "";
  st.textContent = "Processing…";
  if (certType === "selfsigned") {
    const domain = document.getElementById("managedTlsSSLDomain").value.trim();
    if (!domain) { st.textContent = "Domain required."; return; }
    try {
      const res = await api(withServerParam("/api/tls/generate-selfsigned", configuringServerID), { method:"POST", body: JSON.stringify({ domain }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Self-signed cert generated.";
    } catch (e) {
      if (e.message === "auth") doAuthError();
      else st.textContent = "Cert error: " + e.message;
      return;
    }
  } else if (certType === "letsencrypt") {
    const domain = document.getElementById("managedTlsLEDomain").value.trim();
    const email = document.getElementById("managedTlsLEEmail").value.trim();
    if (!domain || !email) { st.textContent = "Domain and email required."; return; }
    st.textContent = "Running certbot… (may take ~30s)";
    try {
      const res = await api(withServerParam("/api/tls/letsencrypt", configuringServerID), { method:"POST", body: JSON.stringify({ domain, email }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Let's Encrypt cert issued.";
    } catch (e) {
      if (e.message === "auth") doAuthError();
      else st.textContent = "certbot error: " + e.message;
      return;
    }
  } else if (certType === "paste") {
    const name = document.getElementById("managedTlsPasteName").value.trim();
    const cert = document.getElementById("managedTlsPasteCert").value.trim();
    const key = document.getElementById("managedTlsPasteKey").value.trim();
    if (!name || !cert || !key) { st.textContent = "Name, cert PEM, and key PEM required."; return; }
    try {
      const res = await api(withServerParam("/api/tls/upload-pem", configuringServerID), { method:"POST", body: JSON.stringify({ name, cert, key }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "PEM saved.";
    } catch (e) {
      if (e.message === "auth") doAuthError();
      else st.textContent = "Upload error: " + e.message;
      return;
    }
  } else {
    certFile = document.getElementById("managedTlsCustomCert").value.trim();
    keyFile = document.getElementById("managedTlsCustomKey").value.trim();
    if (!certFile || !keyFile) { st.textContent = "Cert and key paths required."; return; }
  }
  managedTlsForwardersState.push({ listen, cert_file: certFile, key_file: keyFile });
  renderManagedTLSForwarders();
  document.getElementById("managedAddTLSPanel").classList.add("hidden");
  st.textContent = "Added. Save config to apply.";
}

async function generateManagedDnsttKey() {
  const st = document.getElementById("managedDnsttKeyStatus");
  if (st) st.textContent = "Generating key…";
  try {
    const res = await api(withServerParam("/api/dnstt/genkey", configuringServerID), { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("managedCfgDnsttKey").value = data.privkey_file || "/opt/sshpanel/dnstt.key";
    if (st) st.textContent = "Key generated. Save config to apply.";
    await loadManagedDnsttPubkey();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  }
}

async function loadManagedDnsttPubkey() {
  const st = document.getElementById("managedDnsttKeyStatus");
  if (st) st.textContent = "Loading public key…";
  try {
    const res = await api(withServerParam("/api/dnstt/pubkey", configuringServerID));
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const val = data.public_key || data.pubkey || "";
    document.getElementById("managedDnsttPubkeyVal").value = val;
    document.getElementById("managedDnsttPubkeyWrap")?.classList.remove("hidden");
    if (st) st.textContent = val ? "Public key loaded." : "No public key returned.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  }
}


// ─── Stats ────────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='stats']")?.addEventListener("click", loadStats);

async function loadDashboardStats() {
  try {
    const res = await api("/api/stats");
    if (!res.ok) throw new Error(await res.text());
    const s = await res.json();
    updateDashboardStats(s);
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else {
      if (dashCpuVal) dashCpuVal.textContent = "erro";
      if (dashRamVal) dashRamVal.textContent = "erro";
      if (dashNetVal) dashNetVal.textContent = "erro";
    }
  }
}

function updateDashboardStats(s) {
  if (!s) return;
  const cpu = Number(s.cpu_percent ?? 0);
  const mem = s.mem_percent == null ? null : Number(s.mem_percent);
  if (dashCpuVal) dashCpuVal.textContent = fmtPct(cpu);
  if (dashCpuBar) dashCpuBar.style.width = Math.min(100, Math.max(0, cpu)) + "%";
  if (dashCpuText) dashCpuText.textContent = cpu >= 85 ? "Carga alta" : cpu >= 60 ? "Carga moderada" : "Carga normal";
  if (dashRamVal) dashRamVal.textContent = mem == null ? "--%" : fmtPct(mem);
  if (dashRamBar) dashRamBar.style.width = mem == null ? "0%" : Math.min(100, Math.max(0, mem)) + "%";
  if (dashRamText) {
    const used = s.mem_used_bytes, total = s.mem_total_bytes;
    dashRamText.textContent = used != null && total != null ? `${fmtBytes(used)} / ${fmtBytes(total)}` : "Memória usada";
  }
  const ifaces = Array.isArray(s.interfaces) ? s.interfaces : [];
  let rx = 0, tx = 0, rxTotal = 0, txTotal = 0;
  ifaces.forEach(it => {
    rx += Number(it.rx_mbps || 0);
    tx += Number(it.tx_mbps || 0);
    rxTotal += Number(it.rx_bytes || 0);
    txTotal += Number(it.tx_bytes || 0);
  });
  if (dashNetVal) dashNetVal.textContent = `${fmtMbps(rx + tx)} Mb/s`;
  if (dashNetText) dashNetText.textContent = `RX ${fmtMbps(rx)} · TX ${fmtMbps(tx)} Mb/s`;
  if (dashNetTotal) dashNetTotal.textContent = `Total ${fmtBytes(rxTotal + txTotal)}`;
}

async function loadStats() {
  try {
    const res = await api("/api/stats");
    if (!res.ok) throw new Error(await res.text());
    const s   = await res.json();
    updateDashboardStats(s);
    const cpu = Number(s?.cpu_percent ?? 0);
    if (cpuVal) cpuVal.textContent = fmtPct(cpu);
    if (cpuBar) cpuBar.style.width = Math.min(100, Math.max(0, cpu)) + "%";
    const mp  = s?.mem_percent == null ? null : Number(s.mem_percent);
    if (memVal) memVal.textContent = mp == null ? "--%"  : fmtPct(mp);
    if (memBar) memBar.style.width = mp == null ? "0%"   : Math.min(100, Math.max(0, mp)) + "%";
    const mu = s?.mem_used_bytes, mt = s?.mem_total_bytes;
    if (memDetail) memDetail.textContent = (mu != null && mt != null) ? `${fmtBytes(mu)} / ${fmtBytes(mt)}` : "";
    const ifaces = Array.isArray(s.interfaces) ? s.interfaces : [];
    if (ifaceBody) ifaceBody.innerHTML = "";
    let totRx = 0, totTx = 0;
    ifaces.forEach(it => {
      totRx += Number(it.rx_bytes||0); totTx += Number(it.tx_bytes||0);
      if (!ifaceBody) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.name}</td><td>${fmtMbps(it.rx_mbps)}</td><td>${fmtMbps(it.tx_mbps)}</td><td>${fmtBytes(it.rx_bytes)}</td><td>${fmtBytes(it.tx_bytes)}</td>`;
      ifaceBody.appendChild(tr);
    });
    if (ifaceSummary) ifaceSummary.textContent = `Total: ${fmtBytes(totRx)} rx / ${fmtBytes(totTx)} tx`;
    if (statsUpdated) statsUpdated.textContent = "Updated: " + new Date().toLocaleTimeString();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else if (statsUpdated) statsUpdated.textContent = "Erro ao carregar stats.";
  }
}

resetIfaceStatsBtn?.addEventListener("click", resetInterfaceStats);

async function resetInterfaceStats() {
  if (!confirm("Clean the live Interface totals now? This does not delete VnStat daily/monthly history.")) return;
  resetIfaceStatsBtn.disabled = true;
  ifaceSummary.textContent = "Cleaning interface totals…";
  try {
    const res = await api("/api/stats/interfaces/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    ifaceSummary.textContent = "Interface totals cleaned. Auto-clean remains every 30 days.";
    loadStats();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else ifaceSummary.textContent = "Error cleaning totals: " + e.message;
  } finally {
    resetIfaceStatsBtn.disabled = false;
  }
}

// ─── VnStat ───────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='vnstat']")?.addEventListener("click", loadVnstat);
reloadVnstatBtn?.addEventListener("click", loadVnstat);
resetVnstatBtn?.addEventListener("click", resetVnstatHistory);

function renderVnstatRows(body, rows, emptyLabel) {
  body.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="hint">${emptyLabel}</td>`;
    body.appendChild(tr);
    return;
  }
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.period || "--"}</td><td>${r.iface || "--"}</td><td>${fmtBytes(r.rx_bytes||0)}</td><td>${fmtBytes(r.tx_bytes||0)}</td><td>${fmtBytes(r.total_bytes||((r.rx_bytes||0)+(r.tx_bytes||0)))}</td>`;
    body.appendChild(tr);
  });
}

async function loadVnstat() {
  vnstatStatus.textContent = "Loading VnStat usage…";
  try {
    const res = await api("/api/vnstat?days=31&months=12");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const monthly = Array.isArray(data.monthly) ? data.monthly : [];
    renderVnstatRows(vnstatDailyBody, daily, "No daily usage recorded yet.");
    renderVnstatRows(vnstatMonthlyBody, monthly, "No monthly usage recorded yet.");

    // Use the server/database periods when available. Falling back to the
    // newest row avoids browser UTC/local-time mismatches that can make
    // "Today total" show 0 while the daily table has data.
    const today = data.today_period || daily[0]?.period || localDateKey();
    const month = data.month_period || today.slice(0,7);
    const todayTotal = data.today_total_bytes ?? daily.filter(r => r.period === today).reduce((sum, r) => sum + (r.total_bytes||0), 0);
    const monthTotal = data.month_total_bytes ?? monthly.filter(r => r.period === month).reduce((sum, r) => sum + (r.total_bytes||0), 0);
    const ifaces = new Set([...daily, ...monthly].map(r => r.iface).filter(Boolean));
    vnTodayTotal.textContent = fmtBytes(todayTotal);
    vnMonthTotal.textContent = fmtBytes(monthTotal);
    vnIfaceCount.textContent = String(data.interface_count ?? ifaces.size ?? 0);
    vnstatStatus.textContent = "Updated: " + new Date().toLocaleTimeString() + " · history is kept until manually cleaned.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else vnstatStatus.textContent = "Error loading VnStat usage: " + e.message;
  }
}

async function resetVnstatHistory() {
  if (!confirm("Clean all VnStat daily/monthly usage history? This does not reset the live Interface totals.")) return;
  resetVnstatBtn.disabled = true;
  vnstatStatus.textContent = "Cleaning VnStat history…";
  try {
    const res = await api("/api/vnstat/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    vnstatStatus.textContent = "VnStat history cleaned.";
    loadVnstat();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else vnstatStatus.textContent = "Error cleaning VnStat history: " + e.message;
  } finally {
    resetVnstatBtn.disabled = false;
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='logs']")?.addEventListener("click", loadSystemLogs);
document.getElementById("logSource")?.addEventListener("change", loadSystemLogs);
document.getElementById("clearPanelLogBtn")?.addEventListener("click", clearPanelLog);

async function loadSystemLogs() {
  const box = document.getElementById("systemLogBox");
  const st = document.getElementById("systemLogStatus");
  const source = document.getElementById("logSource")?.value || "panel";
  const clearBtn = document.getElementById("clearPanelLogBtn");
  if (clearBtn) clearBtn.disabled = source !== "panel";
  st.textContent = "Loading…";
  try {
    const res = await api(`/api/system/logs?source=${encodeURIComponent(source)}&lines=500`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const lines = Array.isArray(data.lines) ? data.lines : [];
    box.textContent = lines.length ? lines.join("\n") : "No log lines yet.";
    box.scrollTop = box.scrollHeight;
    st.textContent = `${data.source || source} logs${data.path ? " · " + data.path : ""} · ${lines.length} lines · ` + new Date().toLocaleTimeString();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function clearPanelLog() {
  const st = document.getElementById("systemLogStatus");
  if (!confirm("Clean the panel log now? Logs are already auto-cleaned after 1 MiB.")) return;
  st.textContent = "Cleaning panel log…";
  try {
    const res = await api("/api/system/logs/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    st.textContent = `Panel log cleaned · ${data.path || "panel.log"} · max ${fmtBytes(data.max_bytes || 1048576)}`;
    await loadSystemLogs();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error cleaning panel log: " + e.message;
  }
}

// ─── Server Config ────────────────────────────────────────────────────────────
document.querySelector("[data-tab='server']")?.addEventListener("click", loadServerConfig);

function toggleDnsttFields(on) {
  const el = document.getElementById("dnsttFields");
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}
function toggleUdpgwFields(on) {
  const el = document.getElementById("udpgwFields");
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}

async function loadServerConfig() {
  const st = document.getElementById("srvCfgStatus");
  st.textContent = "Loading…";
  try {
    const res = await api("/api/server/config");
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();

    // Network
    document.getElementById("cfgListen").value       = c.listen || "";
    document.getElementById("cfgExtraListen").value  = (c.extra_listen || []).join("\n");

    // SSH / general
    document.getElementById("cfgLimitUp").value      = c.default_limit_mbps_up || 0;
    document.getElementById("cfgLimitDown").value    = c.default_limit_mbps_down || 0;
    document.getElementById("cfgQuiet").checked      = !!c.quiet;
    document.getElementById("cfgUserCount").checked  = !!c.user_count;

    // Banner
    document.getElementById("cfgBanner").value       = c.banner || "";

    // DNSTT
    const hasDnstt = !!c.dnstt;
    document.getElementById("cfgDnsttEnabled").checked = hasDnstt;
    toggleDnsttFields(hasDnstt);
    const d = c.dnstt || {};
    document.getElementById("cfgDnsttDomain").value    = d.domain || "";
    document.getElementById("cfgDnsttUDP").value       = d.udp_listen || "";
    document.getElementById("cfgDnsttKey").value       = d.privkey_file || "/opt/sshpanel/dnstt.key";
    document.getElementById("cfgDnsttNoStats").checked = !!d.disable_stats_log;
    document.getElementById("cfgDnsttNoConsole").checked = !!d.disable_console_log;

    // UDPGW
    const hasUdpgw = !!c.udpgw;
    document.getElementById("cfgUdpgwEnabled").checked = hasUdpgw;
    toggleUdpgwFields(hasUdpgw);
    const u = c.udpgw || {};
    document.getElementById("cfgUdpgwListen").value    = u.listen || "";
    document.getElementById("cfgUdpgwMaxConns").value  = u.max_client_conns || 0;
    document.getElementById("cfgUdpgwIdle").value      = u.idle_timeout || "";
    document.getElementById("cfgUdpgwMapTTL").value    = u.map_ttl || "";
    document.getElementById("cfgUdpgwDebug").checked   = !!u.debug;

    // TLS forwarders
    tlsForwardersState = c.tls_forwarders || [];
    renderTLSForwarders();

    // Xray
    const x = c.xray || {};
    document.getElementById("cfgXrayEnabled").checked = !!x.enabled;

    st.textContent = "Config loaded.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function saveServerConfig() {
  const st = document.getElementById("srvCfgStatus");
  st.textContent = "Saving…";

  const tlsArr = tlsForwardersState;

  const extraLines = document.getElementById("cfgExtraListen").value
    .split("\n").map(s => s.trim()).filter(Boolean);

  const cfg = {
    listen:               document.getElementById("cfgListen").value.trim(),
    extra_listen:         extraLines,
    host_key_file:        "/opt/sshpanel/ssh_host_rsa_key",
    admin_dir:            "/opt/sshpanel/admin",
    default_limit_mbps_up:   parseInt(document.getElementById("cfgLimitUp").value  || "0", 10),
    default_limit_mbps_down: parseInt(document.getElementById("cfgLimitDown").value || "0", 10),
    quiet:      document.getElementById("cfgQuiet").checked,
    user_count: document.getElementById("cfgUserCount").checked,
    banner:      document.getElementById("cfgBanner").value,
    banner_file: "/opt/sshpanel/banner.txt",
    dnstt: document.getElementById("cfgDnsttEnabled").checked ? {
      domain:              document.getElementById("cfgDnsttDomain").value.trim(),
      udp_listen:          document.getElementById("cfgDnsttUDP").value.trim(),
      privkey_file:        document.getElementById("cfgDnsttKey").value.trim(),
      disable_stats_log:   document.getElementById("cfgDnsttNoStats").checked,
      disable_console_log: document.getElementById("cfgDnsttNoConsole").checked,
    } : null,
    udpgw: document.getElementById("cfgUdpgwEnabled").checked ? {
      listen:          document.getElementById("cfgUdpgwListen").value.trim(),
      max_client_conns: parseInt(document.getElementById("cfgUdpgwMaxConns").value || "0", 10),
      idle_timeout:    document.getElementById("cfgUdpgwIdle").value.trim(),
      map_ttl:         document.getElementById("cfgUdpgwMapTTL").value.trim(),
      debug:           document.getElementById("cfgUdpgwDebug").checked,
    } : null,
    tls_forwarders: tlsArr,
    xray: {
      enabled:     document.getElementById("cfgXrayEnabled").checked,
      bin_path:    "/opt/sshpanel/xray",
      config_file: "/opt/sshpanel/xray_config.json",
      api_server:  "127.0.0.1:10085",
      online_window_seconds: 90,
      stats_poll_seconds: 15,
    },
  };

  try {
    const res = await api("/api/server/config", { method: "POST", body: JSON.stringify(cfg) });
    if (!res.ok) throw new Error(await res.text());
    const report = await res.json().catch(() => null);
    const warnings = report?.warnings || [];
    const bad = Object.entries(report?.services || {}).filter(([_, v]) => v?.enabled && !v?.running);
    if (warnings.length || bad.length) {
      const badText = bad.map(([name, v]) => `${name}: ${v.error || "not running"}`).join(" | ");
      st.textContent = "Saved live with warnings: " + [...warnings, badText].filter(Boolean).join(" | ");
    } else {
      st.textContent = "Saved and applied live.";
    }
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── TLS Forwarders ────────────────────────────────────────────────────────────
function renderTLSForwarders() {
  const list = document.getElementById("tlsForwardersList");
  const chip = document.getElementById("tlsCountChip");
  if (!list) return;
  chip.textContent = tlsForwardersState.length;
  if (!tlsForwardersState.length) {
    list.innerHTML = '<div class="hint" style="padding:4px 0;">No TLS forwarders configured.</div>';
    return;
  }
  list.innerHTML = "";
  tlsForwardersState.forEach((fw, i) => {
    const row = document.createElement("div");
    row.style = "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.73rem;";
    row.innerHTML = `<span style="flex:1;font-family:monospace;">${fw.listen}</span>
      <span class="hint">${fw.cert_file ? fw.cert_file.split("/").pop() : "no cert"}</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => { tlsForwardersState.splice(i,1); renderTLSForwarders(); };
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function toggleAddTLSForm() {
  const panel = document.getElementById("addTLSPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) {
    document.getElementById("tlsAddStatus").textContent = "";
    document.getElementById("tlsListenAddr").value = "";
    document.getElementById("tlsSSLDomain").value = "";
    document.getElementById("tlsCertType").value = "selfsigned";
    onTLSTypeChange("selfsigned");
  }
}

function onTLSTypeChange(val) {
  const setVisible = (id, on, display = "") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !on);
    el.style.display = on ? display : "none";
  };
  setVisible("tlsSSFields", val === "selfsigned", "");
  setVisible("tlsLEFields", val === "letsencrypt", "grid");
  setVisible("tlsPasteFields", val === "paste", "");
  setVisible("tlsCustomFields", val === "custom", "grid");
}

async function addTLSForwarder() {
  const st = document.getElementById("tlsAddStatus");
  const listen   = document.getElementById("tlsListenAddr").value.trim();
  const certType = document.getElementById("tlsCertType").value;
  if (!listen) { st.textContent = "Listen address required."; return; }
  let certFile = "", keyFile = "";
  st.textContent = "Processing…";
  if (certType === "selfsigned") {
    const domain = document.getElementById("tlsSSLDomain").value.trim();
    if (!domain) { st.textContent = "Domain required."; return; }
    try {
      const res = await api("/api/tls/generate-selfsigned", { method:"POST", body: JSON.stringify({ domain }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Self-signed cert generated.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "Cert error: " + e.message;
      return;
    }
  } else if (certType === "letsencrypt") {
    const domain = document.getElementById("tlsLEDomain").value.trim();
    const email  = document.getElementById("tlsLEEmail").value.trim();
    if (!domain || !email) { st.textContent = "Domain and email required."; return; }
    st.textContent = "Running certbot… (may take ~30s)";
    try {
      const res = await api("/api/tls/letsencrypt", { method:"POST", body: JSON.stringify({ domain, email }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Let's Encrypt cert issued.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "certbot error: " + e.message;
      return;
    }
  } else if (certType === "paste") {
    const name = document.getElementById("tlsPasteName").value.trim();
    const cert = document.getElementById("tlsPasteCert").value.trim();
    const key  = document.getElementById("tlsPasteKey").value.trim();
    if (!name || !cert || !key) { st.textContent = "Name, cert PEM, and key PEM required."; return; }
    try {
      const res = await api("/api/tls/upload-pem", { method:"POST", body: JSON.stringify({ name, cert, key }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "PEM saved.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "Upload error: " + e.message;
      return;
    }
  } else {
    certFile = document.getElementById("tlsCustomCert").value.trim();
    keyFile  = document.getElementById("tlsCustomKey").value.trim();
    if (!certFile || !keyFile) { st.textContent = "Cert and key paths required."; return; }
  }
  tlsForwardersState.push({ listen, cert_file: certFile, key_file: keyFile });
  renderTLSForwarders();
  document.getElementById("addTLSPanel").classList.add("hidden");
  st.textContent = "Added. Save config to apply.";
}

// ─── Xray wizard cert source picker ──────────────────────────────────────────
function setWzCertSrc(mode) {
  ["file","paste","gen"].forEach(m => {
    const cap = m.charAt(0).toUpperCase() + m.slice(1);
    document.getElementById("wzCertSrc"+cap).style.display = m === mode ? "" : "none";
    const btn = document.getElementById("wzCertSrc"+cap+"Btn");
    if (btn) btn.className = (m === mode ? "btn btn-sm" : "btn btn-ghost btn-sm");
  });
  document.getElementById("wzPasteCertStatus").textContent = "";
  document.getElementById("wzGenCertStatus").textContent   = "";
}

async function wzSavePastedCert() {
  const st   = document.getElementById("wzPasteCertStatus");
  const name = document.getElementById("wzPastedName").value.trim();
  const cert = document.getElementById("wzPastedCert").value.trim();
  const key  = document.getElementById("wzPastedKey").value.trim();
  if (!name || !cert || !key) { st.textContent = "Name, cert, and key required."; return; }
  st.textContent = "Saving…";
  try {
    const res = await api("/api/tls/upload-pem", { method:"POST", body: JSON.stringify({ name, cert, key }) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("wzTLSCert").value = data.cert_file;
    document.getElementById("wzTLSKey").value  = data.key_file;
    st.textContent = "Saved ✓ paths set.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function wzGenerateCert() {
  const st     = document.getElementById("wzGenCertStatus");
  const domain = document.getElementById("wzGenDomain").value.trim();
  if (!domain) { st.textContent = "Domain required."; return; }
  st.textContent = "Generating…";
  try {
    const res = await api("/api/tls/generate-selfsigned", { method:"POST", body: JSON.stringify({ domain }) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("wzTLSCert").value = data.cert_file;
    document.getElementById("wzTLSKey").value  = data.key_file;
    st.textContent = "Generated ✓ paths set.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── DNSTT Key Management ─────────────────────────────────────────────────────
async function generateDnsttKey() {
  const st = document.getElementById("dnsttKeyStatus");
  st.textContent = "Generating key…";
  try {
    const res = await api("/api/dnstt/genkey", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("cfgDnsttKey").value = data.privkey_file;
    document.getElementById("dnsttPubkeyVal").value = data.pubkey;
    document.getElementById("dnsttPubkeyWrap").classList.remove("hidden");
    st.textContent = "Key generated. Save config to apply.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function loadDnsttPubkey() {
  const st = document.getElementById("dnsttKeyStatus");
  st.textContent = "Loading public key…";
  try {
    const res = await api("/api/dnstt/pubkey");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("dnsttPubkeyVal").value = data.pubkey;
    document.getElementById("dnsttPubkeyWrap").classList.remove("hidden");
    st.textContent = "";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── Xray Client Edit ─────────────────────────────────────────────────────────
function openEditXrayClient(tag, client) {
  editingXrayClientId = client.id;
  document.getElementById("editClientUUID").textContent = client.id;
  document.getElementById("editXrayName").value    = client.name  || "";
  document.getElementById("editXrayEmail").value   = client.email || "";
  document.getElementById("editXrayExpiry").value  = client.expires_at ? localFromISO(client.expires_at) : "";
  document.getElementById("editXrayMaxConns").value = client.max_conns || 0;
  document.getElementById("editXrayClientStatus").textContent = "";
  document.getElementById("editXrayClientPanel").classList.remove("hidden");
  document.getElementById("editXrayClientPanel").scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function closeEditXrayClient() {
  editingXrayClientId = null;
  document.getElementById("editXrayClientPanel").classList.add("hidden");
}

async function saveEditXrayClient() {
  if (!editingXrayClientId) return;
  const st = document.getElementById("editXrayClientStatus");
  st.textContent = "Saving…";
  const payload = {
    uuid:            editingXrayClientId,
    name:            document.getElementById("editXrayName").value.trim(),
    email:           document.getElementById("editXrayEmail").value.trim(),
    expires_at:      isoFromLocal(document.getElementById("editXrayExpiry").value),
    max_connections: parseInt(document.getElementById("editXrayMaxConns").value || "0", 10),
    server_id: selectedXrayServer(),
  };
  try {
    const res = await api("/api/xray/clients/update", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    st.textContent = "Saved.";
    setTimeout(() => { closeEditXrayClient(); loadInbounds({ force: true }); }, 700);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── Xray Config Wizard ────────────────────────────────────────────────────────
function setXrayCfgMode(mode) {
  const wizPane  = document.getElementById("xrayWizardPane");
  const jsonPane = document.getElementById("xrayCfgPaneJson");
  const wizBtn   = document.getElementById("xrayWizardTabBtn");
  const jsonBtn  = document.getElementById("xrayJsonTabBtn");
  if (mode === "wizard") {
    wizPane.classList.remove("hidden");
    jsonPane.classList.add("hidden");
    wizBtn.classList.remove("btn-ghost");
    jsonBtn.classList.add("btn-ghost");
    loadWizardFromConfig();
  } else {
    wizPane.classList.add("hidden");
    jsonPane.classList.remove("hidden");
    jsonBtn.classList.remove("btn-ghost");
    wizBtn.classList.add("btn-ghost");
    loadXrayCfg();
  }
}

document.getElementById("wzLogLevel")?.addEventListener("change", () => { wzDirty = true; });

function cloneJsonSafe(obj) {
  return obj && typeof obj === "object" ? JSON.parse(JSON.stringify(obj)) : obj;
}

function loadWizardFromConfig() {
  const serverID = selectedXrayServer();
  const target = selectedXrayServerLabel();
  const st = document.getElementById("wzStatus");
  wzLoadedServerID = null;
  wzDirty = false;
  if (st) st.textContent = `Loading config from ${target}...`;
  api(withServerParam("/api/xray/config", serverID)).then(async res => {
    if (!res.ok) throw new Error(await res.text());
    const raw = await res.text();
    const cfg = JSON.parse(raw);
    wzLoadedServerID = serverID || "local";
    wzLoadedConfigText = raw;
    wzLoadedFullConfig = cloneJsonSafe(cfg);
    document.getElementById("wzLogLevel").value = cfg.log?.loglevel || "warning";
    wzInbounds = cloneJsonSafe((cfg.inbounds || []).filter(ib => ib && ib.tag !== "api")) || [];
    renderWzInbounds();
    wzDirty = false;
    if (st) st.textContent = `Config loaded from ${target}.`;
  }).catch(e => {
    wzLoadedServerID = null;
    wzLoadedConfigText = "";
    wzLoadedFullConfig = null;
    wzInbounds = [];
    renderWzInbounds();
    if (e.message === "auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  });
}

function renderWzInbounds() {
  const list = document.getElementById("wzInboundsList");
  if (!list) return;
  if (!wzInbounds.length) {
    list.innerHTML = '<div class="hint" style="padding:4px 0;">No inbounds. Click + Add to create one.</div>';
    return;
  }
  list.innerHTML = "";
  wzInbounds.forEach((ib, i) => {
    const row = document.createElement("div");
    row.style = "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.73rem;";
    const portStr = ib.port !== undefined ? `:${ib.port}` : "";
    const ss  = ib.streamSettings || {};
    const net = ss.network || "";
    const sec = ss.security || "";
    const secLabel = sec === "tls" ? " TLS" : sec === "reality" ? " Reality" : "";
    const modeLabel = net === "xhttp" && ss.xhttpSettings?.mode ? " ("+ss.xhttpSettings.mode+")" : "";
    row.innerHTML = `<span class="chip">${ib.protocol}</span>
      <span style="font-family:monospace;">${ib.tag||"untagged"}${portStr}</span>
      <span class="hint" style="flex:1;">${ib.listen||"0.0.0.0"}${net?" · "+net:""}${modeLabel}${secLabel}</span>`;
    const clients = ib.settings?.clients;
    if (Array.isArray(clients) && clients.length) {
      const badge = document.createElement("span");
      badge.className = "chip green";
      badge.textContent = clients.length + " client" + (clients.length!==1?"s":"");
      row.appendChild(badge);
    }
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => { wzInbounds.splice(i,1); wzDirty = true; renderWzInbounds(); };
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function wzToggleAddInbound() {
  const form = document.getElementById("wzAddInboundForm");
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) {
    onWzProtoChange(document.getElementById("wzProtocol").value);
    onWzNetworkChange(document.getElementById("wzNetwork").value);
    onWzTLSChange(document.getElementById("wzTLS").value);
  }
}

function onWzProtoChange(val) {
  const usesClientTransport = val === "vless" || val === "vmess";
  document.getElementById("wzVlessFields").style.display   = usesClientTransport    ? "grid" : "none";
  document.getElementById("wzTrojanFields").style.display  = val === "trojan"       ? "" : "none";
  document.getElementById("wzSSFields").style.display      = val === "shadowsocks"  ? "grid" : "none";

  const tlsSel = document.getElementById("wzTLS");
  const realityOpt = document.querySelector("#wzTLS option[value='reality']");
  if (realityOpt) {
    realityOpt.disabled = val === "vmess";
    if (val === "vmess" && tlsSel.value === "reality") {
      tlsSel.value = "none";
      onWzTLSChange("none");
    }
  }

  const portMap = { vless:10086, vmess:10087, trojan:8443, shadowsocks:8388, socks:10808 };
  const tagMap  = { vless:"vless-in", vmess:"vmess-in", trojan:"trojan-in", shadowsocks:"ss-in", socks:"socks-local" };
  const portEl = document.getElementById("wzPort");
  const tagEl  = document.getElementById("wzTag");
  const lisEl  = document.getElementById("wzListenIP");
  const knownPorts = Object.values(portMap).map(String);
  const knownTags  = Object.values(tagMap);
  if (!portEl.value || knownPorts.includes(portEl.value)) portEl.value = portMap[val] || "";
  if (!tagEl.value || knownTags.includes(tagEl.value))     tagEl.value  = tagMap[val]  || val+"-in";
  if (!lisEl.value || lisEl.value === "0.0.0.0" || lisEl.value === "127.0.0.1") {
    lisEl.value = val === "socks" ? "127.0.0.1" : "0.0.0.0";
  }
}

function onWzNetworkChange(val) {
  const show = (id, v) => document.getElementById(id).style.display = v ? "" : "none";
  // WebSocket
  show("wzWSPathField",      val === "ws");
  // XHTTP
  show("wzXHTTPPathField",   val === "xhttp");
  show("wzXHTTPHostField",   val === "xhttp");
  show("wzXHTTPModeField",   val === "xhttp");
  // HTTPUpgrade
  show("wzHUPathField",      val === "httpupgrade");
  show("wzHUHostField",      val === "httpupgrade");
  // H2
  show("wzH2PathField",      val === "h2");
  show("wzH2HostField",      val === "h2");
  // gRPC
  show("wzGRPCServiceField", val === "grpc");
  show("wzGRPCMultiField",   val === "grpc");
  // Auto-select TLS defaults
  const tlsSel = document.getElementById("wzTLS");
  if ((val === "h2" || val === "grpc") && tlsSel.value === "none") {
    tlsSel.value = "tls"; onWzTLSChange("tls");
  }
}

function onWzTLSChange(val) {
  const show = (id, v) => document.getElementById(id).style.display = v ? "" : "none";
  show("wzTLSCertBlock",       val === "tls");
  show("wzRealityDestField",   val === "reality");
  show("wzRealitySNIField",    val === "reality");
  show("wzRealityPrivField",   val === "reality");
  show("wzRealityShortIDField",val === "reality");
}

function wzSaveInbound() {
  const proto  = document.getElementById("wzProtocol").value;
  const port   = parseInt(document.getElementById("wzPort").value || "0", 10);
  const listen = document.getElementById("wzListenIP").value.trim() || "0.0.0.0";
  const tag    = document.getElementById("wzTag").value.trim() || proto+"-in";
  if (!port) { alert("Port required."); return; }
  const ib = { tag, port, listen, protocol: proto, settings: {} };
  if (proto === "vless" || proto === "vmess") {
    ib.settings = proto === "vless" ? { clients: [], decryption: "none" } : { clients: [] };
    const net    = document.getElementById("wzNetwork").value;
    const tlsVal = document.getElementById("wzTLS").value;
    ib.streamSettings = { network: net };
    // Transport-specific settings
    switch (net) {
      case "ws":
        ib.streamSettings.wsSettings = { path: document.getElementById("wzWSPath").value.trim() || "/" };
        break;
      case "xhttp":
        ib.streamSettings.xhttpSettings = {
          path: document.getElementById("wzXHTTPPath").value.trim() || "/",
          host: document.getElementById("wzXHTTPHost").value.trim() || undefined,
          mode: document.getElementById("wzXHTTPMode").value,
        };
        if (!ib.streamSettings.xhttpSettings.host) delete ib.streamSettings.xhttpSettings.host;
        break;
      case "httpupgrade":
        ib.streamSettings.httpupgradeSettings = {
          path: document.getElementById("wzHUPath").value.trim() || "/",
          host: document.getElementById("wzHUHost").value.trim() || undefined,
        };
        if (!ib.streamSettings.httpupgradeSettings.host) delete ib.streamSettings.httpupgradeSettings.host;
        break;
      case "h2":
        ib.streamSettings.httpSettings = {
          path: document.getElementById("wzH2Path").value.trim() || "/",
          host: [document.getElementById("wzH2Host").value.trim()].filter(Boolean),
        };
        break;
      case "grpc":
        ib.streamSettings.grpcSettings = {
          serviceName: document.getElementById("wzGRPCService").value.trim() || "grpc",
          multiMode:   document.getElementById("wzGRPCMulti").checked,
        };
        break;
    }
    // TLS / Reality
    if (tlsVal === "tls") {
      ib.streamSettings.security = "tls";
      ib.streamSettings.tlsSettings = {
        certificates: [{ certificateFile: document.getElementById("wzTLSCert").value.trim(), keyFile: document.getElementById("wzTLSKey").value.trim() }],
      };
    } else if (tlsVal === "reality" && proto === "vless") {
      ib.streamSettings.security = "reality";
      ib.streamSettings.realitySettings = {
        dest:        document.getElementById("wzRealityDest").value.trim(),
        serverNames: [document.getElementById("wzRealitySNI").value.trim()].filter(Boolean),
        privateKey:  document.getElementById("wzRealityPriv").value.trim(),
        shortIds:    [document.getElementById("wzRealityShortID").value.trim()].filter(Boolean),
      };
    }
  } else if (proto === "trojan") {
    ib.settings = { clients: [{ password: document.getElementById("wzTrojanPass").value.trim() || "change-me" }] };
    ib.streamSettings = { network: "tcp", security: "tls", tlsSettings: {} };
  } else if (proto === "shadowsocks") {
    ib.settings = { method: document.getElementById("wzSSMethod").value, password: document.getElementById("wzSSPass").value.trim() || "change-me", network: "tcp,udp" };
  } else if (proto === "socks") {
    ib.settings = { auth: "noauth", udp: true };
    ib.streamSettings = { network: "tcp" };
  }
  wzInbounds.push(ib);
  wzDirty = true;
  renderWzInbounds();
  document.getElementById("wzAddInboundForm").classList.add("hidden");
  document.getElementById("wzPort").value = "";
  document.getElementById("wzTag").value  = "";
  document.getElementById("wzListenIP").value = "";
}


function buildConfigFromVisualEditor() {
  const selectedID = selectedXrayServer() || "local";
  if (!wzLoadedConfigText || String(wzLoadedServerID || "") !== String(selectedID)) {
    throw new Error("config for this server is not loaded yet");
  }

  let cfg;
  try {
    cfg = JSON.parse(wzLoadedConfigText);
  } catch (_) {
    cfg = cloneJsonSafe(wzLoadedFullConfig || {});
  }
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw new Error("loaded config is not an object");
  }

  // Preserve the selected server's full JSON exactly as the base.
  // The visual tab is intentionally conservative: it only updates fields that
  // are visible here, so pressing Save cannot wipe routing/outbounds/policy/etc.
  cfg.log = cfg.log && typeof cfg.log === "object" ? cfg.log : {};
  cfg.log.loglevel = document.getElementById("wzLogLevel")?.value || cfg.log.loglevel || "warning";

  const existingInbounds = Array.isArray(cfg.inbounds) ? cfg.inbounds : [];
  const hiddenApiInbounds = existingInbounds.filter(ib => ib && ib.tag === "api");
  const visualInbounds = cloneJsonSafe((wzInbounds || []).filter(ib => ib && ib.tag !== "api")) || [];
  cfg.inbounds = [...hiddenApiInbounds, ...visualInbounds];

  return cfg;
}

function updateFullConfigFromWizard() {
  const cfg = buildConfigFromVisualEditor();
  wzLoadedFullConfig = cloneJsonSafe(cfg);
  return cfg;
}

async function applyWizardConfig() {
  const st = document.getElementById("wzStatus");
  const target = selectedXrayServerLabel();
  const selectedID = selectedXrayServer() || "local";

  if (String(wzLoadedServerID || "") !== String(selectedID) || !wzLoadedConfigText) {
    if (st) st.textContent = `Reloading config from ${target} before saving...`;
    loadWizardFromConfig();
    return;
  }

  let cfg;
  try {
    cfg = buildConfigFromVisualEditor();
  } catch(e) {
    if (st) st.textContent = `Invalid visual config: ${e.message}`;
    return;
  }

  if (st) st.textContent = `Saving config to ${target}...`;
  try {
    const body = JSON.stringify(cfg, null, 2);
    const res = await api(withServerParam("/api/xray/config", selectedID), { method:"POST", body });
    if (!res.ok) throw new Error(await res.text());
    wzLoadedConfigText = body;
    wzLoadedFullConfig = cloneJsonSafe(cfg);
    wzLoadedServerID = selectedID;
    wzDirty = false;
    if (st) st.textContent = `Saved on ${target}. Restarting Xray...`;
    await xrayCtrl("restart");
    if (st) st.textContent = `Config saved on ${target} and Xray restarted.`;
    setTimeout(() => { loadXrayStatus(); loadInbounds({ force: true }); }, 700);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else if (st) st.textContent = "Error: " + e.message;
  }
}

// ─── Auth error ───────────────────────────────────────────────────────────────
function doAuthError() {
  sessionToken = "";
  localStorage.removeItem("SESSION_TOKEN");
  clearTimers();
  mainApp.classList.add("hidden");
  loginOverlay.classList.remove("hidden");
  loginErr.textContent = t("Session expired — please sign in again.");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
  if (sessionToken) {
    // Try to validate the stored token
    api("/api/auth/me").then(async res => {
      if (!res.ok) { doAuthError(); return; }
      const d = await res.json();
      currentRole = d.role;
      currentUser = d.username;
      loginOverlay.classList.add("hidden");
      mainApp.classList.remove("hidden");
      initAfterLogin();
    }).catch(() => doAuthError());
  } else {
    loginOverlay.classList.remove("hidden");
  }
});
