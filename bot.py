import requests
import json
import sys

# ============ НАСТРОЙКИ ============
BASE_URL = "https://openwebui.dnsresolverproblem.space"
API_KEY = "apikey"
MODEL   = "centrinvesthelper"
FILE_ID = "c595dd23-aa1c-42d1-a0a9-ba058b499890"  # ID вашего PDF из knowledge
QUESTION = "Расскажи кратко об образовательном кредите."       # ← имя вашей модели
TOP_K    = 5
RETRIEVAL_URL = f"{BASE_URL}/api/v1/retrieval/query"
# ===================================


HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type":  "application/json",
}


def ask_model(history: list, user_message: str) -> str:
    """
    Отправляет историю + новый вопрос с приложенным файлом.
    Файл передаётся в поле files внутри сообщения пользователя —
    Open WebUI сам делает RAG по этому файлу.
    """
    messages = list(history)  # копируем историю
    messages.append({
        "role": "user",
        "content": user_message,
        "files": [
            {"type": "file", "id": FILE_ID}
        ],
    })

    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
    }

    r = requests.post(f"{BASE_URL}/api/chat/completions",
                      headers=HEADERS, json=payload, timeout=300)

    if r.status_code != 200:
        print(f"❌ HTTP {r.status_code}: {r.text[:500]}", file=sys.stderr)
        return ""

    try:
        data = r.json()
    except json.JSONDecodeError:
        print("❌ Не удалось разобрать JSON:", r.text[:500], file=sys.stderr)
        return ""

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        print("⚠️ Неожиданный формат ответа:", file=sys.stderr)
        print(json.dumps(data, ensure_ascii=False, indent=2)[:800], file=sys.stderr)
        return ""


def main():
    print("💬 Интерактивный чат с моделью «Центр-инвест»")
    print("   Файл-база знаний прикладывается к каждому запросу автоматически.")
    print("   Команды: 'выход' / 'exit' — завершить, 'очистить' / 'clear' — сбросить историю.")
    print()

    history = []  # список пар {"role": "user"/"assistant", "content": "..."}

    while True:
        try:
            user_input = input("Вы: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nДо свидания!")
            break

        if not user_input:
            continue

        cmd = user_input.lower()

        if cmd in ("выход", "exit", "quit", "q"):
            print("До свидания!")
            break

        if cmd in ("очистить", "clear", "reset"):
            history.clear()
            print("🧹 История диалога очищена.\n")
            continue

        print("⏳ Думаю...\n")

        answer = ask_model(history, user_input)
        if not answer:
            print("⚠️ Пустой ответ от модели.\n")
            continue

        print(f"Бот: {answer}\n")

        # Обновляем историю — только user/assistant, файлы не сохраняем
        history.append({"role": "user",      "content": user_input})
        history.append({"role": "assistant", "content": answer})

        # Опционально: ограничить длину истории, чтобы не раздувать промпт
        if len(history) > 20:
            history = history[-20:]


if __name__ == "__main__":
    main()
