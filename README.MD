# Vorbereitung

```
node version > 16
```

# Einrichten

## Abhängigkeiten installieren

```
yarn
```

oder

```
npm i
```

## Telegram Bot erstellen
Am einfachsten einen Chat mit dem [BotFather](https://t.me/botfather) eröffnen und mit dem Kommando `/newbot` einen Bot erstellen.  
Den Anweisungen folgen und den erstellten Token speichern.

# Umgebungsvariablen

Eine `.env` Datei anlegen mit folgenden Werten:

## PORT

Der gewünschte Port für die API

## BOT_TOKEN

Der von Telegram bereitgestellte Bot Token

## DB_PATH

Ein absoluter Dateipfad auf eine JSON-Datei welche als Datenbank genutzt wird.  
Beispiel: `C:\Users\Admin\Desktop\db.json`

## IMPORT_DUMMY_ZBAU

Ein Optionaler Dateipfad zu einer Datei welche den Seitenquelltext von `https://z-bau.de/programm/` enthält.  
Hiermit kann ein HTTP-Request beim Import umgangen werden.

# Starten

## API

```
yarn dev-api
```

oder

```
npm run dev-api
```

## Bot

```
yarn dev-bot
```

oder

```
npm run dev-bot
```

# Benutzen

## API

### POST `/import/zbau`

Importiert die Events von der ZBau Webseite

### GET `/events`

Filtern der Events.

#### Parameter `categories`

Kommaseparierte Liste von Kategorien

#### Parameter `text`

Textfilter

#### Parameter `nextWeekend = 1`

Filtert nach Veranstaltungen am kommenden Wochenende

## Bot

### `/import`

Importiert die Events von der ZBau Webseite

### `/categories`

Gibt eine Auswahl der vorhandenen Kategorien

### `/weekend`

Gibt die Veranstaltungen am kommenden (aktuellen) Wochenende aus

### `/events [query]`

Gibt die nächsten Events oder Events mit Textfilter zurück
