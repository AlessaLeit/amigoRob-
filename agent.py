# Copyright (c) Microsoft. All rights reserved.

import asyncio
import os
from dotenv import load_dotenv

import azure.cognitiveservices.speech as speechsdk
from agent_framework import ChatAgent
from agent_framework.azure import AzureAIAgentClient
from azure.ai.agents.aio import AgentsClient
from azure.ai.projects.aio import AIProjectClient
from azure.identity.aio import AzureCliCredential

"""
Azure AI Agent with Existing Agent Example

This sample demonstrates working with pre-existing Azure AI Agents by providing
agent IDs, showing agent reuse patterns for production scenarios.
"""


async def main() -> None:
    # Load environment variables from .env file
    load_dotenv()

    print("=== Azure AI Chat Client with Existing Agent ===")

    # Get endpoint and ensure it uses HTTPS
    endpoint = os.environ["AZURE_AI_PROJECT_ENDPOINT"]
    if not endpoint.startswith("https://"):
        if endpoint.startswith("http://"):
            endpoint = endpoint.replace("http://", "https://")
        else:
            endpoint = "https://" + endpoint
        print(f"Updated endpoint to HTTPS: {endpoint}")

    # Create the client
    async with (
        AzureCliCredential() as credential,
        AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
        AgentsClient(endpoint=endpoint, credential=credential) as agents_client,

    ):
        azure_ai_agent = await agents_client.create_agent(
            model=os.environ["AZURE_AI_MODEL_DEPLOYMENT_NAME"],
            # Create remote agent with default instructions
            # These instructions will persist on created agent for every run.
            instructions="""Você é um agente educacional seu papel é ajudar crianças pequenas (de 4 a 7 anos) a aprender palavras de forma divertida e gentil. A criança fala uma palavra em voz alta, você deve ouvir o que foi dito e responder com frases curtas, alegres e compreensíveis. Você deve verificar se a palavra dita corresponde à palavra correta esperada. Se estiver correta, elogie e repita a palavra.
            Se estiver incorreta ou mal pronunciada, diga a forma certa e incentive a repetir. Sempre mantenha um tom gentil, positivo e animado. Use frases simples e curtas, com palavras comuns. Evite respostas longas, termos técnicos ou correções duras e evite sarcasmo, ironia ou comparações. Se perceber que a criança acerta várias vezes seguidas, comemore com entusiasmo: “Uau! Você está arrasando!”, “Parabéns! Você está aprendendo muito rápido!”
            REGRAS GERAIS:
            - Fale apenas o necessário para a criança entender e repetir.
            - Mantenha o foco em ensino de palavras simples (animais, objetos, cores, números, etc).
            - Responda sempre em português do Brasil, evite sotaques.
            - Nunca peça dados pessoais, nomes completos ou informações sensíveis.
            MISSÃO: Ajudar as crianças a aprender palavras de forma educativa, segura e acolhedora.
            EXEMPLOS DE RESPOSTA:
            - Correto: “Muito bem! Você falou gato!”
            - Correto: “Excelente! Você acertou, isso é bola!”
            - Quase: “Quase! Isso é "flor". Vamos tentar de novo?”
            - Quase: “Você quis dizer "peixe"? Vamos repetir juntos!”""",
        )

        chat_client = AzureAIAgentClient(agents_client=agents_client, agent_id=azure_ai_agent.id)

        try:
            async with ChatAgent(
                chat_client=chat_client
            ) as agent:
                query = ""
                # Configura o serviço de Fala do Azure
                speech_config = speechsdk.SpeechConfig(
                    subscription=os.environ["AZURE_SPEECH_KEY"],
                    region=os.environ["AZURE_SPEECH_REGION"]
                )
                speech_config.speech_recognition_language = "pt-BR"
                audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
                speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

                print("Pode falar a palavra, estou ouvindo...")

                # Inicia o reconhecimento de fala
                speech_recognition_result = await speech_recognizer.recognize_once_async()

                if speech_recognition_result.reason == speechsdk.ResultReason.RecognizedSpeech:
                    query = speech_recognition_result.text
                    print(f"Você disse: {query}")
                elif speech_recognition_result.reason == speechsdk.ResultReason.NoMatch:
                    print("Ops, não consegui entender o que você disse.")
                elif speech_recognition_result.reason == speechsdk.ResultReason.Canceled:
                    cancellation_details = speech_recognition_result.cancellation_details
                    print(f"Reconhecimento de fala cancelado: {cancellation_details.reason}")

                if query:
                    result = await agent.run(query)
                    print(f"Agent: {result}\n")
        finally:
            # Clean up the agent manually
            await agents_client.delete_agent(azure_ai_agent.id)


if __name__ == "__main__":
    asyncio.run(main())