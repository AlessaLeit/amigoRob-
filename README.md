# Amigo Robõ - Agente Educacional de Voz

## 📚 Descrição do Projeto

O **Amigo Robõ** é um agente educacional inteligente desenvolvido para ajudar crianças de 4 a 7 anos a aprender palavras de forma divertida e interativa através de conversas por voz. O projeto utiliza tecnologias avançadas de IA da Microsoft Azure para criar uma experiência educacional segura, acolhedora e envolvente.

### 🎯 Objetivo do Agente

O agente tem como missão principal auxiliar no desenvolvimento linguístico de crianças pequenas, focando em:
- Ensino de palavras simples (animais, objetos, cores, números)
- Correção gentil e positiva de pronúncia
- Manutenção de um ambiente seguro e educativo
- Respostas sempre em português brasileiro

## 🚀 Funcionalidades

### Agente VoiceLive (Tempo Real)
- **Conversação em tempo real** usando Azure VoiceLive SDK
- **Reconhecimento de fala** contínuo e natural
- **Síntese de voz** com voz brasileira 
- **Interrupção inteligente** - permite que a criança interrompa o agente

### Agente Foundry (Azure AI Agent)
- **Integração com Azure AI Foundry** para criação de agentes
- **Reconhecimento de fala** via Azure Speech Services
- **Respostas contextuais** baseadas em instruções específicas
- **Gerenciamento automático** de ciclo de vida do agente

## 🛠️ Tecnologias Utilizadas

- **Azure VoiceLive SDK** - Para conversação em tempo real
- **Azure AI Agent Framework** - Para criação de agentes inteligentes
- **Azure Speech Services** - Para reconhecimento e síntese de voz
- **Azure AI Foundry** - Plataforma de desenvolvimento de agentes
- **Python 3.13+** - Linguagem de programação
- **PyAudio** - Processamento de áudio
- **AsyncIO** - Programação assíncrona

## 📋 Pré-requisitos

- Python 3.13 ou superior
- Conta Azure com acesso aos serviços:
  - Azure AI Foundry
  - Azure Speech Services
  - Azure VoiceLive
- Microfone e alto-falantes funcionais
- Chaves de API válidas

## 🔧 Instalação e Configuração

### 1. Clonagem do Repositório
```bash
git clone https://github.com/seu-usuario/eduvoice-agent.git
cd eduvoice-agent
```

### 2. Instalação de Dependências
```bash
pip install uv
uv sync
```

### 3. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Azure AI Project
AZURE_AI_PROJECT_ENDPOINT=https://your-project.openai.azure.com/
AZURE_AI_MODEL_DEPLOYMENT_NAME=gpt-4o

# Azure Speech Services
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus

# Azure VoiceLive
AZURE_VOICELINE_API_KEY=your-voicelive-key
AZURE_VOICELINE_ENDPOINT=wss://eastus.api.speech.microsoft.com/voice-live/v1
VOICELINE_MODEL=gpt-4o-realtime-preview
VOICELINE_VOICE=en-US-JennyNeural
```

## 🎮 Como Usar

### Agente VoiceLive 
```bash
uv run python voicelive_agent.py --model gpt-4o-realtime-preview --verbose
```

### Comandos Disponíveis
- `--model`: Especifica o modelo de IA (padrão: gpt-4o-realtime-preview)
- `--voice`: Escolhe a voz do agente (padrão: en-US-JennyNeural)
- `--verbose`: Ativa logs detalhados

## 📸 Prints e Demonstrações

### 1. Criação do Agente no Azure Foundry
![Criação do Agente](images/criacao_agente.png)

### 2. Alteração de Fala e Resposta
![Alteração de Fala](images/alteracao_fala.png)

### 3. Cópia do Código do Agente
![Cópia do Código](images/copia_cod_agente.png)

### 4. Alterações e Testes
![Alterações e Testes](images/alteracoes_testes.png)

### 5. Testes de Execução
![Testes de Execução](images/testes_execucao.png)

### 3. Logs de Execução do VoiceLive Agent
```
🎙️  Basic Voice Assistant with Azure VoiceLive SDK
==================================================
2025-11-17 21:52:32,931 - __main__ - INFO - Using API key credential
2025-11-17 21:52:32,931 - __main__ - INFO - Connecting to VoiceLive API with model gpt-4o-realtime-preview
2025-11-17 21:52:33,595 - __main__ - INFO - AudioProcessor initialized with 24kHz PCM16 mono audio
2025-11-17 21:52:33,595 - __main__ - INFO - Setting up voice conversation session...
2025-11-17 21:52:33,602 - __main__ - INFO - Session configuration sent
2025-11-17 21:52:33,662 - __main__ - INFO - Audio playback system ready
2025-11-17 21:52:33,662 - __main__ - INFO - Voice assistant ready! Start speaking...
============================================================
🎤 VOICE ASSISTANT READY
Start speaking to begin conversation
Press Ctrl+C to exit
============================================================
```

### 4. Exemplos de Interação
- **Criança:** "Gato"
- **Agente:** "Muito bem! Você falou gato!"

- **Criança:** "Pexe" (pronúncia incorreta)
- **Agente:** "Quase! Isso é 'peixe'. Vamos tentar de novo?"

## 🔄 Fluxo de Funcionamento

1. **Inicialização**: O agente conecta aos serviços Azure e configura o sistema de áudio
2. **Pronto para Conversar**: Sistema aguarda entrada de voz
3. **Reconhecimento**: Processa fala da criança em tempo real
4. **Análise**: Verifica se a palavra está correta ou precisa de correção
5. **Resposta**: Fornece feedback positivo e educativo
6. **Continuação**: Mantém conversa até interrupção manual

## 📚 Ações Funcionais Implementadas

### 1. Ensino de Vocabulário
- **Descrição**: Corrige pronúncia e ensina palavras
- **Exemplo**: Converte pronúncias incorretas em corretas
- **Framework**: Azure VoiceLive para tempo real

### 2. Reconhecimento de Fala
- **Descrição**: Identifica palavras faladas pela criança
- **Tecnologia**: Azure Speech Services
- **Idioma**: Português Brasileiro

### 3. Síntese de Voz Educativa
- **Descrição**: Respostas com tom gentil e positivo
- **Voz**: Jenny Neural (en-US-JennyNeural)
- **Personalização**: Instruções específicas para educação infantil

## 🔗 Links de Referências

### Documentação Oficial
- [Azure AI Foundry](https://ai.azure.com/)
- [Azure VoiceLive SDK](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-overview)
- [Azure Speech Services](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [Azure AI Agent Framework](https://learn.microsoft.com/en-us/azure/ai-services/agents/)

### Power Automate
- [Integração com Power Automate](https://learn.microsoft.com/en-us/connectors/azureaiservices/)
- [Fluxos de Automação](https://learn.microsoft.com/en-us/power-automate/)

### Recursos Educacionais
- [Azure for Education](https://azure.microsoft.com/en-us/overview/education/)
- [AI for Accessibility](https://www.microsoft.com/en-us/accessibility/)

## 🏗️ Arquitetura do Projeto

```
eduvoice-agent/
├── voicelive_agent.py      # Agente principal com VoiceLive
├── agent.py                # Agente usando Azure AI Framework
├── pyproject.toml          # Dependências do projeto
├── .env                    # Variáveis de ambiente (não versionado)
├── README.md               # Esta documentação
├── images/                 # Prints e screenshots
│   ├── criacao_agente.png
│   ├── alteracao_fala.png
│   ├── copia_cod_agente.png
│   ├── alteracoes_testes.png
│   └── testes_execucao.png
└── .gitignore             # Arquivos ignorados pelo Git
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de Modelo Não Suportado**
   - Solução: Use `--model gpt-4o-realtime-preview`

2. **Erro de Loop Fechado**
   - Solução: Correção aplicada na versão atual

3. **Problemas de Áudio**
   - Verifique microfone e alto-falantes
   - Teste permissões de áudio do sistema

4. **Erros de Autenticação**
   - Verifique chaves de API no arquivo `.env`
   - Confirme região dos serviços Azure


## 👨‍💻 Autora

**Alessandra** - Desenvolvimento do Amigo Robõ

---

**Nota**: Este projeto foi desenvolvido como parte de um desafio educacional do Azure Frontier Girls, demonstrando a integração de múltiplas tecnologias Azure para criar soluções de IA acessíveis e educativas.
