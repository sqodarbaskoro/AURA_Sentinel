
# AURA Sentinel 🌍

**Automated Universal Risk Analysis** (AURA) is a real-time disaster monitoring platform for Southeast Asia. It leverages the Google Gemini API to analyze news and geological data, providing risk assessments and spread predictions for natural disasters.

## Features

- 🗺️ **Interactive Map**: Real-time visualization of disaster events across SEA using Leaflet.
- 🤖 **AI-Powered Analysis**: Uses Gemini 2.5 Flash to generate risk scores, situation summaries, and predictive impacts.
- ✏️ **Custom Watch Zones**: Draw and save custom polygonal areas on the map to monitor specific regions.
- 🔔 **Alert System**: Configurable alerts for specific disaster types and severity levels.
- 📊 **Analytics Dashboard**: Visual data representation of risk trends.
- 📄 **Report Generation**: Export professional risk assessment reports for printing.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Mapping**: Leaflet, React-Leaflet
- **AI**: Google Gemini API (@google/genai)
- **Icons**: Lucide React
- **Charts**: Recharts

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (API Key for Gemini).
4. Run the development server:
   ```bash
   npm start
   ```

## License

MIT
